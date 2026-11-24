import { describe, expect, it } from "vitest";
import { deriveNodeInputs } from "./nodeInputs.js";

const tensor = (value) => ({ kind: "tensor", values: [value] });

describe("deriveNodeInputs", () => {
	it("沿连线把上游输出映射到目标端口", () => {
		const edges = [{ source: "input", sourceHandle: "out", target: "pool", targetHandle: "x" }];
		const results = { input: { outputs: { out: tensor(1) } } };
		expect(deriveNodeInputs("pool", edges, results)).toEqual({ x: tensor(1) });
	});

	it("支持一个节点的多个输入端口", () => {
		const edges = [
			{ source: "left", sourceHandle: "out", target: "add", targetHandle: "a" },
			{ source: "right", sourceHandle: "value", target: "add", targetHandle: "b" },
		];
		const results = {
			left: { outputs: { out: tensor(2) } },
			right: { outputs: { value: tensor(3) } },
		};
		expect(deriveNodeInputs("add", edges, results)).toEqual({ a: tensor(2), b: tensor(3) });
	});

	it("忽略尚未返回结果的上游节点", () => {
		const edges = [{ source: "pending", sourceHandle: "out", target: "pool", targetHandle: "x" }];
		expect(deriveNodeInputs("pool", edges, {})).toEqual({});
	});

	it("兼容省略端口名的旧蓝图连线", () => {
		const edges = [{ source: "input", target: "output" }];
		const results = { input: { outputs: { out: tensor(4) } } };
		expect(deriveNodeInputs("output", edges, results)).toEqual({ in: tensor(4) });
	});

	it("持续运行时不混合不同轮次的输入和输出", () => {
		const edges = [{ source: "input", sourceHandle: "out", target: "pool", targetHandle: "x" }];
		const results = { input: { _requestId: "new", outputs: { out: tensor(5) } } };
		expect(deriveNodeInputs("pool", edges, results, "old")).toEqual({});
		expect(deriveNodeInputs("pool", edges, results, "new")).toEqual({ x: tensor(5) });
	});
});
