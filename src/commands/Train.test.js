import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class TestSocket {
	static OPEN = 1;
	static instances = [];
	readyState = 0;
	sent = [];

	constructor() {
		TestSocket.instances.push(this);
	}

	open() {
		this.readyState = TestSocket.OPEN;
		this.onopen();
	}

	send(text) {
		this.sent.push(JSON.parse(text));
	}

	close() {
		this.readyState = 2;
	}

	finishClose() {
		this.readyState = 3;
		this.onclose();
	}

	respond(id, data) {
		this.onmessage({ data: JSON.stringify({ type: "trainStep", id, data }) });
	}
}

describe("训练与后端模型的生命周期", () => {
	let train, store, first, ws;

	beforeEach(async () => {
		vi.resetModules();
		vi.useFakeTimers();
		TestSocket.instances = [];
		vi.stubGlobal("WebSocket", TestSocket);
		({ default: train } = await import("@/commands/Train.js"));
		({ default: store } = await import("@/store.js"));
		({ default: ws } = await import("@/ws.js"));
		first = TestSocket.instances[0];
		first.open();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("新模型从第一步开始记录，同一模型继续累计", () => {
		first.respond(train.step(), { trainingModelId: "old", loss: 3 });
		first.respond(train.step(), { trainingModelId: "old", loss: 2 });
		expect(store.runtime.training).toMatchObject({ step: 2, curve: [3, 2] });

		first.respond(train.step(), { trainingModelId: "new", loss: 3 });
		expect(store.runtime.training).toMatchObject({ step: 1, curve: [3] });
	});

	it("断线作废在途训练，新后端重连后从第一步开始", async () => {
		first.respond(train.step(), { trainingModelId: "old", loss: 3 });
		const pending = train.step();
		first.finishClose();
		first.respond(pending, { trainingModelId: "old", loss: 2 });
		expect(store.runtime.training).toMatchObject({ status: "idle", step: 0, curve: [] });

		const nextId = train.step();
		const second = TestSocket.instances[1];
		second.open();
		await ws.connect();
		expect(second.sent).toContainEqual(expect.objectContaining({ id: nextId, type: "trainStep" }));
		second.respond(nextId, { trainingModelId: "new", loss: 3 });
		expect(store.runtime.training).toMatchObject({ step: 1, curve: [3] });
	});

	it("旧后端重连后保留曲线，不发送重置指令", async () => {
		first.respond(train.step(), { loss: 3 });
		first.finishClose();
		expect(store.runtime.training).toMatchObject({ status: "idle", step: 1, curve: [3] });

		const nextId = train.step();
		const second = TestSocket.instances[1];
		second.open();
		await ws.connect();
		expect(second.sent.map(({ type }) => type)).toEqual(["getRegistry", "trainStep"]);
		second.respond(nextId, { loss: 2 });
		expect(store.runtime.training).toMatchObject({ step: 2, curve: [3, 2] });
	});

	it("关闭中的连接不触发自动重连，迟到事件不影响替代连接", async () => {
		train.setContinuous(true);
		first.respond(first.sent.at(-1).id, { trainingModelId: "old", loss: 3 });
		first.close();
		await vi.advanceTimersByTimeAsync(80);
		expect(TestSocket.instances).toHaveLength(1);

		const nextId = train.step();
		const second = TestSocket.instances[1];
		first.finishClose(); // 新连接还在等待握手，不能被旧连接收口
		second.open();
		await ws.connect();
		expect(second.sent).toContainEqual(expect.objectContaining({ id: nextId, type: "trainStep" }));
		second.respond(nextId, { trainingModelId: "new", loss: 3 });
		first.onerror();
		expect(store.transport.status).toBe("connected");
		expect(store.runtime.training).toMatchObject({ continuous: false, step: 1 });
		await vi.advanceTimersByTimeAsync(80);
		expect(second.sent.filter(({ type }) => type === "trainStep")).toHaveLength(1);
	});

	it("手动重置仍通知后端并保留训练设置", () => {
		store.runtime.training.learningRate = 0.05;
		first.respond(train.step(), { trainingModelId: "old", loss: 3 });
		train.reset();
		expect(store.runtime.training).toMatchObject({ step: 0, curve: [], learningRate: 0.05 });
		expect(first.sent.at(-1)).toMatchObject({ type: "resetTraining", data: {} });
	});
});
