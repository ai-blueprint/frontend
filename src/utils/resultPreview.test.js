import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { createResultPreview, maxPreviewValues } from "@/utils/resultPreview.js"; // 引入结果预览工具

describe("序列化结果预览", () => {
	it("将二维张量转换成有边界的热力表", () => {
		const result = createResultPreview({ kind: "tensor", shape: [2, 3], dtype: "float32", device: "cpu", values: [1, 2, 3, 4, 5, 6], truncated: false, totalElements: 6 }); // 创建二维张量预览
		expect(result.dimensions).toBe(2); // 组件选择二维展示
		expect(result.matrix).toEqual([[1, 2, 3], [4, 5, 6]]); // 数值按原始行宽排列
	});

	it("限制高维张量展示值数量", () => {
		const values = Array.from({ length: 200 }, (_, index) => index); // 模拟后端未截断的大结果
		const result = createResultPreview({ kind: "tensor", shape: [2, 10, 10], values, totalElements: 200 }); // 创建高维预览
		expect(result.values).toHaveLength(maxPreviewValues); // 页面不会渲染无限数组
		expect(result.previewTruncated).toBe(true); // 用户能看到预览已截断
	});
});
