import store from '@/store.js'                     // 引入全局状态
import generateId from '@/utils/generateId.js'     // 引入ID生成器

// --- 创建连接线 ---
const add = (source, sourcePort, target, targetPort) => {
    const existing = getByInputPort(target, targetPort)           // 检查输入端口是否已有连线
    if (existing) remove(existing.id)                             // 已有连线就先删掉旧的

    const edgeId = generateId()                                   // 生成唯一ID

    const newEdge = {                                             // 构建新连接线对象
        id: edgeId,                                                 // 连接线唯一ID
        source,                                                     // 来源节点ID
        sourceHandle: sourcePort,                                   // 来源端口标识
        target,                                                     // 目标节点ID
        targetHandle: targetPort,                                   // 目标端口标识
    }

    store.blueprint.edges.push(newEdge)                           // 将连接线加入蓝图
    return edgeId                                                 // 返回新连接线ID
}

// --- 删除连接线（支持单个ID、数组）---
const remove = (edgeId) => {
    const ids = normalizeIds(edgeId)                              // 统一转为ID数组
    ids.forEach(id => {
        const index = store.blueprint.edges.findIndex(e => e.id === id) // 找到连接线索引
        if (index !== -1) store.blueprint.edges.splice(index, 1)       // 删除连接线
    })
}

// --- 获取节点相关的所有连接线 ---
const getByNode = (nodeId) => {
    return store.blueprint.edges.filter(e => e.source === nodeId || e.target === nodeId) // 过滤关联线
}

// --- 获取端口的所有连接线 ---
const getByPort = (nodeId, portKey) => {
    return store.blueprint.edges.filter(e =>
        (e.source === nodeId && e.sourceHandle === portKey) ||       // 匹配输出端口
        (e.target === nodeId && e.targetHandle === portKey)          // 匹配输入端口
    )
}

// --- 获取输入端口的连接线（最多一条）---
const getByInputPort = (nodeId, portKey) => {
    return store.blueprint.edges.find(e => e.target === nodeId && e.targetHandle === portKey) || null // 查找连入该输入端口的线
}

// --- 辅助：将各种格式的ID统一转为数组 ---
const normalizeIds = (input) => {
    if (Array.isArray(input)) return input                        // 已经是数组直接返回
    if (typeof input === 'object' && input.id) return [input.id]  // 对象取id字段
    return [input]                                                // 单个ID包装成数组
}

export default { add, remove, getByNode, getByPort, getByInputPort } // 导出所有连接线命令
