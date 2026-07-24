import { describe, expect, it } from "vitest"; // 引入Vitest测试能力
import { createBlueprintFile, readBlueprintFile, serializeBlueprint } from "@/utils/blueprintSerialization.js"; // 引入蓝图序列化工具

const blueprint = {
	name: "测试蓝图",
	nodes: [{ id: "n1", type: "baseNode", position: { x: 10, y: 20 }, selected: true, dimensions: { width: 100 }, data: { opcode: "input", label: "输入", ports: { input: {}, output: { out: "" } }, params: {} } }],
	edges: [],
}; // 构建包含VueFlow临时字段的合法蓝图

describe("蓝图序列化", () => {
	it("发送和导出时剥离VueFlow临时字段", () => {
		const result = serializeBlueprint(blueprint); // 清理后端请求数据
		expect(result.nodes[0]).not.toHaveProperty("selected"); // 选择态不进入业务蓝图
		expect(result.nodes[0]).not.toHaveProperty("dimensions"); // 测量尺寸不进入业务蓝图
		expect(result.nodes[0]).toEqual({ id: "n1", type: "baseNode", position: { x: 10, y: 20 }, data: blueprint.nodes[0].data }); // 白名单业务字段完整保留
	});

	it("读取版本1文件并兼容旧版原始蓝图", () => {
		const file = createBlueprintFile(blueprint); // 创建版本化文件
		expect(file.schemaVersion).toBe(1); // 文件明确声明版本
		expect(readBlueprintFile(JSON.stringify(file))).toEqual(serializeBlueprint(blueprint)); // 导入结果通过同一白名单
		expect(readBlueprintFile(JSON.stringify(blueprint))).toEqual(serializeBlueprint(blueprint)); // 历史版本直接导出的蓝图仍可恢复
		expect(() => readBlueprintFile({ schemaVersion: 2, blueprint })).toThrow("仅支持蓝图文件版本1"); // 未知版本不会静默误读
	});

	it("拒绝引用不存在节点的连接线", () => {
		const invalid = structuredClone(blueprint); // 复制蓝图避免污染其他测试
		invalid.edges.push({ id: "e1", source: "n1", sourceHandle: "out", target: "missing", targetHandle: "x" }); // 添加悬空连接
		expect(() => serializeBlueprint(invalid)).toThrow("引用了不存在的节点"); // 非法结构不能写入store或发给后端
	});
});
