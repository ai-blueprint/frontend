/*
 * 这个文件把后端序列化结果转换成有边界的预览数据。
 * 它不操作界面，TensorResult组件只需按kind和维度渲染返回的结构。
 */

const maxPreviewValues = 64; // 所有结果最多展示64个值，避免大张量阻塞界面
const maxMatrixSide = 8; // 二维热力表每个方向最多展示8格

// --- 将任意结果压缩为安全预览 ---
const createResultPreview = (result) => {
	if (!result || typeof result !== "object") return { kind: "scalar", value: result }; // 基础值按标量显示
	if (result.kind !== "tensor") return { ...result, values: Array.isArray(result.values) ? result.values.slice(0, maxPreviewValues) : result.values }; // 列表和对象保留协议类型并限制数组

	const shape = Array.isArray(result.shape) ? result.shape.map(Number) : []; // 形状统一成数字数组
	const values = Array.isArray(result.values) ? result.values.slice(0, maxPreviewValues) : []; // 后端即使未截断也限制展示数量
	const rows = Math.min(shape[0] || 0, maxMatrixSide); // 二维预览限制行数
	const columns = Math.min(shape[1] || 0, maxMatrixSide); // 二维预览限制列数
	const matrix = Array.from({ length: rows }, (_, row) => values.slice(row * (shape[1] || columns), row * (shape[1] || columns) + columns)); // 按原始行宽切出左上角
	return { ...result, shape, values, matrix, dimensions: shape.length, previewTruncated: !!result.truncated || Number(result.totalElements) > values.length }; // 补充组件直接可用的维度信息
};

export { maxPreviewValues, maxMatrixSide, createResultPreview }; // 导出预览规则供组件和测试使用
