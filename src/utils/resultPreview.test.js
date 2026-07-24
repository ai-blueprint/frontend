import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { createResultPreview, getSliceColumns, getTensorShape } from "@/utils/resultPreview.js"; // 引入结果预览和真实形状工具

describe("序列化结果预览", () => {
	it("二维张量保持原始行列形状", () => {
		const result = createResultPreview({ kind: "tensor", shape: [2, 3], dtype: "float32", device: "cpu", values: [1, 2, 3, 4, 5, 6], truncated: false, totalElements: 6 }); // 创建二维张量预览
		expect(result.dimensions).toBe(2); // 组件选择二维展示
		expect(result.columns).toBe(3); // 最后一维保持三列
		expect(result.rows).toBe(2); // 倒数第二维保持两行
		expect(result.slices).toEqual([[1, 2, 3, 4, 5, 6]]); // 二维张量只有一个完整切片
	});

	it("高维张量按前置维度拆分切片", () => {
		const values = Array.from({ length: 200 }, (_, index) => index); // 模拟后端未截断的大结果
		const result = createResultPreview({ kind: "tensor", shape: [2, 10, 10], values, totalElements: 200 }); // 创建高维预览
		expect(result.values).toHaveLength(200); // 前端不再自行截断张量
		expect(result.rows).toBe(10); // 每个切片保持十行
		expect(result.columns).toBe(10); // 每个切片保持十列
		expect(result.slices).toHaveLength(2); // 第一维拆成两个独立切片
		expect(result.slices[0]).toHaveLength(100); // 每个切片包含真实二维元素数量
	});

	it("一维和狭长二维张量不改变形状", () => {
		expect(getTensorShape([10000], 10000)).toEqual({ rows: 1, columns: 10000, sliceCount: 1 }); // 一维张量保持一行
		expect(getTensorShape([10000, 1], 10000)).toEqual({ rows: 10000, columns: 1, sliceCount: 1 }); // 狭长二维张量保持真实形状
	});

	it("高维切片只调整切片之间的排列", () => {
		expect(getSliceColumns(4, 8, 8, 1)).toBe(2); // 四个方形切片排列为二乘二
	});
});
