// --- 将单个ID、数组、对象统一转成ID数组 ---
const normalizeIds = (input) => {
	if (input == null) return []; // 空值返回空数组
	if (Array.isArray(input)) return input; // 已经是数组直接返回
	if (typeof input === "object" && input.id) return [input.id]; // 对象取id字段
	return [input]; // 单个ID包装成数组
};

export { normalizeIds }; // 导出ID归一化工具
