import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { isCurrentRequest, validateArtifactName } from "@/commands/Runtime.js"; // 引入产物名称和运行态ID校验

describe("产物名称", () => {
	it("允许普通名称并拒绝任意路径", () => {
		expect(validateArtifactName("model-v1.onnx")).toBe("model-v1.onnx"); // 常见产物名称可用
		expect(() => validateArtifactName("../private/model")).toThrow("产物名称仅支持"); // 目录穿越和路径分隔符被拒绝
		expect(() => validateArtifactName("C:\\model")).toThrow("产物名称仅支持"); // Windows路径同样被拒绝
	});

	it("拒绝旧请求修改当前运行态", () => {
		const state = { requestId: "new-request" }; // 模拟当前运行状态
		expect(isCurrentRequest(state, { id: "new-request" })).toBe(true); // 当前响应可以修改状态
		expect(isCurrentRequest(state, { id: "old-request" })).toBe(false); // 旧响应必须被忽略
	});
});
