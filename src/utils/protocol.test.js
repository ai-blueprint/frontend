import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { createRequest, isEnvelopeCurrent, parseEnvelope } from "@/utils/protocol.js"; // 引入待验证协议工具

describe("WebSocket协议信封", () => {
	it("为每次请求生成唯一ID和固定结构", () => {
		const first = createRequest("runBlueprint", { blueprint: {} }); // 创建第一条请求
		const second = createRequest("runBlueprint", { blueprint: {} }); // 创建第二条请求
		expect(first).toMatchObject({ type: "runBlueprint", data: { blueprint: {} } }); // 固定字段符合后端契约
		expect(first.id).not.toBe(second.id); // 并发请求不会共享ID
	});

	it("解析响应时完整保留ID和结构化错误", () => {
		const error = { code: "NODE_FAILED", phase: "execute", nodeId: "n1", opcode: "relu", message: "失败", details: {} }; // 构建协议错误
		const result = parseEnvelope(JSON.stringify({ type: "nodeError", id: "run-1", error })); // 从网络文本解析
		expect(result).toEqual({ type: "nodeError", id: "run-1", data: undefined, error }); // 错误不能被降级成字符串或丢失
	});

	it("仅允许当前请求ID修改状态", () => {
		expect(isEnvelopeCurrent("new-run", { id: "new-run" })).toBe(true); // 当前响应可以写入
		expect(isEnvelopeCurrent("new-run", { id: "old-run" })).toBe(false); // 旧运行响应被拒绝
		expect(isEnvelopeCurrent("new-run", { type: "registryUpdated" })).toBe(false); // 广播不冒充请求响应
	});
});
