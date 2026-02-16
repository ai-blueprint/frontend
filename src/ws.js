import store from '@/store.js'                  // 引入全局状态
import fallbackRegistry from '@/constants/registry.json' // 引入备用注册表

let socket = null                                       // WebSocket实例
let connectResolve = null                               // 注册表就绪后的Promise回调

// --- 连接WebSocket ---
const connect = (address = 'ws://localhost:8765') => {
    return new Promise((resolve, reject) => {
        try {
            connectResolve = resolve                              // 保存resolve引用，等注册表收到后调用

            socket = new WebSocket(address)                   // 创建WebSocket连接

            socket.onopen = () => {                           // 连接成功回调
                console.log('[ws] 已连接到后端')                  // 输出连接成功日志
                requestRegistry()                               // 连接成功后请求节点注册表
            }

            socket.onmessage = (event) => {                   // 收到消息回调
                const message = JSON.parse(event.data)          // 解析收到的JSON消息
                handleMessage(message)                          // 分发处理消息
            }

            socket.onclose = () => {                          // 连接关闭回调
                console.log('[ws] 连接已关闭')                    // 输出关闭日志
                socket = null                                   // 清空实例
            }

            socket.onerror = () => {                          // 连接错误回调
                console.warn('[ws] 连接失败，使用本地注册表')       // 输出错误日志
                alert('无法连接到后端服务，已加载本地备用注册表')     // 弹窗提示用户连接失败
                loadFallbackRegistry()                          // 加载本地备用注册表
                socket = null                                   // 清空实例
                if (connectResolve) {                           // 如果还没resolve过
                    connectResolve(false)                         // 通知调用方连接失败但已用备用数据
                    connectResolve = null                         // 清空引用防止重复调用
                }
            }
        } catch (error) {
            console.warn('[ws] 连接异常，使用本地注册表')         // 捕获异常
            alert('无法连接到后端服务，已加载本地备用注册表')       // 弹窗提示用户连接异常
            loadFallbackRegistry()                            // 加载本地备用注册表
            if (connectResolve) {                             // 如果还没resolve过
                connectResolve(false)                           // 通知调用方
                connectResolve = null                           // 清空引用
            }
        }
    })
}

// --- 断开WebSocket连接 ---
const disconnect = () => {
    if (!socket) return                                   // 没有连接直接返回
    socket.close()                                        // 关闭连接
    socket = null                                         // 清空实例
}

// --- 发送消息（发现未连接就尝试一次重连）---
const send = async (message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) { // 检查连接状态
        console.log('[ws] 未连接，尝试重连...')                 // 输出重连日志
        await connect()                                     // 尝试重连
    }
    if (socket && socket.readyState === WebSocket.OPEN) { // 重连后再检查一次
        socket.send(JSON.stringify(message))                // 发送JSON消息
    } else {
        console.warn('[ws] 发送失败，无法连接到后端')            // 发送失败警告
    }
}

// --- 请求节点注册表 ---
const requestRegistry = () => {
    send({ type: 'getRegistry' })                         // 发送获取注册表请求
}

// --- 加载本地备用注册表 ---
const loadFallbackRegistry = () => {
    store.registry = fallbackRegistry                     // 将备用注册表写入store
    console.log('[ws] 已加载本地备用注册表')                 // 输出加载成功日志
}

// --- 消息分发处理 ---
const handleMessage = (message) => {
    console.log('[ws] 收到消息:', message)                  // 在控制台输出收到的消息

    if (message.type === 'registry') handleRegistry(message.data)   // 处理注册表数据
    if (message.type === 'run') handleRunResult(message.data)       // 处理运行结果
    if (message.type === 'score') handleScoreResult(message.data)   // 处理跑分结果
}

// --- 处理注册表响应 ---
const handleRegistry = (data) => {
    store.registry = data                                 // 将注册表数据写入store
    console.log('[ws] 注册表已更新')                        // 输出更新日志

    if (connectResolve) {                                // 如果connect还在等待注册表
        connectResolve(true)                               // 通知调用方注册表已就绪
        connectResolve = null                              // 清空引用防止重复调用
    }
}

// --- 处理蓝图运行结果 ---
const handleRunResult = (data) => {
    if (!data) return                                     // 没有数据直接返回

    const resultList = Array.isArray(data) ? data : [data] // 兼容单个或数组结果

    resultList.forEach(item => {
        const node = store.blueprint.nodes.find(n => n.id === item.nodeId) // 找到对应节点
        if (!node) return                                   // 节点不存在就跳过

        if (item.tensor) {                                  // 如果有tensor数据
            node.tensorImage = item.tensor                    // 存入节点的可视化图
            node.error = null                                 // 清除错误信息
        } else {                                            // 没有tensor说明运行出错
            node.error = item.error || '未知错误'              // 存入错误信息
            node.tensorImage = null                           // 清除可视化图
        }
    })
}

// --- 处理跑分结果 ---
const handleScoreResult = (data) => {
    console.log('[ws] 跑分结果:', data)                     // 在控制台输出跑分结果
    store.scoring = data || {}                            // 更新跑分状态数据
}

// --- 发送蓝图运行请求 ---
const sendRun = () => {
    send({ type: 'run', data: { blueprint: store.blueprint } }) // 发送蓝图数据到后端运行
}

// --- 发送蓝图跑分请求 ---
const sendScore = () => {
    send({ type: 'score', data: { blueprint: store.blueprint } }) // 发送蓝图数据到后端跑分
}

export default { connect, disconnect, send, sendRun, sendScore } // 导出所有WebSocket方法
