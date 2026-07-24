/*
 * 这个文件负责蓝图的安全持久化和后端请求序列化。
 * 导出文件带明确版本；节点和连线采用白名单重建，因此VueFlow运行时字段不会泄漏。
 */

const schemaVersion = 1; // 第一版文件结构固定为{schemaVersion, blueprint}

// --- 深拷贝可持久化业务值 ---
const cloneValue = (value) => JSON.parse(JSON.stringify(value ?? {})); // 参数、端口只保留可JSON序列化内容


// --- 清理单个节点 ---
const cleanNode = (node) => ({
	id: node.id, // 节点ID用于连接线和运行结果关联
	type: node.type || "baseNode", // 保留VueFlow自定义节点类型
	position: { x: Number(node.position?.x) || 0, y: Number(node.position?.y) || 0 }, // 只保存稳定画布坐标
	data: {
		opcode: node.data?.opcode, // 后端通过操作码执行节点
		label: node.data?.label || node.data?.opcode, // 保存用户可修改的显示名称
		ports: cloneValue(node.data?.ports), // 保存端口业务定义
		params: cloneValue(node.data?.params), // 保存节点参数及当前值
	},
});


// --- 清理单条连接线 ---
const cleanEdge = (edge) => ({
	id: edge.id, // 连接线ID保持稳定
	source: edge.source, // 输出节点ID
	sourceHandle: edge.sourceHandle, // 输出端口标识
	target: edge.target, // 输入节点ID
	targetHandle: edge.targetHandle, // 输入端口标识
});


// --- 校验蓝图核心结构 ---
const validateBlueprint = (blueprint) => {
	if (!blueprint || typeof blueprint !== "object") throw new Error("蓝图内容必须是对象"); // 根结构错误时停止导入
	if (typeof blueprint.name !== "string") throw new Error("蓝图缺少名称"); // 名称必须可直接显示
	if (!Array.isArray(blueprint.nodes) || !Array.isArray(blueprint.edges)) throw new Error("蓝图必须包含节点和连接线数组"); // 两个集合缺一不可

	const nodeIds = new Set(); // 收集节点ID并检查重复
	blueprint.nodes.forEach((node, index) => {
		if (!node || typeof node.id !== "string" || !node.id) throw new Error(`第${index + 1}个节点缺少ID`); // 每个节点必须可关联
		if (nodeIds.has(node.id)) throw new Error(`节点ID重复：${node.id}`); // 重复ID会破坏结果映射
		if (typeof node.data?.opcode !== "string" || !node.data.opcode) throw new Error(`节点${node.id}缺少opcode`); // 后端执行需要操作码
		if (!Number.isFinite(Number(node.position?.x)) || !Number.isFinite(Number(node.position?.y))) throw new Error(`节点${node.id}坐标无效`); // 画布坐标必须是有限数字
		nodeIds.add(node.id); // 当前节点通过校验后加入索引
	});
	blueprint.edges.forEach((edge, index) => {
		if (!edge || typeof edge.id !== "string" || !edge.id) throw new Error(`第${index + 1}条连接线缺少ID`); // 连线必须有稳定ID
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error(`连接线${edge.id}引用了不存在的节点`); // 禁止悬空连线进入状态
		if (typeof edge.sourceHandle !== "string" || typeof edge.targetHandle !== "string") throw new Error(`连接线${edge.id}缺少端口`); // 后端需要明确端口关系
	});
	return true; // 返回成功便于测试和命令层组合
};


// --- 生成后端可执行蓝图 ---
const serializeBlueprint = (blueprint) => {
	validateBlueprint(blueprint); // 发送前先阻止不完整蓝图
	return { name: blueprint.name, nodes: blueprint.nodes.map(cleanNode), edges: blueprint.edges.map(cleanEdge) }; // 白名单重建业务数据
};


// --- 生成版本化导出文件 ---
const createBlueprintFile = (blueprint) => ({ schemaVersion, blueprint: serializeBlueprint(blueprint) }); // 文件外层声明结构版本


// --- 读取版本化导入文件 ---
const readBlueprintFile = (input) => {
	const fileData = typeof input === "string" ? JSON.parse(input) : input; // 文件文本和测试对象共用入口
	const blueprint = fileData?.schemaVersion === schemaVersion ? fileData.blueprint : fileData; // 兼容旧版直接导出的原始蓝图对象
	if (fileData?.schemaVersion != null && fileData.schemaVersion !== schemaVersion) throw new Error(`仅支持蓝图文件版本${schemaVersion}`); // 有版本声明时拒绝未知未来格式
	validateBlueprint(blueprint); // 写入store前完整校验
	return serializeBlueprint(blueprint); // 再次白名单清理可能夹带的临时字段
};

export { schemaVersion, cleanNode, cleanEdge, validateBlueprint, serializeBlueprint, createBlueprintFile, readBlueprintFile }; // 导出序列化工具供命令和测试使用
