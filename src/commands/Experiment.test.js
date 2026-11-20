import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let activeSocket;

class TestSocket {
	static OPEN = 1;
	readyState = 0;
	sent = [];

	constructor() {
		activeSocket = this;
	}

	open() {
		this.readyState = TestSocket.OPEN;
		this.onopen();
	}

	send(text) {
		this.sent.push(JSON.parse(text));
	}

	finishClose() {
		this.readyState = 3;
		this.onclose();
	}

	respond(id) {
		this.onmessage({ data: JSON.stringify({ type: "blueprintComplete", id, data: { status: "succeeded" } }) });
	}
}

describe("运行请求与连接生命周期", () => {
	let experiment, store;

	beforeEach(async () => {
		vi.resetModules();
		vi.useFakeTimers();
		vi.stubGlobal("WebSocket", TestSocket);
		({ default: experiment } = await import("@/commands/Experiment.js"));
		({ default: store } = await import("@/store.js"));
		activeSocket.open();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("单次运行断线后解除运行中状态并忽略迟到结果", () => {
		const requestId = experiment.runOnce();
		expect(store.runtime.execution.status).toBe("running");

		activeSocket.finishClose();
		expect(store.runtime.execution).toMatchObject({ status: "idle", requestId: null, nodeResults: {} });
		activeSocket.respond(requestId);
		expect(store.runtime.execution.status).toBe("idle");
	});
});
