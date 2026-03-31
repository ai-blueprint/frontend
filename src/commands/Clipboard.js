import store from '@/store.js' // 引入全局状态仓库。
import generateId from '@/utils/generateId.js' // 引入唯一ID生成器。
import Node from '@/commands/Node.js' // 引入节点命令对象。
import { normalizeIds } from '@/utils/normalize.js' // 引入ID标准化工具。
import { toCanvas } from '@/utils/position.js' // 引入屏幕坐标转画布坐标工具。
import LocalStorage from '@/utils/localStorage.js' // 引入本地存储命令对象。

const STORAGE_KEY = 'AI-Blueprint-clipboard' // 定义跨标签页共享的存储键。
const STORAGE_TAG = 'AI-Blueprint-clipboard' // 定义剪贴板数据标识。

const copy = (nodeIds) => { // 复制节点与内部连线。
    console.log('开始复制节点') // 打印开始日志。
    const ids = normalizeIds(nodeIds || []) // 统一ID入参为数组。
    const targetNodes = ids.length ? store.blueprint.nodes.filter(node => ids.includes(node.id)) : store.blueprint.nodes.filter(node => node.selected) // 优先按入参复制，否则复制选中节点。
    if (!targetNodes.length) return // 没有可复制节点时直接返回。

    const relatedEdges = store.blueprint.edges.filter(edge => targetNodes.some(node => node.id === edge.source) && targetNodes.some(node => node.id === edge.target)) // 只保留复制集合内部连线。
    const copyNodes = JSON.parse(JSON.stringify(targetNodes)) // 深拷贝节点避免引用污染。
    const copyEdges = JSON.parse(JSON.stringify(relatedEdges)) // 深拷贝连线避免引用污染。
    const xList = copyNodes.map(node => node.position.x) // 提取所有节点X坐标。
    const yList = copyNodes.map(node => node.position.y) // 提取所有节点Y坐标。
    const centerX = (Math.min(...xList) + Math.max(...xList)) / 2 // 计算节点组中心X。
    const centerY = (Math.min(...yList) + Math.max(...yList)) / 2 // 计算节点组中心Y。
    const nodeOffsets = {} // 创建相对偏移映射表。
    copyNodes.forEach(node => { nodeOffsets[node.id] = { x: node.position.x - centerX, y: node.position.y - centerY } }) // 记录每个节点相对中心偏移。

    const payload = { tag: STORAGE_TAG, nodes: copyNodes, edges: copyEdges, anchor: { x: centerX, y: centerY }, nodeOffsets } // 组装跨标签页剪贴板载荷。
    store.clipboard.nodes = copyNodes // 同步内存剪贴板节点做兜底。
    store.clipboard.edges = copyEdges // 同步内存剪贴板连线做兜底。
    LocalStorage.write(STORAGE_KEY, payload) // 写入localStorage供其它标签页读取。
    console.log(`复制完成，节点数量：${copyNodes.length}，连线数量：${copyEdges.length}`) // 打印复制结果。
} // 结束复制逻辑。

const paste = (offsetX = 20, offsetY = 20) => { // 粘贴节点与连线。
    console.log('开始粘贴节点') // 打印开始日志。
    const savedPayload = LocalStorage.read(STORAGE_KEY) // 从localStorage读取跨标签页剪贴板。
    const isSavedPayloadValid = savedPayload?.tag === STORAGE_TAG && Array.isArray(savedPayload?.nodes) && Array.isArray(savedPayload?.edges) // 校验本地存储载荷是否合法。
    const payload = isSavedPayloadValid ? savedPayload : null // 优先使用合法的localStorage载荷。
    const fallbackNodes = store.clipboard.nodes // 读取内存兜底节点。
    const fallbackEdges = store.clipboard.edges // 读取内存兜底连线。
    const hasFallback = fallbackNodes.length > 0 // 判断是否存在内存兜底数据。
    if (!payload && !hasFallback) return // 两种来源都为空时直接返回。

    const activeNodes = payload ? payload.nodes : JSON.parse(JSON.stringify(fallbackNodes)) // 选择最终使用的节点数据。
    const activeEdges = payload ? payload.edges : JSON.parse(JSON.stringify(fallbackEdges)) // 选择最终使用的连线数据。
    const activeOffsets = payload ? payload.nodeOffsets : null // 优先使用存储的偏移表。
    const idMapping = {} // 创建旧ID到新ID映射表。
    const mouseCanvasPosition = toCanvas(store.mousePosition.x, store.mousePosition.y) // 把鼠标位置转换为画布坐标。

    Node.clearSelect() // 清空当前选中状态。

    activeNodes.forEach(oldNode => { // 遍历旧节点逐个创建新节点。
        const newId = generateId() // 生成新节点ID。
        idMapping[oldNode.id] = newId // 记录ID映射关系。
        const newNode = JSON.parse(JSON.stringify(oldNode)) // 深拷贝旧节点。
        newNode.id = newId // 替换为新节点ID。
        const currentOffset = activeOffsets?.[oldNode.id] // 读取该节点偏移信息。
        if (currentOffset) { newNode.position.x = mouseCanvasPosition.x + currentOffset.x; newNode.position.y = mouseCanvasPosition.y + currentOffset.y } else { newNode.position.x += offsetX; newNode.position.y += offsetY } // 优先按偏移粘贴，否则使用默认偏移。
        newNode.selected = true // 新粘贴节点默认选中。
        newNode.tensorImage = null // 清理历史可视化缓存。
        newNode.error = null // 清理历史错误状态。
        store.blueprint.nodes.push(newNode) // 把新节点加入蓝图。
    }) // 结束节点粘贴循环。

    activeEdges.forEach(oldEdge => { // 遍历旧连线逐个创建新连线。
        const newSource = idMapping[oldEdge.source] // 查找新来源节点ID。
        const newTarget = idMapping[oldEdge.target] // 查找新目标节点ID。
        if (!newSource || !newTarget) return // 缺少任一端时跳过该连线。
        store.blueprint.edges.push({ id: generateId(), source: newSource, sourceHandle: oldEdge.sourceHandle, target: newTarget, targetHandle: oldEdge.targetHandle }) // 创建并加入新连线。
    }) // 结束连线粘贴循环。

    console.log(`粘贴完成，节点数量：${activeNodes.length}，连线数量：${activeEdges.length}`) // 打印粘贴结果。
} // 结束粘贴逻辑。

const copyAndPaste = () => { copy(); paste() } // 执行复制后立即粘贴。

export default { copy, paste, copyAndPaste } // 导出三个核心剪贴板命令。