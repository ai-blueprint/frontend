import store from '@/store.js'                     // 引入全局状态
import { nextTick } from 'vue'                     // 引入nextTick

// --- 记录快照 ---
const record = () => {
    if (store.history.paused) return                              // 暂停期间不记录

    // --- 快照策略说明 ---
    // 当前使用全量深拷贝快照而不是增量快照，目的是让撤销/重做行为稳定且易懂。
    // 这个策略适合中小规模蓝图（节点与连线数量有限）并且维护成本低。
    // 如果后续蓝图规模明显增大导致记录性能下降，再升级为增量快照。
    // --- 深拷贝当前蓝图状态 ---
    const snapshot = {
        nodes: JSON.parse(JSON.stringify(store.blueprint.nodes)),   // 深拷贝节点数据
        edges: JSON.parse(JSON.stringify(store.blueprint.edges)),   // 深拷贝连接线数据
    }

    // --- 如果当前不在末尾，截断未来分支 ---
    if (store.history.currentIndex < store.history.snapshots.length - 1) {
        store.history.snapshots = store.history.snapshots.slice(0, store.history.currentIndex + 1) // 丢弃后续快照
    }

    store.history.snapshots.push(snapshot)                        // 添加新快照
    store.history.currentIndex = store.history.snapshots.length - 1 // 指向最新快照

    // --- 超过上限就移除最早的快照 ---
    if (store.history.snapshots.length > store.history.maxCount) {
        store.history.snapshots.shift()                             // 移除最早快照
        store.history.currentIndex--                                // 索引前移一位
    }
}

// --- 撤销 ---
const undo = () => {
    if (!canUndo()) return                                        // 不可撤销直接返回

    store.history.paused = true                                   // 暂停自动记录
    store.history.currentIndex--                                  // 回退一步
    const snapshot = store.history.snapshots[store.history.currentIndex] // 获取目标快照

    store.blueprint.nodes = JSON.parse(JSON.stringify(snapshot.nodes))   // 恢复节点数据
    store.blueprint.edges = JSON.parse(JSON.stringify(snapshot.edges))   // 恢复连接线数据

    nextTick(() => {
        store.history.paused = false                                // 恢复自动记录
    })
}

// --- 重做 ---
const redo = () => {
    if (!canRedo()) return                                        // 不可重做直接返回

    store.history.paused = true                                   // 暂停自动记录
    store.history.currentIndex++                                  // 前进一步
    const snapshot = store.history.snapshots[store.history.currentIndex] // 获取目标快照

    store.blueprint.nodes = JSON.parse(JSON.stringify(snapshot.nodes))   // 恢复节点数据
    store.blueprint.edges = JSON.parse(JSON.stringify(snapshot.edges))   // 恢复连接线数据

    nextTick(() => {
        store.history.paused = false                                // 恢复自动记录
    })
}

// --- 检查是否可撤销 ---
const canUndo = () => {
    return store.history.currentIndex > 0                         // 索引大于0才可撤销
}

// --- 检查是否可重做 ---
const canRedo = () => {
    return store.history.currentIndex < store.history.snapshots.length - 1 // 索引未到末尾才可重做
}

// --- 清空历史记录 ---
const clear = () => {
    store.history.snapshots = []                                  // 清空所有快照
    store.history.currentIndex = 0                                // 索引归零
    record()                                                      // 记录当前状态作为初始快照
}

// --- 获取历史记录信息 ---
const getInfo = () => {
    return {
        total: store.history.snapshots.length,                      // 快照总数
        current: store.history.currentIndex,                        // 当前索引
        canUndo: canUndo(),                                         // 是否可撤销
        canRedo: canRedo(),                                         // 是否可重做
    }
}

export default { record, undo, redo, canUndo, canRedo, clear, getInfo } // 导出所有历史记录命令
