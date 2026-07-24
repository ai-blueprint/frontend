/*
 * 这个文件负责WebSocket协议中不依赖界面的纯数据处理。
 * 请求统一由 createRequest(type, data) 创建，响应统一由 parseEnvelope(text) 校验。
 */

// --- 生成本次会话内唯一的请求ID ---
const createRequestId = () => {
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); // 浏览器支持时使用标准UUID
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`; // 测试环境使用时间与随机数组合兜底
};


// --- 创建标准请求信封 ---
const createRequest = (type, data = {}) => {
	if (typeof type !== "string" || !type) throw new Error("请求类型不能为空"); // 无类型的消息无法被后端分发
	return { type, id: createRequestId(), data }; // 保留固定的type、id、data三段结构
};


// --- 解析并校验服务端信封 ---
const parseEnvelope = (messageText) => {
	let message = messageText; // 测试和浏览器事件都可以复用同一入口
	if (typeof messageText === "string") message = JSON.parse(messageText); // 文本消息先还原为对象
	if (!message || typeof message !== "object") throw new Error("服务端消息必须是对象"); // 拒绝空值和基础类型
	if (typeof message.type !== "string" || !message.type) throw new Error("服务端消息缺少type"); // 类型是分发处理器的唯一依据
	return { type: message.type, id: message.id ?? null, data: message.data, error: message.error }; // 完整保留关联ID和错误字段
};


// --- 判断信封是否属于当前业务请求 ---
const isEnvelopeCurrent = (requestId, envelope) => !!requestId && !!envelope?.id && requestId === envelope.id; // 广播和旧ID不能修改请求态

export { createRequestId, createRequest, parseEnvelope, isEnvelopeCurrent }; // 导出协议纯工具供传输层和测试使用
