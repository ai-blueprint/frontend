import {blueprintStore} from "@/stores/blueprintStore.js";
export function moveNode(id, position) {
  blueprintStore.moveNode(id, position);
  console.log(`移动节点 ${id} 到 ${position.x}, ${position.y}`);
}