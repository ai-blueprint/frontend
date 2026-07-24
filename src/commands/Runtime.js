/*
 * 这个文件集中处理运行、跑分、训练、产物和插件指令。
 * 组件只触发方法；每个响应先核对请求ID，再修改runtime状态，过期消息不会覆盖新任务。
 */
import store from "@/store.js"; // 引入独立运行时状态
import ws from "@/ws.js"; // 引入标准请求和信封订阅能力
import Blueprint from "@/commands/Blueprint.js"; // 引入检查点蓝图恢复指令
import { serializeBlueprint } from "@/utils/blueprintSerialization.js"; // 引入后端蓝图清理工具
import { isEnvelopeCurrent } from "@/utils/protocol.js"; // 引入请求ID防过期判定

let hasRegisteredHandlers = false; // 防止热更新或重复导入造成多次处理

// --- 提取可显示错误文本 ---
const getErrorMessage = (error, fallback = "操作失败") => {
	if (typeof error === "string") return error; // 兼容传输层字符串错误
	return error?.message || fallback; // 结构化错误优先显示message
};


// --- 检查响应是否属于当前请求 ---
const isCurrentRequest = (state, envelope) => isEnvelopeCurrent(state.requestId, envelope); // 广播不参与请求关联


// --- 等待请求发送结果 ---
const watchSendResult = async (state, requestId, sent) => {
	const isSent = await sent; // 等待连接及socket.send完成
	if (state.requestId !== requestId) return; // 旧请求发送结果不能覆盖后发请求
	if (isSent || state.status === "succeeded" || state.status === "failed") return; // 已收到快速响应时不反向覆盖终态
	state.status = "sendFailed"; // 本地发送失败与后端终态明确区分
};


// --- 运行蓝图 ---
const runBlueprint = () => {
	const execution = store.runtime.execution; // 取得运行状态主体
	let blueprint; // 校验通过后保存后端蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 请求中剥离VueFlow临时字段
	} catch (error) {
		store.transport.error = `无法运行：${error.message}`; // 蓝图不完整时给出可见反馈
		return null; // 不发送无效蓝图
	}

	const request = ws.request("runBlueprint", { blueprint }); // 使用协议规定的运行请求类型
	execution.requestId = request.id; // 先登记ID供响应防过期
	execution.status = "running"; // 界面显示运行中
	execution.durationMs = null; // 清除上次总耗时
	execution.outputNodeIds = []; // 清除上次输出节点
	execution.errorCount = 0; // 新运行从零统计错误
	execution.nodeResults = {}; // 清空旧结果避免错看
	execution.nodeErrors = {}; // 清空旧错误避免错看
	watchSendResult(execution, request.id, request.sent); // 异步收口发送失败
	return request.id; // 返回ID便于测试和调用方追踪
};


// --- 跑分蓝图 ---
const scoreBlueprint = () => {
	const scoring = store.runtime.scoring; // 取得跑分状态主体
	let blueprint; // 保存校验后的蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 跑分使用同一稳定蓝图结构
	} catch (error) {
		scoring.status = "failed"; // 本地校验失败直接反馈
		scoring.error = error.message; // 显示具体蓝图问题
		return null; // 无效蓝图不发送
	}

	const request = ws.request("scoreBlueprint", { blueprint }); // 使用协议规定的跑分类型
	scoring.requestId = request.id; // 登记当前跑分ID
	scoring.status = "loading"; // 面板进入加载态
	scoring.result = null; // 清除旧跑分结果
	scoring.error = null; // 清除旧错误
	watchSendResult(scoring, request.id, request.sent); // 收口发送失败
	return request.id; // 返回当前请求ID
};


// --- 启动合成数据训练 ---
const trainBlueprint = () => {
	const training = store.runtime.training; // 取得训练状态主体
	let blueprint; // 保存校验后的蓝图
	try {
		blueprint = serializeBlueprint(store.blueprint); // 训练只发送稳定业务字段
	} catch (error) {
		training.status = "failed"; // 本地校验失败停止训练
		training.error = error.message; // 面板显示校验原因
		return null; // 不发送错误配置
	}

	const trainingData = { ...training.config }; // 后端训练指令直接读取training字段中的安全合成配置
	if (trainingData.lossNodeId) trainingData.lossOutput = { nodeId: trainingData.lossNodeId, port: "loss" }; // 可选损失节点转换为明确端口选择器
	delete trainingData.lossNodeId; // 只发送后端理解的损失选择结构
	let artifactName; // 训练完成后自动保存到当前受控检查点名称
	try {
		artifactName = validateArtifactName(store.runtime.artifacts.artifactName); // 训练产物沿用模型产物名称
	} catch (error) {
		training.status = "failed"; // 非法检查点名称阻止训练后权重丢失
		training.error = error.message; // 显示允许格式
		return null;
	}
	const request = ws.request("trainBlueprint", { blueprint, training: trainingData, checkpointPath: `checkpoints/${artifactName}` }); // 训练成功后直接持久化真实权重
	training.requestId = request.id; // 登记当前训练ID
	training.status = "running"; // 显示训练进行中
	training.progress = null; // 清除上次进度
	training.result = null; // 清除上次完成数据
	training.error = null; // 清除上次错误
	watchSendResult(training, request.id, request.sent); // 收口发送失败
	return request.id; // 返回训练请求ID
};


// --- 校验产物名称 ---
const validateArtifactName = (artifactName) => {
	const normalizedName = String(artifactName || "").trim(); // 去掉用户误输入的首尾空格
	if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(normalizedName)) throw new Error("产物名称仅支持字母、数字、点、下划线和短横线，最长64位"); // 禁止路径分隔符和目录穿越
	return normalizedName; // 返回可安全交给后端的名称
};


// --- 执行产物操作 ---
const requestArtifact = (type, action, extraData = {}) => {
	const artifacts = store.runtime.artifacts; // 取得产物状态主体
	let artifactName; // 保存安全名称
	try {
		artifactName = validateArtifactName(artifacts.artifactName); // 所有产物动作共享名称限制
	} catch (error) {
		artifacts.status = "failed"; // 名称错误直接停止
		artifacts.error = error.message; // 面板显示允许格式
		return null; // 不向后端发送任意路径
	}

	const data = { artifactName, ...extraData }; // 请求只携带产物名称和受控选项
	if (type === "saveCheckpoint" || type === "loadCheckpoint") data.path = `checkpoints/${artifactName}`; // 检查点统一放入受控子目录
	if (type === "exportPython") data.path = `exports/${artifactName}.py`; // Python导出固定扩展名和目录
	if (type === "exportONNX") data.path = `exports/${artifactName}.onnx`; // ONNX导出固定扩展名和目录
	try {
		if (type !== "loadCheckpoint") data.blueprint = serializeBlueprint(store.blueprint); // 保存和导出需要当前蓝图
	} catch (error) {
		artifacts.status = "failed"; // 蓝图结构错误时不发送产物请求
		artifacts.error = error.message; // 显示具体校验原因
		return null; // 保留后端状态不变
	}
	const request = ws.request(type, data); // 发起对应协议请求
	artifacts.requestId = request.id; // 登记当前产物请求ID
	artifacts.status = "loading"; // 显示操作中
	artifacts.action = action; // 记录当前动作便于状态反馈
	artifacts.result = null; // 清除上次结果
	artifacts.error = null; // 清除上次错误
	watchSendResult(artifacts, request.id, request.sent); // 收口发送失败
	return request.id; // 返回产物请求ID
};

const saveCheckpoint = () => requestArtifact("saveCheckpoint", "save"); // 保存当前蓝图检查点
const loadCheckpoint = () => requestArtifact("loadCheckpoint", "load"); // 按安全产物名加载检查点
const exportModel = (format) => {
	const type = format === "onnx" ? "exportONNX" : "exportPython"; // 后端为两种导出提供独立指令
	return requestArtifact(type, "export"); // 产物始终写入后端artifacts目录
};


// --- 更新训练配置 ---
const updateTrainingConfig = (key, value) => {
	const config = store.runtime.training.config; // 获取当前合成数据训练配置
	if (!(key in config)) return; // 未声明字段不能动态写入状态
	const numberRules = { epochs: [1, 1000, true], batchSize: [1, 4096, true], sampleCount: [1, 1000000, true], learningRate: [0.0000001, 10, false] }; // 数值边界防止误操作
	if (!numberRules[key]) {
		config[key] = String(value); // 优化器和损失节点按文本保存
		return;
	}
	const [minimum, maximum, integer] = numberRules[key]; // 读取字段允许范围
	const numberValue = Math.min(maximum, Math.max(minimum, Number(value) || minimum)); // 将输入限制在安全范围
	config[key] = integer ? Math.round(numberValue) : numberValue; // 计数字段取整，学习率保留小数
};


// --- 更新产物名称 ---
const updateArtifactName = (artifactName) => {
	store.runtime.artifacts.artifactName = String(artifactName); // 输入阶段保留原值，执行时再严格校验并反馈
};


// --- 取消当前训练 ---
const cancelTraining = () => {
	const training = store.runtime.training; // 获取当前训练生命周期
	if (!training.requestId || !["running", "cancelling"].includes(training.status)) return null; // 没有在途训练时无需发送取消
	const request = ws.request("cancelTraining", { trainingId: training.requestId }); // 后端按原训练ID和当前连接确认所有权
	training.cancelRequestId = request.id; // 单独记录取消请求避免覆盖训练流ID
	training.status = "cancelling"; // 禁止编辑期间再次启动重任务
	return request.id;
};


// --- 打开或关闭运行工作台 ---
const setWorkspace = (visible, activeTab = store.workspace.activeTab) => {
	store.workspace.visible = !!visible; // 根据触发入口控制抽屉显示
	store.workspace.activeTab = activeTab; // 同时切换到用户需要的业务页签
	if (visible && activeTab === "plugins" && store.runtime.plugins.status === "idle") getPlugins(); // 首次打开插件页自动加载列表
};


// --- 蓝图业务变化后作废运行时结果 ---
const invalidateBlueprintRuntime = () => {
	const execution = store.runtime.execution; // 获取节点运行结果主体
	execution.requestId = null; // 后续到达的旧运行消息全部失效
	execution.status = "idle"; // 修改后的蓝图尚未运行
	execution.durationMs = null; // 清除旧蓝图耗时
	execution.outputNodeIds = []; // 清除旧输出节点
	execution.errorCount = 0; // 清除旧错误统计
	execution.nodeResults = {}; // 清除旧节点输出
	execution.nodeErrors = {}; // 清除旧节点错误
	store.runtime.scoring.requestId = null; // 旧跑分响应不能写入新蓝图
	store.runtime.scoring.status = "idle"; // 新蓝图尚未跑分
	store.runtime.scoring.result = null; // 清除旧性能数据
	store.runtime.scoring.error = null; // 清除旧跑分错误
	if (store.runtime.training.status === "running") cancelTraining(); // 编辑中的训练先通知后端停止，避免后台继续占用资源
	else if (store.runtime.training.status !== "cancelling") store.runtime.training.requestId = null; // 无在途训练时旧响应全部失效
};


// --- 获取插件列表 ---
const getPlugins = () => {
	const plugins = store.runtime.plugins; // 取得插件状态主体
	const request = ws.request("listPlugins", {}); // 请求后端插件注册状态
	plugins.requestId = request.id; // 登记当前插件请求ID
	plugins.status = "loading"; // 显示加载中
	plugins.error = null; // 清除旧错误
	watchSendResult(plugins, request.id, request.sent); // 收口发送失败
	return request.id; // 返回插件请求ID
};


// --- 重新加载插件 ---
const reloadPlugins = () => {
	const plugins = store.runtime.plugins; // 复用插件状态主体
	const request = ws.request("reloadPlugins", {}); // 请求后端主动重载
	plugins.requestId = request.id; // 新请求替代旧插件请求
	plugins.status = "loading"; // 显示重载中
	plugins.error = null; // 清除旧热更新错误
	watchSendResult(plugins, request.id, request.sent); // 收口发送失败
	return request.id; // 返回重载请求ID
};


// --- 注册运行时消息处理器 ---
const registerHandlers = () => {
	if (hasRegisteredHandlers) return; // 全局处理器只注册一次
	hasRegisteredHandlers = true; // 先加锁避免导入链重复进入

	ws.registerHandler("nodeResult", (envelope) => {
		const execution = store.runtime.execution; // 获取当前运行状态
		if (!isCurrentRequest(execution, envelope) || envelope.error) return; // 忽略过期或错误信封
		const result = envelope.data; // 协议规定data直接是节点结果
		if (!result?.nodeId) return; // 无节点ID无法归档
		execution.nodeResults[result.nodeId] = result; // 按节点ID写入结构化输出
		delete execution.nodeErrors[result.nodeId]; // 成功结果覆盖同节点本轮早期错误
	});

	ws.registerHandler("nodeError", (envelope) => {
		const execution = store.runtime.execution; // 获取当前运行状态
		if (!isCurrentRequest(execution, envelope)) return; // 过期错误不能污染新运行
		const error = envelope.error; // 协议规定结构化错误位于error字段
		if (!error?.nodeId) return; // 无节点ID的错误留给全局传输反馈
		execution.nodeErrors[error.nodeId] = error; // 保存code、phase、opcode和details
		delete execution.nodeResults[error.nodeId]; // 错误状态不同时展示旧成功结果
	});

	ws.registerHandler("blueprintComplete", (envelope) => {
		const execution = store.runtime.execution; // 获取当前运行状态
		if (!isCurrentRequest(execution, envelope)) return; // 只允许当前请求终结运行
		if (envelope.error) {
			execution.status = "failed"; // 异常终态按失败显示
			store.transport.error = getErrorMessage(envelope.error, "蓝图运行失败"); // 无节点错误显示在全局状态
			return;
		}
		const result = envelope.data || {}; // 读取协议终态统计
		execution.status = result.status === "succeeded" ? "succeeded" : "failed"; // blueprintComplete是唯一运行终态
		execution.durationMs = result.durationMs ?? null; // 保存总耗时
		execution.outputNodeIds = result.outputNodeIds || []; // 保存输出节点列表
		execution.errorCount = Number(result.errorCount) || 0; // 保存错误总数
	});

	ws.registerHandler("scoreComplete", (envelope) => {
		const scoring = store.runtime.scoring; // 获取当前跑分状态
		if (!isCurrentRequest(scoring, envelope)) return; // 忽略旧跑分响应
		scoring.status = envelope.error ? "failed" : "succeeded"; // 根据信封错误决定结果
		scoring.result = envelope.error ? null : envelope.data; // 成功时保存完整指标
		scoring.error = envelope.error ? getErrorMessage(envelope.error, "跑分失败") : null; // 失败时显示原因
	});

	ws.registerHandler("trainProgress", (envelope) => {
		const training = store.runtime.training; // 获取当前训练状态
		if (!isCurrentRequest(training, envelope) || envelope.error) return; // 仅接收当前训练进度
		training.progress = envelope.data; // 保存epoch、loss等后端进度快照
	});

	ws.registerHandler("trainComplete", (envelope) => {
		const training = store.runtime.training; // 获取当前训练状态
		if (!isCurrentRequest(training, envelope)) return; // 忽略过期完成消息
		training.status = envelope.error ? "failed" : envelope.data?.status === "cancelled" ? "cancelled" : "succeeded"; // 区分正常完成和安全取消
		training.result = envelope.error ? null : envelope.data; // 成功时保留训练摘要
		training.error = envelope.error ? getErrorMessage(envelope.error, "训练失败") : null; // 失败时显示信封错误
	});

	ws.registerHandler("trainError", (envelope) => {
		const training = store.runtime.training; // 获取当前训练状态
		if (!isCurrentRequest(training, envelope)) return; // 旧训练错误不能覆盖新任务
		training.status = "failed"; // 错误事件终止当前训练
		training.error = getErrorMessage(envelope.error || envelope.data, "训练失败"); // 兼容错误位于标准error字段
	});

	ws.registerHandler("cancelComplete", (envelope) => {
		const training = store.runtime.training; // 获取正在取消的训练状态
		if (envelope.id !== training.cancelRequestId) return; // 只接收当前取消请求反馈
		training.status = envelope.error ? "failed" : "cancelling"; // 收到取消请求不等于训练线程已停止，继续等待训练终态
		training.error = envelope.error ? getErrorMessage(envelope.error, "取消训练失败") : null; // 显示取消错误
		training.cancelRequestId = null; // 释放取消请求关联
	});

	ws.registerHandler("cancelError", (envelope) => {
		const training = store.runtime.training; // 获取取消失败的训练状态
		if (envelope.id !== training.cancelRequestId) return; // 忽略旧取消请求错误
		training.status = "failed"; // 取消失败需要阻止界面继续等待
		training.error = getErrorMessage(envelope.error, "取消训练失败"); // 显示后端所有权或任务状态错误
		training.cancelRequestId = null; // 释放取消请求关联
	});

	["checkpointSaveComplete", "checkpointLoadComplete", "exportComplete", "checkpointError", "exportError"].forEach((type) => ws.registerHandler(type, (envelope) => {
		const artifacts = store.runtime.artifacts; // 获取当前产物状态
		if (!isCurrentRequest(artifacts, envelope)) return; // 忽略旧产物响应
		artifacts.status = envelope.error ? "failed" : "succeeded"; // 根据信封收口操作
		artifacts.result = envelope.error ? null : envelope.data; // 成功时保存后端产物信息
		artifacts.error = envelope.error ? getErrorMessage(envelope.error, "产物操作失败") : null; // 失败时显示原因
		if (type === "checkpointLoadComplete" && envelope.data?.blueprint) Blueprint.importBlueprint({ schemaVersion: 1, blueprint: envelope.data.blueprint }); // 加载成功后恢复蓝图并重建撤销历史
	}));

	["pluginList", "pluginReloadComplete", "pluginError"].forEach((type) => ws.registerHandler(type, (envelope) => {
		const plugins = store.runtime.plugins; // 获取插件状态
		if (!isCurrentRequest(plugins, envelope)) return; // 忽略旧插件请求响应
		plugins.status = envelope.error ? "failed" : "succeeded"; // 根据信封收口加载状态
		plugins.error = envelope.error ? getErrorMessage(envelope.error, "插件操作失败") : null; // 保存结构化错误文本
		if (!envelope.error) plugins.items = envelope.data?.plugins || envelope.data || []; // 兼容列表本身或plugins字段
	}));

	ws.registerHandler("registryUpdated", ({ data }) => {
		store.runtime.plugins.status = "succeeded"; // 广播表示热重载已成功
		store.runtime.plugins.error = null; // 清除上次热更新错误
		if (Array.isArray(data?.plugins)) store.runtime.plugins.items = data.plugins; // 广播携带插件状态时同步列表
	});

	ws.registerHandler("reloadError", ({ error, data }) => {
		store.runtime.plugins.status = "failed"; // 热重载失败直接反馈
		store.runtime.plugins.error = getErrorMessage(error || data?.error || data, "插件热重载失败"); // 广播没有请求ID也应可见
	});
};

registerHandlers(); // 导入命令模块即建立运行时响应链

export { validateArtifactName, isCurrentRequest }; // 导出纯判定供单元测试验证
export default { runBlueprint, scoreBlueprint, trainBlueprint, cancelTraining, saveCheckpoint, loadCheckpoint, exportModel, updateTrainingConfig, updateArtifactName, setWorkspace, invalidateBlueprintRuntime, getPlugins, reloadPlugins, registerHandlers }; // 导出组件可触发的运行时指令
