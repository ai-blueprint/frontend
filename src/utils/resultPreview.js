/*
 * 这个文件把序列化张量拆成保持真实末两维形状的切片。
 * 一维张量保持一行，高维张量按前置维度拆片，不再为了紧凑而改变张量形状。
 */

const maxObjectPreviewValues = 64; // 非张量对象保留有界文本预览


// --- 读取张量真实切片形状 ---
const getTensorShape = (shape, valueCount) => {
	if (!shape.length) return { rows: 1, columns: 1, sliceCount: 1 }; // 标量张量显示为一个方块
	if (shape.length === 1) return { rows: 1, columns: Math.max(1, shape[0]), sliceCount: 1 }; // 一维张量严格保持一行
	const rows = Math.max(1, shape.at(-2)); // 每个切片行数来自倒数第二维
	const columns = Math.max(1, shape.at(-1)); // 每个切片列数来自最后一维
	const sliceSize = rows * columns; // 单个二维切片元素数量
	const declaredSlices = shape.slice(0, -2).reduce((total, size) => total * Math.max(1, size), 1); // 前置维度决定切片数量
	const availableSlices = Math.max(1, Math.ceil(valueCount / sliceSize)); // 截断结果只渲染已经返回的切片
	return { rows, columns, sliceCount: Math.min(declaredSlices, availableSlices) }; // 保留真实末两维形状
};


// --- 选择高维切片的排列列数 ---
const getSliceColumns = (sliceCount, rows, columns, targetAspect = 1) => {
	let bestColumns = 1; // 单切片默认一列
	let bestDifference = Infinity; // 保存与目标显示比例的最小差值
	for (let candidate = 1; candidate <= sliceCount; candidate += 1) {
		const sliceRows = Math.ceil(sliceCount / candidate); // 当前候选需要的切片行数
		const aspect = candidate * columns / (sliceRows * rows); // 计算所有切片组成后的整体比例
		const difference = Math.abs(Math.log(Math.max(aspect, 0.0001) / targetAspect)); // 对数距离公平比较宽和高
		if (difference >= bestDifference) continue; // 更差候选无需替换
		bestColumns = candidate; // 记录更接近显示区域的排列
		bestDifference = difference; // 更新最优差值
	}
	return bestColumns; // 返回不改变切片内部形状的外层排布
};


// --- 将任意结果转换为显示数据 ---
const createResultPreview = (result) => {
	if (!result || typeof result !== "object") return { kind: "scalar", value: result }; // 基础值按标量处理
	if (result.kind !== "tensor") return { ...result, values: Array.isArray(result.values) ? result.values.slice(0, maxObjectPreviewValues) : result.values }; // 普通对象保留有界文本

	const shape = Array.isArray(result.shape) ? result.shape.map((size) => Math.max(0, Number(size) || 0)) : []; // 形状统一成非负数字数组
	const values = Array.isArray(result.values) ? result.values : []; // 使用后端返回的完整张量值
	const tensorShape = getTensorShape(shape, values.length); // 读取真实二维切片结构
	const sliceSize = tensorShape.rows * tensorShape.columns; // 每个切片固定元素数量
	const slices = Array.from({ length: tensorShape.sliceCount }, (_, index) => values.slice(index * sliceSize, (index + 1) * sliceSize)); // 按连续内存顺序拆分高维切片
	return { ...result, shape, values, dimensions: shape.length, ...tensorShape, slices }; // 返回组件可直接渲染的真实形状数据
};

export { maxObjectPreviewValues, getTensorShape, getSliceColumns, createResultPreview }; // 导出形状规则供组件和测试验证
