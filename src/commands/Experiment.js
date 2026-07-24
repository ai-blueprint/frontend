/*
 * 这个文件负责持续随机输入传播：开关开启 → 发送一轮蓝图 → 逐节点更新结果 → 完成后开始下一轮。
 * 组件只读取节点结果，不需要抽屉、性能测量或模型产物。
 */
import { nextTick } from "vue"; // 引入历史记录恢复时机
import store from "@/store.js"; // 引入实时运行和节点结果状态
import ws from "@/ws.js"; // 引入标准WebSocket请求能力
import { serializeBlueprint } from "@/utils/blueprintSerialization.js"; // 引入稳定蓝图序列化能力
import { isEnvelopeCurrent } from "@/utils/protocol.js"; // 引入请求ID匹配能力

let hasRegisteredHandlers = false; // 防止热更新重复注册消息处理器
let cycleTimer = null; // 保存下一轮传播计时器
let cycleToken = 0; // 每次启停或改图递增，旧轮次不能继续调度
let cycleResultIDs = new Set(); // 保存当前轮次真正产出结果的节点
let cycleErrorIDs = new Set(); // 保存当前轮次自身执行出错的节点


// --- 修改节点错误但不写入撤销历史 ---
const updateNodeError = (node, message) => {
	if (!node) return; // 节点已被删除时无需写入提示
	const wasPaused = store.history.paused; // 保留撤销重做过程中的暂停状态
	store.history.paused = true; // 运行反馈不应生成蓝图编辑历史
	node.error = message; // 沿用原作者节点警告图标
	if (!wasPaused) nextTick(() => { store.history.paused = false; }); // 视图更新后恢复自动记录
};


// --- 清除所有节点错误 ---
const clearNodeErrors = () => {
	store.blueprint.nodes.forEach((node) => updateNodeError(node, null)); // 新一轮开始前清除旧警告
};


// --- 清除全部传播结果 ---
const clearResults = () => {
	const execution = store.runtime.execution; // 获取逐节点结果主体
	execution.requestId = null; // 旧请求立即失效
	execution.status = "idle"; // 等待下一轮传播
	execution.durationMs = null; // 清除旧整图耗时
	execution.outputNodeIds = []; // 清除旧输出节点
	execution.errorCount = 0; // 清除旧错误统计
	execution.nodeResults = {}; // 节点下方不再显示旧张量
	execution.nodeErrors = {}; // 清除旧结构化错误
	clearNodeErrors(); // 同步清除画布警告
};


// --- 安排下一轮随机传播 ---
const scheduleNextCycle = (token) => {
	clearTimeout(cycleTimer); // 同一时刻只保留一个下一轮计时器
	if (!store.experiment.running || token !== cycleToken) return; // 已停止或蓝图已变化时不再运行
	cycleTimer = setTimeout(() => runCycle(token), 80); // 给浏览器一帧时间绘制本轮张量后立即继续
};


// --- 发送一轮蓝图传播 ---
const runCycle = (token = cycleToken) => {
	if (!store.experiment.running || token !== cycleToken) return null; // 开关关闭或轮次过期时直接停止
	let blueprint; // 校验成功后保存纯业务蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 运行数据不进入后端蓝图
	} catch (error) {
		store.transport.error = `无法运行：${error.message}`; // 结构错误停止持续运行
		store.experiment.running = false; // 关闭开关避免重复发送错误蓝图
		return null;
	}

	const execution = store.runtime.execution; // 获取当前传播状态
	const request = ws.request("runBlueprint", { blueprint, maxValues: 65536 }); // InputNode每轮按指定形状重新生成随机张量
	cycleResultIDs = new Set(); // 保留旧画面防止节点尺寸抖动，终态再清理未更新节点
	cycleErrorIDs = new Set(); // 当前轮次重新收集局部错误
	execution.requestId = request.id; // 逐节点消息只接受当前轮次
	execution.status = "running"; // 标记本轮正在传播
	execution.errorCount = 0; // 本轮从零统计错误
	store.transport.error = null; // 新一轮清除旧传输错误
	request.sent.then((isSent) => {
		if (isSent || execution.requestId !== request.id) return; // 已发送或已进入新轮次时无需处理
		execution.status = "sendFailed"; // 网络失败停止持续运行
		store.experiment.running = false; // 关闭开关等待用户重新连接
	});
	return request.id; // 返回请求ID便于测试和调试
};


// --- 切换持续运行状态 ---
const setRunning = (running) => {
	const shouldRun = !!running; // Switch输入统一转换为布尔值
	if (store.experiment.running === shouldRun) return; // 状态未变化无需重复启停
	store.experiment.running = shouldRun; // 先反馈开关状态
	cycleToken += 1; // 所有旧轮次和计时器立即失效
	clearTimeout(cycleTimer); // 清除尚未开始的下一轮
	clearResults(); // 启停时清理旧张量，避免误认为仍在更新
	if (shouldRun) runCycle(cycleToken); // 开启后立即开始第一轮随机传播
};


// --- 蓝图变化后重新开始全部输入下游传播 ---
const invalidate = () => {
	const shouldRestart = store.experiment.running; // 记录修改前是否正在实时观察
	cycleToken += 1; // 当前在途消息全部失效
	clearTimeout(cycleTimer); // 取消旧图的下一轮
	clearResults(); // 节点和连线变化后清空旧张量
	if (shouldRestart) cycleTimer = setTimeout(() => runCycle(cycleToken), 80); // 使用修改后的新图继续观察
};


// --- 注册逐节点传播消息处理器 ---
const registerHandlers = () => {
	if (hasRegisteredHandlers) return; // 全局处理器只注册一次
	hasRegisteredHandlers = true; // 注册前锁定避免重复进入

	ws.registerHandler("nodeResult", (envelope) => {
		const execution = store.runtime.execution; // 获取当前轮次状态
		if (!store.experiment.running || !isEnvelopeCurrent(execution.requestId, envelope) || envelope.error) return; // 忽略停止后和过期消息
		const result = envelope.data; // 节点结果包含全部输出端口
		if (!result?.nodeId) return; // 无节点ID无法关联画布
		cycleResultIDs.add(result.nodeId); // 标记节点在本轮确实收到了上游值并完成计算
		execution.nodeResults[result.nodeId] = result; // 节点计算完成后立即覆盖它下方的张量图
		delete execution.nodeErrors[result.nodeId]; // 成功结果清除该节点旧错误
		const node = store.blueprint.nodes.find((item) => item.id === result.nodeId); // 查找对应画布节点
		updateNodeError(node, null); // 成功计算移除节点警告
	});

	ws.registerHandler("nodeError", (envelope) => {
		const execution = store.runtime.execution; // 获取当前轮次状态
		if (!store.experiment.running || !isEnvelopeCurrent(execution.requestId, envelope)) return; // 旧错误不能污染新轮次
		const error = envelope.error; // 读取结构化节点错误
		if (!error?.nodeId) return; // 无节点ID的错误由全局状态保存
		cycleErrorIDs.add(error.nodeId); // 只记录真正执行出错的节点，下游跳过不显示错误
		execution.nodeErrors[error.nodeId] = error; // 保存错误详情
		delete execution.nodeResults[error.nodeId]; // 错误节点不继续展示上一轮张量
		const node = store.blueprint.nodes.find((item) => item.id === error.nodeId); // 查找对应画布节点
		updateNodeError(node, error.message); // 使用原作者警告图标显示错误
	});

	ws.registerHandler("blueprintComplete", (envelope) => {
		const execution = store.runtime.execution; // 获取当前轮次状态
		if (!isEnvelopeCurrent(execution.requestId, envelope)) return; // 只允许当前轮次收口
		const result = envelope.data || {}; // 读取整图终态
		for (const nodeID of Object.keys(execution.nodeResults)) {
			if (!cycleResultIDs.has(nodeID)) delete execution.nodeResults[nodeID]; // 本轮没有上游值的节点清除旧张量
		}
		for (const nodeID of Object.keys(execution.nodeErrors)) {
			if (!cycleErrorIDs.has(nodeID)) delete execution.nodeErrors[nodeID]; // 本轮未再次出错的节点清除旧错误数据
		}
		store.blueprint.nodes.forEach((node) => {
			if (!cycleErrorIDs.has(node.id) && !cycleResultIDs.has(node.id)) updateNodeError(node, null); // 被跳过节点只清空，不误标为错误
		});
		execution.status = result.status || "failed"; // 区分成功、局部错误完成和整图失败
		execution.durationMs = result.durationMs ?? null; // 保存本轮总耗时
		execution.outputNodeIds = result.outputNodeIds || []; // 保存有效输出节点
		execution.errorCount = Number(result.errorCount) || 0; // 保存错误数量
		if (result.status === "failed") {
			store.transport.error = result.error?.message || "蓝图运行失败"; // 结构或计算失败停止循环
			store.experiment.running = false; // 防止错误请求持续刷屏
			return;
		}
		scheduleNextCycle(cycleToken); // 成功或局部错误都继续下一轮，便于用户实时修正参数
	});
};

registerHandlers(); // 导入指令模块即建立实时传播链

export default { setRunning, runCycle, invalidate, registerHandlers }; // 导出Switch和蓝图监听可触发的指令
