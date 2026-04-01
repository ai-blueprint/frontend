import ELK from "elkjs/lib/elk.bundled.js"; // 引入elkjs布局引擎

// --- 使用elkjs计算节点自动布局 ---
const calculateLayout = async (nodes, edges) => {
	if (!nodes.length) return []; // 没有节点直接返回空数组

	const elk = new ELK(); // 创建elk实例

	// --- 构建elk节点数据 ---
	const elkNodes = nodes.map((node) => {
		const width = node.dimensions?.width || 150; // 获取节点宽度，默认150
		const height = node.dimensions?.height || 50; // 获取节点高度，默认50
		const inputPorts = node.data?.ports?.input || {}; // 获取输入端口
		const outputPorts = node.data?.ports?.output || {}; // 获取输出端口
		const inputKeys = Object.keys(inputPorts); // 输入端口标识列表
		const outputKeys = Object.keys(outputPorts); // 输出端口标识列表

		// --- 生成端口布局信息（保持端口上下顺序，避免连线交叉）---
		const ports = []; // 端口数组

		inputKeys.forEach((key, index) => {
			const portY = (height / (inputKeys.length + 1)) * (index + 1); // 按顺序均匀分布在节点左侧
			ports.push({
				id: `${node.id}-input-${key}`, // 端口唯一标识
				properties: {
					"port.side": "WEST", // 输入端口在左侧
					"port.index": index, // 端口排列顺序
				},
				x: 0, // 输入端口在节点最左边
				y: portY, // 端口Y坐标
			});
		});

		outputKeys.forEach((key, index) => {
			const portY = (height / (outputKeys.length + 1)) * (index + 1); // 按顺序均匀分布在节点右侧
			ports.push({
				id: `${node.id}-output-${key}`, // 端口唯一标识
				properties: {
					"port.side": "EAST", // 输出端口在右侧
					"port.index": index, // 端口排列顺序
				},
				x: width, // 输出端口在节点最右边
				y: portY, // 端口Y坐标
			});
		});

		return {
			id: node.id, // 节点ID
			width, // 节点宽度
			height, // 节点高度
			ports, // 端口列表
		};
	});

	// --- 构建elk边数据 ---
	const elkEdges = edges.map((edge) => ({
		id: edge.id, // 连接线ID
		sources: [`${edge.source}-output-${edge.sourceHandle}`], // 来源端口
		targets: [`${edge.target}-input-${edge.targetHandle}`], // 目标端口
	}));

	// --- elk布局配置 ---
	const graph = {
		id: "root", // 根图ID
		layoutOptions: {
			"elk.algorithm": "layered", // 使用分层布局算法
			"elk.direction": "RIGHT", // 从左到右布局
			"elk.spacing.nodeNode": "50", // 节点间距50
			"elk.layered.spacing.nodeNodeBetweenLayers": "80", // 层间距80
			"elk.portConstraints": "FIXED_ORDER", // 端口顺序固定，防止连线交叉
		},
		children: elkNodes, // 节点列表
		edges: elkEdges, // 连接线列表
	};

	const layoutResult = await elk.layout(graph); // 执行布局计算

	// --- 提取计算结果中的新坐标 ---
	const positionMap = {}; // 坐标映射表
	layoutResult.children.forEach((elkNode) => {
		positionMap[elkNode.id] = { x: elkNode.x, y: elkNode.y }; // 记录每个节点的新坐标
	});

	return positionMap; // 返回坐标映射
};

export { calculateLayout }; // 导出布局计算函数
