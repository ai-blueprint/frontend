// 根据蓝图连线，把上游节点已有的输出映射为当前节点的输入。
export const deriveNodeInputs = (nodeId, edges, nodeResults, requestId) => {
	const inputs = {};
	for (const edge of edges || []) {
		if (edge.target !== nodeId) continue;
		const sourcePort = edge.sourceHandle || "out";
		const targetPort = edge.targetHandle || "in";
		const sourceResult = nodeResults?.[edge.source];
		if (requestId !== undefined && sourceResult?._requestId !== requestId) continue; // 持续运行时禁止混用不同轮次的数据
		const output = sourceResult?.outputs?.[sourcePort];
		if (output !== undefined) inputs[targetPort] = output;
	}
	return inputs;
};
