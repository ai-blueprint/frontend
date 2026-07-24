/* 张量颜色表达数值方向和强度：负值端为蓝色，正值端为黄色，零为白色，异常值为红色。 */

// --- 在线性RGB空间中混合两种颜色 ---
const mixColor = (start, end, ratio) => start.map((channel, index) => Math.round(channel + (end[index] - channel) * ratio)); // 按比例逐通道插值


// --- 把张量数值映射为节点下方方块颜色 ---
export const getTensorColorStyle = (value) => {
	if (value === null) return { backgroundColor: "#e44d60" }; // 后端用null表示NaN和无穷值，统一使用红色异常色
	const number = Number(value); // 序列化数值统一转成JavaScript Number
	if (!Number.isFinite(number)) return { backgroundColor: "#e44d60" }; // 非有限值保持明显异常色
	const magnitude = Math.min(1, Math.abs(number)); // 绝对值1达到满色，超出范围保持饱和
	const white = [255, 255, 255]; // 零值颜色
	const target = number < 0 ? [130, 203, 250] : [253, 171, 61]; // 负值端为#82cbfa蓝色，正值端为#fdab3d黄色
	const color = mixColor(white, target, magnitude); // 数值越接近正负1，颜色越饱和
	return { backgroundColor: `rgb(${color.join(" ")})` }; // 方块不显示文本，只返回背景色
};
