// 获取对应ID的蓝图节点数据
// 克隆节点数据并修改ID
// 在鼠标位置创建新节点
import { blueprintStore } from "../../stores/blueprintStore.js";
import { mouseStore } from "../../stores/mouseStore.js";
import { createNode } from "../../tools/blueprint/create-node.js";

export function cloneNode(ID) {
  const node = blueprintStore.nodes.find((node) => node.ID === ID);
  const newNode = { ...node, ID: Date.now() };
  createNode(newNode, { x: mouseStore.x, y: mouseStore.y });
}
