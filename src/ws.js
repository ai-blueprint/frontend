import store from '@/store.js'                              // 引入全局状态
import fallbackRegistry from '@/constants/registry.json'     // 引入本地备用注册表

let socket = null                                            // 当前WebSocket实例
let onConnectFinish = null                                   // 当前连接任务的结束回调
let pendingConnectTask = null                                // 当前连接中的Promise任务
let hasStarted = false                                       // 标记是否已执行自动启动

// --- 初始化注册表状态 ---
const initRegistryState = () => {
    setFallbackRegistry()                                    // 先写入本地备用注册表
    setFirstCategory()                                       // 默认选中第一个分类
}

// --- 设置本地备用注册表 ---
const setFallbackRegistry = () => {
    store.registry = fallbackRegistry                        // 使用本地注册表兜底
}

// --- 设置默认分类 ---
const setFirstCategory = () => {
    const categoryKeys = Object.keys(store.registry.categories || {}) // 获取所有分类键
    if (!categoryKeys.length) return                         // 没有分类直接返回
    store.selected.category = categoryKeys[0]               // 默认选中第一个分类
}

// --- 判断连接是否可发送 ---
const isSocketOpen = () => {
    return !!socket && socket.readyState === WebSocket.OPEN // 仅OPEN状态可发送
}

// --- 结束连接任务（single-flight统一收口） ---
const finishConnectResult = (isReady) => {
    if (!onConnectFinish) return                             // 没有连接任务直接返回
    onConnectFinish(isReady)                                 // 返回连接结果
    onConnectFinish = null                                   // 清空结束回调
    pendingConnectTask = null                                // 清空连接任务
}

// --- 创建WebSocket实例 ---
const createSocket = (address) => {
    socket = new WebSocket(address)                          // 按地址创建连接
}

// --- 绑定WebSocket事件 ---
const bindSocketEvents = () => {
    if (!socket) return                                      // 没有实例直接返回

    socket.onopen = () => {
        console.log('[ws] 已连接到后端')                      // 记录连接成功日志
        sendGetRegistry()                                    // 连接成功后主动请求注册表
    }

    socket.onmessage = (event) => {
        const message = parseMessage(event.data)             // 解析服务端消息
        if (!message) return                                 // 解析失败不再处理
        checkServerMessage(message)                          // 分发消息到处理器
    }

    socket.onclose = () => {
        console.log('[ws] 连接已关闭')                        // 记录连接关闭日志
        socket = null                                        // 清空连接实例
        finishConnectResult(false)                           // 连接未完成时按失败收口
    }

    socket.onerror = () => {
        console.warn('[ws] 后端连接失败')           // 记录连接失败日志
        setFallbackRegistry()                                // 失败时回退本地注册表
        socket = null                                        // 清空连接实例
        finishConnectResult(false)                           // 连接失败按失败收口
    }
}

// --- 解析消息文本 ---
const parseMessage = (messageText) => {
    try {
        return JSON.parse(messageText)                       // 尝试解析JSON文本
    } catch (error) {
        console.warn('[ws] 消息解析失败，已忽略')               // 解析失败只记录警告
        return null                                          // 返回空表示无效消息
    }
}

// --- 发送JSON消息 ---
const sendJson = (message) => {
    if (!isSocketOpen()) return false                        // 未连接时不能发送
    socket.send(JSON.stringify(message))                     // 序列化后发送消息
    return true                                              // 返回发送成功
}

// --- 请求节点注册表 ---
const sendGetRegistry = () => {
    sendJson({ type: 'getRegistry' })                        // 向后端请求注册表
}

// --- 分发服务端消息 ---
const checkServerMessage = (message) => {
    console.log('[ws] 收到消息:', message)                    // 输出收到的原始消息

    const messageType = message?.type                        // 读取消息类型
    const messageData = message?.data                        // 读取消息数据
    if (!messageType) return                                 // 没有类型直接返回

    const messageHandler = messageHandlerMap[messageType]    // 根据类型查找处理器
    if (!messageHandler) return                              // 未注册处理器直接返回
    messageHandler(messageData)                              // 执行对应处理器
}

// --- 写入注册表消息 ---
const onRegistryMessage = (registryData) => {
    store.registry = registryData                            // 更新注册表到全局状态
    console.log('[ws] 注册表已更新')                          // 输出更新日志
    setFirstCategory()                                       // 注册表更新后刷新默认分类
    finishConnectResult(true)                                // 注册表到达后连接任务成功收口
}

// --- 查找节点 ---
const findNodeById = (nodeId) => {
    return store.blueprint.nodes.find(node => node.id === nodeId) || null // 按ID查找节点
}

// --- 写入单个节点运行结果 ---
const setNodeRunResult = (node, runItem) => {
    if (runItem.tensor) {
        node.tensorImage = runItem.tensor                    // 写入可视化图片
        node.error = null                                    // 清空错误信息
        return
    }

    node.error = runItem.error || '未知错误'                  // 写入错误信息
    node.tensorImage = null                                  // 清空可视化图片
}

// --- 写入运行结果消息 ---
const onRunMessage = (runData) => {
    if (!runData) return                                     // 没有结果直接返回

    const runItems = Array.isArray(runData) ? runData : [runData] // 兼容数组和单项
    runItems.forEach(runItem => {
        const node = findNodeById(runItem.nodeId)            // 查找结果对应节点
        if (!node) return                                    // 节点不存在直接跳过
        setNodeRunResult(node, runItem)                      // 写入节点运行结果
    })
}

// --- 写入跑分消息 ---
const onScoreMessage = (scoreData) => {
    console.log('[ws] 跑分结果:', scoreData)                 // 输出跑分结果日志
    store.scoring = scoreData || {}                          // 更新跑分状态
}

const messageHandlerMap = {
    registry: onRegistryMessage,                             // 注册表消息处理器
    run: onRunMessage,                                       // 运行结果消息处理器
    score: onScoreMessage,                                   // 跑分结果消息处理器
}

// --- 生成默认WebSocket地址（同域优先） ---
const getAutoSocketAddress = () => {
    const envAddress = import.meta.env?.VITE_WS_URL                 // 允许环境变量覆盖地址
    if (envAddress) return envAddress                               // 有配置优先使用配置地址

    const pageProtocol = window.location.protocol                   // 读取页面协议
    const socketProtocol = pageProtocol === 'https:' ? 'wss:' : 'ws:' // https页面必须使用wss
    const pageHost = window.location.host                           // 读取页面主机与端口
    return `${socketProtocol}//${pageHost}/ws`                      // 默认连接同域WebSocket入口
}

// --- 建立WebSocket连接（single-flight） ---
const connect = (address = getAutoSocketAddress()) => {
    // --- 复用已有连接任务 ---
    if (isSocketOpen()) return Promise.resolve(true)         // 已连接直接返回成功
    if (pendingConnectTask) return pendingConnectTask        // 连接中复用同一个任务

    // --- 创建本次连接任务 ---
    pendingConnectTask = new Promise((resolve) => {
        onConnectFinish = (isReady) => {
            resolve(isReady)                                 // 返回连接是否就绪
        }

        // --- 执行连接并绑定事件 ---
        try {
            createSocket(address)                            // 创建连接实例
            bindSocketEvents()                               // 绑定连接事件
        } catch (error) {
            // --- 连接异常时回退本地状态 ---
            console.warn('[ws] 连接异常，后端连接失败')      // 捕获连接阶段异常
            setFallbackRegistry()                            // 异常时回退本地注册表
            socket = null                                    // 清空连接实例
            finishConnectResult(false)                       // 异常按失败收口
        }
    })

    return pendingConnectTask                                // 返回连接任务
}

// --- 断开连接 ---
const disconnect = () => {
    if (!socket) return                                      // 没有连接直接返回
    socket.close()                                           // 主动关闭连接
    socket = null                                            // 立即清空连接实例
}

// --- 发送业务消息（未连接则先连一次） ---
const send = async (message) => {
    // --- 检查连接状态 ---
    if (!isSocketOpen()) {
        console.log('[ws] 未连接，尝试重连...')                // 记录重连提示日志
        await connect()                                      // 先确保连接可用
    }

    // --- 发送业务消息 ---
    const isSent = sendJson(message)                         // 发送JSON消息
    if (isSent) return                                       // 发送成功直接结束

    // --- 处理发送失败 ---
    console.warn('[ws] 发送失败，无法连接到后端')               // 发送失败给出警告
}

// --- 发送运行请求 ---
const sendRun = () => {
    send({ type: 'runBlueprint', data: { blueprint: store.blueprint } }) // 发送运行请求
}

// --- 发送跑分请求 ---
const sendScore = () => {
    send({ type: 'score', data: { blueprint: store.blueprint } }) // 发送跑分请求
}

// --- 自动启动WebSocket模块 ---
const start = () => {
    if (hasStarted) return                                   // 已启动直接返回

    initRegistryState()                                      // 先写入本地注册表兜底状态
    connect()                                                // 自动尝试连接后端
    hasStarted = true                                        // 标记为已启动
}

start()                                                      // 导入模块后立即启动

export default { connect, disconnect, send, sendRun, sendScore, initRegistryState, start } // 导出WebSocket能力
