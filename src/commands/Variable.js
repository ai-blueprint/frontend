import store from '@/store.js'                     // 引入全局状态
import generateId from '@/utils/generateId.js'     // 引入ID生成器
import { isValidVariableName } from '@/utils/expression.js' // 引入变量名校验规则

// --- 生成不与现有变量冲突的默认名称 ---
const createDefaultName = () => {
    const usedNames = new Set(store.blueprint.variables.map(variable => variable.name)) // 收集已占用名称
    let index = 1                                                 // 从"变量1"风格的字母序号开始尝试
    while (usedNames.has(`VAR${index}`)) index++                  // 顺延到第一个未占用序号
    return `VAR${index}`                                          // 返回可直接使用的默认名
}

// --- 校验值是否为数字或数字列表 ---
const isValidValue = (value) => {
    const isNumber = (item) => typeof item === 'number' && Number.isFinite(item) // 变量值必须是有限数字
    if (isNumber(value)) return true                              // 标量数字合法
    return Array.isArray(value) && value.length > 0 && value.every(isNumber) // 非空全数字列表合法
}

// --- 创建变量 ---
const add = (name, value = 8) => {
    const finalName = name || createDefaultName()                 // 未指定名称时自动生成
    if (!isValidVariableName(finalName)) return null              // 非法名称不进入变量表
    if (store.blueprint.variables.some(variable => variable.name === finalName)) return null // 重名会让引用歧义
    if (!isValidValue(value)) return null                         // 非法值不进入变量表

    const variableId = generateId()                               // 生成稳定引用ID
    store.blueprint.variables.push({ id: variableId, name: finalName, value }) // 加入蓝图变量列表
    return variableId                                             // 返回新变量ID
}

// --- 重命名变量 ---
const rename = (variableId, newName) => {
    const variable = store.blueprint.variables.find(item => item.id === variableId) // 找到目标变量
    if (!variable) return false                                   // 变量不存在直接返回
    if (!isValidVariableName(newName)) return false               // 非法名称拒绝写入
    if (store.blueprint.variables.some(item => item.id !== variableId && item.name === newName)) return false // 拒绝与其他变量重名

    const oldName = variable.name                                 // 记录旧名称用于同步引用
    variable.name = newName                                       // 更新变量名称
    renameReferences(oldName, newName)                            // 同步所有参数表达式中的引用
    return true                                                   // 告知面板重命名成功
}

// --- 更新变量值 ---
const updateValue = (variableId, value) => {
    const variable = store.blueprint.variables.find(item => item.id === variableId) // 找到目标变量
    if (!variable) return false                                   // 变量不存在直接返回
    if (!isValidValue(value)) return false                        // 非法值拒绝写入
    variable.value = value                                        // 更新变量值，引用节点在下一轮运行自动生效
    return true                                                   // 告知面板更新成功
}

// --- 删除变量 ---
const remove = (variableId) => {
    const index = store.blueprint.variables.findIndex(item => item.id === variableId) // 找到目标索引
    if (index === -1) return false                                // 变量不存在直接返回
    store.blueprint.variables.splice(index, 1)                    // 从列表移除，引用它的表达式将显示未定义错误
    return true                                                   // 告知面板删除成功
}

// --- 找出引用某个变量名的节点 ---
const getReferences = (name) => {
    const pattern = new RegExp(`\\b${name}\\b`)                   // 只匹配完整变量名，避免D命中HEAD
    const references = []                                          // 收集{nodeId, paramKey}引用位置
    store.blueprint.nodes.forEach(node => {
        Object.entries(node.data?.params || {}).forEach(([paramKey, param]) => {
            const value = param?.value                            // 参数当前值
            if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.expr === 'string' && pattern.test(value.expr)) {
                references.push({ nodeId: node.id, paramKey })    // 表达式参数中出现该变量
            }
        })
    })
    return references                                             // 返回全部引用位置供删除确认和重命名
}

// --- 重命名后同步所有表达式引用 ---
const renameReferences = (oldName, newName) => {
    const pattern = new RegExp(`\\b${oldName}\\b`, 'g')           // 全局替换完整旧名称
    getReferences(oldName).forEach(({ nodeId, paramKey }) => {
        const node = store.blueprint.nodes.find(item => item.id === nodeId) // 找到引用节点
        if (!node) return                                         // 节点已删除时无需处理
        const param = node.data.params[paramKey]                  // 找到引用参数
        param.value = { expr: param.value.expr.replace(pattern, newName) } // 替换表达式中的变量名
    })
}

// --- 根据ID获取变量 ---
const getById = (variableId) => {
    return store.blueprint.variables.find(item => item.id === variableId) || null // 返回匹配变量或null
}

export default { add, rename, updateValue, remove, getReferences, getById } // 导出所有变量命令
