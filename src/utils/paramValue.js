/*
 * 这个文件负责节点参数输入框的文本与参数值互转。
 * 参数值有两种形态：普通数字/数组，或表达式对象{expr: "D*4"}；表达式在运行前由变量表展开。
 */
import { resolveText } from "@/utils/expression.js"; // 引入与后端一致的表达式解析器

const plainNumberPattern = /^-?\d+(\.\d+)?$/; // 纯数字文本直接按数字保存，不产生表达式对象


// --- 判断参数值是否为表达式对象 ---
const isExpressionValue = (value) => !!value && typeof value === "object" && !Array.isArray(value) && typeof value.expr === "string"; // 只认{expr}结构


// --- 把参数值转换为输入框显示文本 ---
const formatParamValue = (value) => {
	if (isExpressionValue(value)) return value.expr; // 表达式显示原始文本
	if (Array.isArray(value)) return value.join(", "); // 数组按逗号拼接
	return String(value ?? ""); // 数字和空值直接转字符串
};


// --- 把输入文本解析为参数值 ---
const parseParamText = (text, kind) => {
	const trimmed = String(text ?? "").trim(); // 前后空白不参与判断
	if (!trimmed) {
		return kind === "list" ? { value: [] } : { value: 0 }; // 空输入沿用原控件的默认值行为
	}

	if (kind !== "list" && plainNumberPattern.test(trimmed)) {
		const parsed = kind === "int" ? parseInt(trimmed, 10) : parseFloat(trimmed); // 纯数字按原类型解析
		return { value: parsed }; // 数字路径与历史行为完全一致
	}
	if (kind === "list" && trimmed.split(",").every((item) => plainNumberPattern.test(item.trim()))) {
		return { value: trimmed.split(",").map((item) => Number(item.trim())) }; // 纯数字列表沿用原数组格式
	}

	return { value: { expr: trimmed } }; // 含变量或运算的文本保存为表达式对象，展开推迟到运行前
};


// --- 求出参数值在当前变量表下的展开结果 ---
const getResolvedPreview = (value, variables) => {
	if (!isExpressionValue(value)) return { text: "", error: null }; // 普通值不需要预览
	try {
		const resolved = resolveText(value.expr, variables); // 用当前变量表尝试展开
		return { text: `= ${Array.isArray(resolved) ? `[${resolved.join(", ")}]` : resolved}`, error: null }; // 显示展开后的具体数值
	} catch (error) {
		return { text: "", error: error.message }; // 展开失败时反馈明确原因
	}
};

export { isExpressionValue, formatParamValue, parseParamText, getResolvedPreview }; // 导出参数值工具供输入控件和测试使用
