import store from '@/store.js'                     // 引入全局状态
import generateId from '@/utils/generateId.js'     // 引入ID生成器
import Node from '@/commands/Node.js'              // 引入节点命令
import { normalizeIds } from '@/utils/normalize.js' // 引入ID归一化工具

// --- 复制节点 ---
const copy = (nodeIds) => {
    const targetNodes = nodeIds                                   // 判断是否传入了指定节点
        ? store.blueprint.nodes.filter(node => normalizeIds(nodeIds).includes(node.id)) // 按指定ID过滤
        : store.blueprint.nodes.filter(node => node.selected)       // 默认使用选中节点

    if (!targetNodes.length) return                               // 没有可复制的节点直接返回

    store.clipboard.nodes = JSON.parse(JSON.stringify(targetNodes)) // 深拷贝节点到剪贴板

    // --- 只复制选中节点之间的连接线 ---
    const nodeIdSet = new Set(targetNodes.map(node => node.id))    // 构建节点ID集合
    const relatedEdges = store.blueprint.edges.filter(edge =>
        nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)    // 两端都在选中集合内的连线
    )
    store.clipboard.edges = JSON.parse(JSON.stringify(relatedEdges)) // 深拷贝连接线到剪贴板
}

// --- 粘贴节点 ---
const paste = (offsetX = 20, offsetY = 20) => {
    if (!hasContent()) return                                     // 剪贴板为空直接返回

    const idMapping = {}                                          // 旧ID到新ID的映射表

    Node.clearSelect()                                            // 清空当前选中

    // --- 创建新节点（生成新ID，偏移位置）---
    store.clipboard.nodes.forEach(oldNode => {
        const newId = generateId()                                  // 为每个节点生成新ID
        idMapping[oldNode.id] = newId                               // 记录映射关系

        const newNode = JSON.parse(JSON.stringify(oldNode))         // 深拷贝节点数据
        newNode.id = newId                                          // 替换为新ID
        newNode.position.x += offsetX                               // X方向偏移
        newNode.position.y += offsetY                               // Y方向偏移
        newNode.selected = true                                     // 新粘贴的节点自动选中
        newNode.tensorImage = null                                  // 清除可视化图
        newNode.error = null                                        // 清除错误信息

        store.blueprint.nodes.push(newNode)                         // 加入蓝图
    })

    // --- 创建新连接线（映射到新ID）---
    store.clipboard.edges.forEach(oldEdge => {
        const newEdge = {                                           // 构建新连接线
            id: generateId(),                                         // 生成新连接线ID
            source: idMapping[oldEdge.source],                        // 映射到新来源节点
            sourceHandle: oldEdge.sourceHandle,                       // 保持端口标识不变
            target: idMapping[oldEdge.target],                        // 映射到新目标节点
            targetHandle: oldEdge.targetHandle,                       // 保持端口标识不变
        }
        store.blueprint.edges.push(newEdge)                         // 加入蓝图
    })
}

// --- 复制并粘贴 ---
const copyAndPaste = () => {
    copy()                                                        // 先复制选中节点
    paste()                                                       // 再粘贴
}

// --- 检查剪贴板是否有内容 ---
const hasContent = () => {
    return store.clipboard.nodes.length > 0                       // 有节点就返回true
}

// --- 清空剪贴板 ---
const clear = () => {
    store.clipboard.nodes = []                                    // 清空节点
    store.clipboard.edges = []                                    // 清空连接线
}

export default { copy, paste, copyAndPaste, hasContent, clear } // 导出所有剪贴板命令
