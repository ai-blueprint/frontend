import {blueprintStore} from "@/stores/blueprintStore.js";
export function moveNode(id, position) {
  blueprintStore.updateNodePosition(id, position);
}