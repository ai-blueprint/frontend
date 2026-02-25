import { watch } from 'vue'                        // 引入Vue的watch
import store from '@/store.js'                     // 引入全局状态
import History from '@/commands/History.js'         // 引入历史记录命令

let stopWatcher = null                                          // 存储watcher停止函数
let debounceTimer = null                                        // 防抖定时器
let hasStarted = false                                          // 标记是否已完成初始化

// --- 初始化自动历史记录 ---
const init = () => {
    if (hasStarted) return                                       // 已初始化直接返回

    stopWatcher = watch(
        () => [store.blueprint.nodes, store.blueprint.edges],    // 只监听蓝图核心数据
        () => {
            if (store.history.paused) return                     // 暂停期间跳过记录

            clearTimeout(debounceTimer)                          // 清除之前的防抖定时器
            debounceTimer = setTimeout(() => {
                History.record()                                 // 防抖后记录快照
            }, 300)                                              // 300毫秒防抖间隔
        },
        { deep: true }                                           // 深度监听数组内部变化
    )

    hasStarted = true                                            // 标记为已初始化
}

// --- 销毁自动历史记录 ---
const destroy = () => {
    if (stopWatcher) {
        stopWatcher()                                            // 停止watcher
        stopWatcher = null                                       // 清空引用
    }

    clearTimeout(debounceTimer)                                  // 清除防抖定时器
    debounceTimer = null                                         // 清空定时器引用
    hasStarted = false                                           // 标记为未初始化
}

init()                                                           // 导入模块后立即启动

export default { init, destroy }                                 // 导出自动记录命令
