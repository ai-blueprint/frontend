import store from '@/store.js'                     // 引入全局状态
import generateId from '@/utils/generateId.js'     // 引入ID生成器
import Edge from '@/commands/Edge.js'              // 引入连接线命令
import { normalizeIds } from '@/utils/normalize.js' // 引入ID归一化工具

// --- 选中节点（支持单个ID、数组、对象）---
const select = (nodeId) => {
    const ids = normalizeIds(nodeId)                              // 统一转为ID数组
    store.blueprint.nodes.forEach(node => {
        if (ids.includes(node.id)) node.selected = true             // 命中的节点标记为选中
    })
}

// --- 选中全部节点 ---
const selectAll = () => {
    store.blueprint.nodes.forEach(node => {
        node.selected = true                                        // 每个节点都标记为选中
    })
}

// --- 切换选中状态 ---
const toggleSelect = (nodeId) => {
    const node = store.blueprint.nodes.find(node => node.id === nodeId) // 找到目标节点
    if (!node) return                                             // 节点不存在直接返回
    node.selected = !node.selected                                // 反转选中状态
}

// --- 清空所有选中 ---
const clearSelect = () => {
    store.blueprint.nodes.forEach(node => {
        node.selected = false                                       // 每个节点都取消选中
    })
}

// --- 创建节点 ---
const add = (opcode, x, y) => {
    const definition = store.registry.nodes[opcode]               // 从注册表查找节点定义
    if (!definition) return null                                  // 找不到定义返回null

    const nodeId = generateId()                                   // 生成唯一ID

    // --- 深拷贝参数默认值 ---
    const params = {}                                             // 新参数对象
    Object.keys(definition.params || {}).forEach(key => {
        params[key] = JSON.parse(JSON.stringify(definition.params[key])) // 深拷贝每个参数
    })

    const newNode = {                                             // 构建新节点对象
        id: nodeId,                                                 // 节点唯一ID
        type: 'baseNode',                                           // 统一使用自定义节点类型
        position: { x: x || 0, y: y || 0 },                        // 节点位置，默认原点
        data: {                                                     // 节点数据
            opcode: definition.opcode,                                // 节点操作码
            label: definition.label,                                  // 节点显示名称
            ports: JSON.parse(JSON.stringify(definition.ports)),      // 深拷贝端口定义
            params,                                                   // 参数对象
        },
        selected: false,                                            // 默认未选中
        tensorImage: null,                                          // 默认无可视化图
        error: null,                                                // 默认无错误
    }

    store.blueprint.nodes.push(newNode)                           // 将新节点加入蓝图
    return nodeId                                                 // 返回新节点ID
}

// --- 删除节点（支持单个ID、数组）---
const remove = (nodeId) => {
    const ids = normalizeIds(nodeId)                              // 统一转为ID数组
    ids.forEach(id => {
        const relatedEdges = Edge.getByNode(id)                     // 获取关联的连接线
        const edgeIds = relatedEdges.map(edge => edge.id)           // 提取连接线ID
        Edge.remove(edgeIds)                                        // 批量删除关联连接线
        const nodeIndex = store.blueprint.nodes.findIndex(node => node.id === id) // 找到节点索引
        if (nodeIndex !== -1) store.blueprint.nodes.splice(nodeIndex, 1)    // 删除节点
    })
}

// --- 删除所有选中节点 ---
const removeSelected = () => {
    const selectedIds = store.blueprint.nodes
        .filter(node => node.selected)                              // 筛选选中的节点
        .map(node => node.id)                                       // 提取ID
    if (selectedIds.length) remove(selectedIds)                   // 批量删除
}

// --- 重命名节点 ---
const rename = (nodeId, newLabel) => {
    const node = store.blueprint.nodes.find(node => node.id === nodeId) // 找到目标节点
    if (!node) return                                             // 节点不存在直接返回
    node.data.label = newLabel                                    // 修改节点显示名称
}

// --- 更新节点参数 ---
const updateParam = (nodeId, paramKey, value) => {
    const node = store.blueprint.nodes.find(node => node.id === nodeId) // 找到目标节点
    if (!node) return                                             // 节点不存在直接返回
    if (!node.data.params[paramKey]) return                       // 参数不存在直接返回
    node.data.params[paramKey].value = value                      // 更新参数值
}

// --- 根据ID获取节点 ---
const getById = (nodeId) => {
    return store.blueprint.nodes.find(node => node.id === nodeId) || null // 返回匹配的节点或null
}

// --- 获取所有选中节点 ---
const getSelected = () => {
    return store.blueprint.nodes.filter(node => node.selected)    // 返回所有选中节点数组
}

// --- 打开节点菜单 ---
const openContextMenu = (nodeId) => {
    if (!nodeId) return                                            // 没有节点ID直接返回
    store.nodeContext.nodeId = nodeId                              // 绑定菜单到节点
    store.nodeContext.visible = true                               // 显示菜单
}

// --- 关闭节点菜单 ---
const closeContextMenu = () => {
    store.nodeContext.visible = false                              // 隐藏菜单
}

export default { select, selectAll, toggleSelect, clearSelect, add, remove, removeSelected, rename, updateParam, getById, getSelected, openContextMenu, closeContextMenu } // 导出所有节点命令
