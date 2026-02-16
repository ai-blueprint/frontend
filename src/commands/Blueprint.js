import store from '@/store.js'                     // 引入全局状态
import { calculateLayout } from '@/utils/arrange.js' // 引入布局计算
import { toCanvas } from '@/utils/position.js'     // 引入坐标转换

let vueFlowInstance = null                                      // 存储vueflow实例引用

// --- 设置vueflow实例（由Blueprint.vue初始化时调用）---
const setFlowInstance = (instance) => {
    vueFlowInstance = instance                                    // 保存vueflow实例
}

// --- 整理节点布局 ---
const arrange = async () => {
    const nodes = store.blueprint.nodes                           // 获取所有节点
    const edges = store.blueprint.edges                           // 获取所有连接线
    const positionMap = await calculateLayout(nodes, edges)       // 计算新布局坐标

    nodes.forEach(node => {
        if (positionMap[node.id]) {                                 // 如果有新坐标
            node.position.x = positionMap[node.id].x                 // 更新节点X坐标
            node.position.y = positionMap[node.id].y                 // 更新节点Y坐标
        }
    })

    if (vueFlowInstance) {
        setTimeout(() => {
            vueFlowInstance.fitView({ padding: 0.2, duration: 300 }) // 让所有节点都在可视范围内
        }, 50)
    }
}

// --- 放大 ---
const zoomIn = (step = 0.1) => {
    const newZoom = Math.min(store.viewport.zoom + step, 2)       // 计算新缩放值，上限200%
    store.viewport.zoom = Math.round(newZoom * 100) / 100         // 四舍五入避免浮点误差
    if (vueFlowInstance) vueFlowInstance.zoomTo(store.viewport.zoom) // 同步到vueflow
}

// --- 缩小 ---
const zoomOut = (step = 0.1) => {
    const newZoom = Math.max(store.viewport.zoom - step, 0.5)     // 计算新缩放值，下限50%
    store.viewport.zoom = Math.round(newZoom * 100) / 100         // 四舍五入避免浮点误差
    if (vueFlowInstance) vueFlowInstance.zoomTo(store.viewport.zoom) // 同步到vueflow
}

// --- 重置缩放 ---
const resetZoom = () => {
    store.viewport.zoom = 1                                       // 缩放重置为100%
    if (vueFlowInstance) vueFlowInstance.zoomTo(1)                // 同步到vueflow
}

// --- 设置视口 ---
const setViewport = (x, y, zoom) => {
    store.viewport.x = x                                         // 设置视口X
    store.viewport.y = y                                         // 设置视口Y
    store.viewport.zoom = zoom                                   // 设置缩放
    if (vueFlowInstance) vueFlowInstance.setViewport({ x, y, zoom }) // 同步到vueflow
}

// --- 导入蓝图 ---
const importBlueprint = (jsonData) => {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData // 兼容字符串和对象
    if (!data) return                                             // 数据为空直接返回

    store.blueprint.name = data.name || '我的架构'                 // 恢复蓝图名称
    store.blueprint.nodes = data.nodes || []                      // 恢复节点数据
    store.blueprint.edges = data.edges || []                      // 恢复连接线数据

    // --- 确保每个节点都有tensorImage和error字段 ---
    store.blueprint.nodes.forEach(node => {
        if (!('tensorImage' in node)) node.tensorImage = null       // 补全tensorImage字段
        if (!('error' in node)) node.error = null                   // 补全error字段
    })
}

// --- 导出蓝图 ---
const exportBlueprint = () => {
    const data = JSON.stringify(store.blueprint, null, 2)         // 将蓝图数据转为JSON字符串
    const blob = new Blob([data], { type: 'application/json' })   // 创建Blob对象
    const url = URL.createObjectURL(blob)                         // 创建临时下载链接
    const link = document.createElement('a')                      // 创建a标签
    link.href = url                                               // 设置下载链接
    link.download = `${store.blueprint.name || '蓝图'}.json`      // 设置文件名
    link.click()                                                  // 触发下载
    URL.revokeObjectURL(url)                                      // 释放临时链接
}

// --- 设置蓝图名称 ---
const setName = (name) => {
    store.blueprint.name = name                                   // 更新蓝图名称
}

export default { setFlowInstance, arrange, zoomIn, zoomOut, resetZoom, setViewport, importBlueprint, exportBlueprint, setName } // 导出所有蓝图命令
