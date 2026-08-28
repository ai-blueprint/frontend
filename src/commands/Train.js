/*
 * 这个文件负责单步训练：点击训练 → 发送蓝图 → 后端反向传播 → 回填loss、权重和梯度。
 * 连续训练暂时由用户重复点击触发，保持训练节奏和每一步变化都清楚可见。
 */
import store from "@/store.js"; // 引入训练反馈状态
import ws from "@/ws.js"; // 引入标准WebSocket请求能力
import { serializeBlueprint } from "@/utils/blueprintSerialization.js"; // 引入稳定蓝图序列化能力
import { isEnvelopeCurrent } from "@/utils/protocol.js"; // 引入请求ID匹配能力

let hasRegisteredHandlers = false; // 防止热更新重复注册响应处理器
let continuousTimer = null; // 保存连续训练的下一步计时器


// --- 发起单步训练 ---
const step = () => {
	let blueprint; // 校验成功后保存纯业务蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 运行数据不进入后端蓝图
	} catch (error) {
		store.runtime.training.status = "failed"; // 结构错误直接停止本轮训练
		store.runtime.training.error = error.message; // 保存可显示的失败原因
		return null;
	}

	const training = store.runtime.training; // 获取训练状态主体
	const request = ws.request("trainStep", { blueprint, maxValues: 65536, optimizer: training.optimizer, learningRate: training.learningRate, gradientClip: training.gradientClip }); // 携带当前超参数请求后端更新权重
	training.requestId = request.id; // 只接受当前训练请求响应
	training.status = "training"; // 标记正在计算梯度和更新权重
	training.error = null; // 新训练清除旧错误
	request.sent.then((isSent) => {
		if (isSent || training.requestId !== request.id) return; // 已发送或已有新请求时无需处理
		training.status = "failed"; // 发送失败停止本轮训练
		training.error = "训练请求未发送"; // 给出明确失败原因
	});
	return request.id; // 返回请求ID便于测试和调试
};


// --- 安排连续训练下一步 ---
const scheduleContinuousStep = () => {
	clearTimeout(continuousTimer); // 同一时刻只保留一个训练计时器
	if (!store.runtime.training.continuous) return; // 用户停止后不再发送新训练
	continuousTimer = setTimeout(() => step(), 80); // 每轮留出时间让曲线和梯度先完成渲染
};


// --- 切换连续训练 ---
const setContinuous = (continuous) => {
	store.runtime.training.continuous = !!continuous; // 先同步开关状态
	clearTimeout(continuousTimer); // 停止旧计时器，避免重复训练
	if (store.runtime.training.continuous && store.runtime.training.status !== "training") step(); // 开启后立即开始第一步
};


// --- 重置训练结果和后端模型 ---
const reset = () => {
	const training = store.runtime.training; // 获取训练状态主体
	training.requestId = null; // 旧响应立即失效
	training.status = "idle"; // 回到未训练状态
	training.step = 0; // 清除步数
	training.loss = null; // 清除损失值
	training.curve = []; // 清除曲线
	training.nodes = {}; // 清除权重和梯度快照
	training.error = null; // 清除错误
	training.continuous = false; // 清除时同时停止连续训练
	clearTimeout(continuousTimer); // 取消尚未开始的下一步训练
	const request = ws.request("resetTraining", {}); // 通知后端丢弃权重和优化器状态
	request.sent.then((isSent) => {
		if (!isSent) training.error = "训练已清除，但后端未连接"; // 后端未连接时明确告诉用户实际状态
	});
};


// --- 注册训练响应处理器 ---
const registerHandlers = () => {
	if (hasRegisteredHandlers) return; // 全局处理器只注册一次
	hasRegisteredHandlers = true; // 注册前锁定避免重复进入
	ws.registerHandler("trainStep", (envelope) => {
		const training = store.runtime.training; // 获取训练状态主体
		if (!isEnvelopeCurrent(training.requestId, envelope)) return; // 旧响应不能覆盖当前训练结果
		if (envelope.error) {
			training.status = "failed"; // 后端拒绝时结束当前训练
			training.error = typeof envelope.error === "string" ? envelope.error : envelope.error.message || "训练失败"; // 保存错误文案
			training.continuous = false; // 后端失败时停止连续训练
			return;
		}
		const result = envelope.data || {}; // 读取单步训练快照
		training.status = "succeeded"; // 标记本轮更新完成
		training.step += 1; // 完成步数加一
		training.loss = Number(result.loss); // 保存最近损失
		training.curve.push(training.loss); // 追加训练曲线点
		if (training.curve.length > 200) training.curve.shift(); // 限制曲线长度避免长期训练占满内存
		training.nodes = result.nodes || {}; // 保存按节点分组的梯度快照
		scheduleContinuousStep(); // 连续模式在本轮完成后安排下一步
	});
};

registerHandlers(); // 导入指令模块即建立训练响应链

export default { step, setContinuous, reset, registerHandlers }; // 导出训练指令供界面调用
