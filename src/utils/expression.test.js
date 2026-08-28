import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { resolveText, getVariablesMap, isValidVariableName } from "@/utils/expression.js"; // 引入前端表达式解析器
import { isExpressionValue, formatParamValue, parseParamText, getResolvedPreview } from "@/utils/paramValue.js"; // 引入参数值互转工具

describe("表达式解析", () => {
	const variables = { B: 2, S: 4, D: 8, HEADS: 2 }; // 模拟蓝图变量表

	it("求值数字、变量和四则运算", () => {
		expect(resolveText("16", variables)).toBe(16); // 纯数字
		expect(resolveText("D", variables)).toBe(8); // 变量引用
		expect(resolveText("D*4", variables)).toBe(32); // 乘法
		expect(resolveText("D//HEADS", variables)).toBe(4); // 整除
		expect(resolveText("(D+8)*2", variables)).toBe(32); // 括号优先级
		expect(resolveText("-D+10", variables)).toBe(2); // 一元负号
		expect(resolveText("D/2", variables)).toBe(4); // 整值除法收敛为整数
	});

	it("求值形状序列和列表变量", () => {
		expect(resolveText("B, S, D", variables)).toEqual([2, 4, 8]); // 逗号序列
		expect(resolveText("[B, S, D*2]", variables)).toEqual([2, 4, 16]); // 方括号写法
		expect(resolveText("SHAPE, D", { SHAPE: [2, 4], D: 8 })).toEqual([2, 4, 8]); // 列表变量展开
	});

	it("拒绝非法表达式", () => {
		expect(() => resolveText("MISSING", variables)).toThrow("未定义的变量"); // 未定义引用
		expect(() => resolveText("D@2", variables)).toThrow("无法识别的字符"); // 非法字符
		expect(() => resolveText("D/0", variables)).toThrow("除以零"); // 除零
		expect(() => resolveText("(D+1", variables)).toThrow("缺少右括号"); // 括号不闭合
		expect(() => resolveText("  ", variables)).toThrow("不能为空"); // 空内容
		expect(() => resolveText("SHAPE*2", { SHAPE: [2, 4] })).toThrow("列表变量不能参与"); // 列表参与运算
		expect(() => resolveText("D.shape", variables)).toThrow("无法识别的字符"); // 属性访问被词法层拒绝
	});

	it("构建变量表并校验名称", () => {
		expect(getVariablesMap([{ id: "v1", name: "D", value: 8 }])).toEqual({ D: 8 }); // 合法列表
		expect(() => getVariablesMap([{ id: "v1", name: "1D", value: 8 }])).toThrow("变量名无效"); // 数字开头
		expect(() => getVariablesMap([{ id: "v1", name: "D", value: 8 }, { id: "v2", name: "D", value: 4 }])).toThrow("变量名重复"); // 重名
		expect(isValidVariableName("hidden_dim")).toBe(true); // 下划线合法
		expect(isValidVariableName("2x")).toBe(false); // 数字开头非法
	});
});

describe("参数值互转", () => {
	it("识别和显示表达式对象", () => {
		expect(isExpressionValue({ expr: "D*4" })).toBe(true); // 表达式对象
		expect(isExpressionValue([2, 4, 8])).toBe(false); // 普通数组
		expect(formatParamValue({ expr: "B, S, D" })).toBe("B, S, D"); // 表达式显示原文
		expect(formatParamValue([2, 4, 8])).toBe("2, 4, 8"); // 数组按逗号拼接
		expect(formatParamValue(8)).toBe("8"); // 数字转字符串
	});

	it("纯数字文本保持原有数值格式", () => {
		expect(parseParamText("16", "int")).toEqual({ value: 16 }); // 整数路径
		expect(parseParamText("0.5", "float")).toEqual({ value: 0.5 }); // 浮点路径
		expect(parseParamText("2, 4, 8", "list")).toEqual({ value: [2, 4, 8] }); // 数字列表路径
		expect(parseParamText("", "list")).toEqual({ value: [] }); // 空列表沿用默认行为
		expect(parseParamText("", "int")).toEqual({ value: 0 }); // 空数字沿用默认行为
	});

	it("含变量文本保存为表达式对象", () => {
		expect(parseParamText("D", "int")).toEqual({ value: { expr: "D" } }); // 单变量
		expect(parseParamText("D*4", "int")).toEqual({ value: { expr: "D*4" } }); // 运算表达式
		expect(parseParamText("B, S, D", "list")).toEqual({ value: { expr: "B, S, D" } }); // 变量形状
	});

	it("预览展开结果和错误", () => {
		expect(getResolvedPreview({ expr: "D*4" }, { D: 8 })).toEqual({ text: "= 32", error: null }); // 标量预览
		expect(getResolvedPreview({ expr: "B, S, D" }, { B: 2, S: 4, D: 8 })).toEqual({ text: "= [2, 4, 8]", error: null }); // 列表预览
		expect(getResolvedPreview({ expr: "MISSING" }, {}).error).toContain("未定义的变量"); // 错误反馈
		expect(getResolvedPreview([2, 4], {})).toEqual({ text: "", error: null }); // 普通值无预览
	});
});
