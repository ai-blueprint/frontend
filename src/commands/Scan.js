/*
 * 这个文件负责Block可堆叠静态扫描：发送当前蓝图 → 后端一次追踪推导全图形状 → 回填可堆叠结论。
 * 扫描不评价数值好坏，只回答输出是否与输入同形、是否具备重复堆叠条件。
 */
import store from "@/store.js"; // 引入扫描结论状态
import ws from "@/ws.js"; // 引入标准WebSocket请求能力
import { serializeBlueprint } from "@/utils/blueprintSerialization.js"; // 引入稳定蓝图序列化能力
import { isEnvelopeCurrent } from "@/utils/protocol.js"; // 引入请求ID匹配能力

let hasRegisteredHandlers = false; // 防止热更新重复注册消息处理器


// --- 清空扫描结论 ---
const clear = () => {
	const scanState = store.runtime.scan; // 获取扫描状态主体
	scanState.requestId = null; // 旧扫描请求立即失效
	scanState.status = "idle"; // 回到未扫描状态
	scanState.issues = []; // 清除旧问题列表
	scanState.inputShapes = {}; // 清除旧输入形状
	scanState.outputShapes = {}; // 清除旧输出形状
};


// --- 发起一次静态扫描 ---
const scan = () => {
	let blueprint; // 校验成功后保存纯业务蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 运行数据不进入后端蓝图
	} catch (error) {
		store.transport.error = `无法扫描：${error.message}`; // 结构错误直接反馈
		return null;
	}

	const scanState = store.runtime.scan; // 获取扫描状态主体
	const request = ws.request("scanBlueprint", { blueprint }); // 一次请求返回完整可堆叠结论
	scanState.requestId = request.id; // 只接受当前请求响应
	scanState.status = "scanning"; // 标记正在扫描
	store.transport.error = null; // 新扫描清除旧传输错误
	request.sent.then((isSent) => {
		if (isSent || scanState.requestId !== request.id) return; // 已发送或已进入新请求时无需处理
		scanState.status = "idle"; // 发送失败回到未扫描状态
	});
	return request.id; // 返回请求ID便于测试
};


// --- 注册扫描响应处理器 ---
const registerHandlers = () => {
	if (hasRegisteredHandlers) return; // 全局处理器只注册一次
	hasRegisteredHandlers = true; // 注册前锁定避免重复进入

	ws.registerHandler("scanBlueprint", (envelope) => {
		const scanState = store.runtime.scan; // 获取扫描状态主体
		if (!isEnvelopeCurrent(scanState.requestId, envelope)) return; // 只接受当前请求响应
		if (envelope.error) {
			scanState.status = "notStackable"; // 后端拒绝时按不可堆叠反馈
			scanState.issues = [typeof envelope.error === "string" ? { code: "scanFailed", message: envelope.error, details: {} } : envelope.error]; // 统一为结构化问题
			return;
		}
		const result = envelope.data || {}; // 读取完整扫描结论
		scanState.status = result.status || "unknown"; // stackable、notStackable或unknown
		scanState.issues = result.issues || []; // 保存问题列表供面板展示
		scanState.inputShapes = result.inputShapes || {}; // 保存输入探测形状
		scanState.outputShapes = result.outputShapes || {}; // 保存输出接收形状
	});
};

registerHandlers(); // 导入指令模块即建立扫描响应链

export default { scan, clear, registerHandlers }; // 导出扫描命令供工具栏和测试使用
