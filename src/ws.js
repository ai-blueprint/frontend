/*
 * 这个文件只负责WebSocket连接、标准信封收发和消息分发。
 * 业务模块通过 registerHandler(type, handler)订阅完整信封，通过 request(type, data)发起唯一ID请求。
 */
import store from "@/store.js"; // 引入连接状态和注册表状态
import fallbackRegistry from "@/constants/registry.json"; // 引入离线可用的本地注册表
import { createRequest, parseEnvelope } from "@/utils/protocol.js"; // 引入标准信封创建与校验工具

let socket = null; // 保存当前WebSocket实例
let pendingConnectTask = null; // 复用正在进行的连接任务
let finishPendingConnect = null; // 保存连接任务的结束回调
let hasStarted = false; // 防止自动启动被重复执行
const messageHandlers = new Map(); // 按消息类型保存业务处理器集合

// --- 设置离线注册表 ---
const setFallbackRegistry = () => {
	store.registry = fallbackRegistry; // 后端不可用时仍允许编辑本地节点
	if (!store.selected.category) store.selected.category = Object.keys(store.registry.categories || {})[0] || ""; // 首次启动选择第一个分类
};


// --- 结束当前连接任务 ---
const finishConnect = (isReady) => {
	if (!finishPendingConnect) return; // 没有等待者时无需处理
	finishPendingConnect(isReady); // 把连接结果交还给发送流程
	finishPendingConnect = null; // 清空本轮结束回调
	pendingConnectTask = null; // 允许后续重新连接
};


// --- 判断连接是否可发送 ---
const isOpen = () => !!socket && socket.readyState === WebSocket.OPEN; // 只有OPEN状态能够发送消息


// --- 更新服务端注册表 ---
const applyRegistry = (registry) => {
	if (!registry?.categories || !registry?.nodes) return; // 不完整注册表不覆盖可用的本地数据
	store.registry = registry; // 响应式更新分类和节点定义
	if (!store.registry.categories[store.selected.category]) store.selected.category = Object.keys(store.registry.categories)[0] || ""; // 热更新删除分类时修正选择
};


// --- 分发完整服务端信封 ---
const dispatchEnvelope = (messageText) => {
	let envelope; // 解析成功后保存完整信封
	try {
		envelope = parseEnvelope(messageText); // 校验type并保留id、data、error
	} catch (error) {
		store.transport.error = `协议消息无效：${error.message}`; // 将解析失败暴露给用户
		return false; // 无效消息不进入业务处理器
	}

	const handlers = messageHandlers.get(envelope.type) || []; // 找出当前类型的全部订阅者
	handlers.forEach((handler) => handler(envelope)); // 业务处理器收到完整信封以判断ID和错误
	if (envelope.error && !handlers.length) store.transport.error = typeof envelope.error === "string" ? envelope.error : envelope.error.message || `请求${envelope.type}失败`; // 未被业务模块处理的协议错误仍然可见
	return handlers.length > 0; // 返回是否存在处理器便于测试
};


// --- 注册消息处理器 ---
const registerHandler = (type, handler) => {
	const handlers = messageHandlers.get(type) || []; // 同类型允许多个独立业务订阅
	handlers.push(handler); // 保留注册顺序便于追踪数据流
	messageHandlers.set(type, handlers); // 写回类型对应处理器集合
	return () => messageHandlers.set(type, (messageHandlers.get(type) || []).filter((item) => item !== handler)); // 返回可选的注销方法
};


// --- 发送原始标准信封 ---
const sendEnvelope = async (envelope) => {
	if (!isOpen()) await connect(); // 未连接时先完成一次连接尝试
	if (!isOpen()) {
		store.transport.error = "无法连接到后端，当前请求未发送"; // 显示明确的传输错误
		return false; // 发送方可根据结果标记本地失败
	}

	try {
		socket.send(JSON.stringify(envelope)); // 连接可用后发送完整标准信封
		return true; // 告知业务命令请求已进入网络
	} catch (error) {
		store.transport.error = `请求发送失败：${error.message}`; // 捕获序列化和底层发送异常
		return false; // 保留请求ID但声明发送失败
	}
};


// --- 发起带唯一ID的业务请求 ---
const request = (type, data = {}) => {
	const envelope = createRequest(type, data); // 在异步连接前立即生成唯一请求ID
	const sent = sendEnvelope(envelope); // 后台完成连接和发送过程
	return { id: envelope.id, sent }; // 命令层可先登记ID再等待发送结果
};


// --- 生成默认连接地址 ---
const getAutoSocketAddress = () => {
	if (import.meta.env?.VITE_WS_URL) return import.meta.env.VITE_WS_URL; // 显式环境配置优先
	const location = globalThis.location || { protocol: "http:", host: "localhost" }; // 单元测试环境使用无网络地址兜底
	const protocol = location.protocol === "https:" ? "wss:" : "ws:"; // 页面协议决定安全WebSocket协议
	return `${protocol}//${location.host}/ws`; // 默认使用Vite代理或同域部署入口
};


// --- 绑定连接生命周期 ---
const bindSocketEvents = (activeSocket) => {
	activeSocket.onopen = () => {
		store.transport.status = "connected"; // 顶部状态立即反馈连接成功
		store.transport.error = null; // 新连接清除旧传输错误
		finishConnect(true); // 连接开放即可发送，不等待注册表响应
		request("getRegistry", {}); // 连接后同步后端节点注册表
	};
	activeSocket.onmessage = (event) => dispatchEnvelope(event.data); // 所有消息统一经过完整信封分发
	activeSocket.onclose = () => {
		if (socket === activeSocket) socket = null; // 只清理当前有效实例
		store.transport.status = "disconnected"; // 界面显示连接已断开
		store.transport.error = "后端连接已断开"; // 断开原因对用户可见
		finishConnect(false); // 收口尚未完成的连接任务
	};
	activeSocket.onerror = () => {
		store.transport.status = "disconnected"; // 错误后进入离线状态
		store.transport.error = "后端连接失败，已使用本地节点注册表"; // 显示可操作的回退说明
		setFallbackRegistry(); // 连接失败不影响蓝图编辑
		finishConnect(false); // 通知等待发送的请求失败
	};
};


// --- 建立可复用的连接任务 ---
const connect = (address = getAutoSocketAddress()) => {
	if (isOpen()) return Promise.resolve(true); // 已连接时直接复用
	if (pendingConnectTask) return pendingConnectTask; // 同时触发的请求共享一次连接

	store.transport.status = "connecting"; // 界面进入连接中状态
	pendingConnectTask = new Promise((resolve) => {
		finishPendingConnect = resolve; // 保存本次连接结果回调
		try {
			socket = new WebSocket(address); // 创建新连接实例
			bindSocketEvents(socket); // 立即绑定生命周期避免漏掉事件
		} catch (error) {
			store.transport.status = "disconnected"; // 同步构造失败时回到离线
			store.transport.error = `连接创建失败：${error.message}`; // 暴露浏览器拒绝原因
			setFallbackRegistry(); // 保证节点列表仍可使用
			finishConnect(false); // 结束本次连接任务
		}
	});
	return pendingConnectTask; // 返回共享连接任务
};


// --- 主动断开连接 ---
const disconnect = () => {
	if (!socket) return; // 当前没有连接时无需处理
	socket.close(); // 触发统一onclose状态收口
};


// --- 初始化注册表响应 ---
registerHandler("getRegistry", ({ data, error }) => {
	if (error) {
		store.transport.error = typeof error === "string" ? error : error.message || "获取节点注册表失败"; // 显示后端注册表错误
		setFallbackRegistry(); // 获取失败时继续使用本地数据
		return;
	}
	applyRegistry(data); // 正常响应覆盖本地注册表
});

registerHandler("registryUpdated", ({ data }) => applyRegistry(data)); // 热重载广播不要求请求ID


// --- 自动启动连接模块 ---
const start = () => {
	if (hasStarted) return; // 模块重复导入时不重复连接
	setFallbackRegistry(); // 首屏先有可用节点定义
	hasStarted = true; // 在异步连接前锁定启动状态
	connect(); // 后台尝试连接后端
};

start(); // 导入传输模块即开始连接

export { dispatchEnvelope }; // 导出纯分发入口供协议测试验证
export default { connect, disconnect, request, registerHandler, start }; // 导出连接、请求和订阅能力
