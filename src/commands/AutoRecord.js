import { watch } from 'vue'                        // 引入Vue的watch
import store from '@/store.js'                     // 引入全局状态
import History from '@/commands/History.js'         // 引入历史记录命令

let stopWatcher = null                                          // 存储watcher停止函数
let debounceTimer = null                                        // 防抖定时器

// --- 初始化自动历史记录 ---
const init = () => {
    stopWatcher = watch(
        () => JSON.stringify({                                      // 监听蓝图关键数据的序列化结果
            nodes: store.blueprint.nodes,                             // 监听节点数据
            edges: store.blueprint.edges,                             // 监听连接线数据
        }),
        () => {
            if (store.history.paused) return                          // 暂停期间跳过记录

            clearTimeout(debounceTimer)                               // 清除之前的防抖定时器
            debounceTimer = setTimeout(() => {
                History.record()                                        // 防抖后记录快照
            }, 300)                                                   // 300毫秒防抖间隔
        },
        { deep: true }                                              // 深度监听
    )
}

// --- 销毁自动历史记录 ---
const destroy = () => {
    if (stopWatcher) {
        stopWatcher()                                               // 停止watcher
        stopWatcher = null                                          // 清空引用
    }
    clearTimeout(debounceTimer)                                   // 清除防抖定时器
}

export default { init, destroy }                                // 导出自动记录命令
