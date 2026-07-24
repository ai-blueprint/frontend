import store from '@/store.js'                     // 引入全局状态
import { calculateLayout } from '@/utils/arrange.js' // 引入布局计算
import { toCanvas } from '@/utils/position.js'     // 引入坐标转换
import History from '@/commands/History.js'         // 引入历史记录命令
import { createBlueprintFile, readBlueprintFile } from '@/utils/blueprintSerialization.js' // 引入安全版本化序列化工具

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
    try {
        const data = readBlueprintFile(jsonData)                    // 校验版本、结构和连线引用并剥离临时字段
        store.blueprint.name = data.name                            // 恢复蓝图名称
        store.blueprint.nodes = data.nodes                          // 恢复已清理节点
        store.blueprint.edges = data.edges                          // 恢复已清理连接线
        store.runtime.execution.requestId = null                    // 导入后旧运行消息全部视为过期
        store.runtime.execution.status = 'idle'                     // 新蓝图从未运行状态开始
        store.runtime.execution.nodeResults = {}                    // 清除旧蓝图节点结果
        store.runtime.execution.nodeErrors = {}                     // 清除旧蓝图节点错误
        store.experiment.feedback = { type: 'success', message: '蓝图导入成功' } // 显示导入反馈
        History.clear()                                             // 新蓝图作为撤销历史起点
        return true                                                 // 告知文件入口导入成功
    } catch (error) {
        store.experiment.feedback = { type: 'error', message: `导入失败：${error.message}` } // 保留原蓝图并显示原因
        return false                                                // 告知文件入口导入失败
    }
}

// --- 导出蓝图 ---
const exportBlueprint = () => {
    try {
        const data = JSON.stringify(createBlueprintFile(store.blueprint), null, 2) // 生成带版本且无运行时字段的文件
        const blob = new Blob([data], { type: 'application/json' })   // 创建JSON下载内容
        const url = URL.createObjectURL(blob)                         // 创建短期下载地址
        const link = document.createElement('a')                      // 创建一次性下载入口
        link.href = url                                               // 绑定刚生成的内容地址
        link.download = `${(store.blueprint.name || '蓝图').replace(/[\\/:*?"<>|]/g, '_')}.json` // 清理文件名中的路径字符
        link.click()                                                  // 触发浏览器下载
        URL.revokeObjectURL(url)                                      // 下载触发后释放内存
        store.experiment.feedback = { type: 'success', message: '已导出版本1蓝图文件' } // 显示导出反馈
        return true                                                   // 告知顶部栏操作成功
    } catch (error) {
        store.experiment.feedback = { type: 'error', message: `导出失败：${error.message}` } // 显示结构校验错误
        return false                                                  // 告知顶部栏操作失败
    }
}

// --- 设置蓝图名称 ---
const setName = (name) => {
    store.blueprint.name = name                                   // 更新蓝图名称
}

export default { setFlowInstance, arrange, zoomIn, zoomOut, resetZoom, setViewport, importBlueprint, exportBlueprint, setName } // 导出所有蓝图命令
