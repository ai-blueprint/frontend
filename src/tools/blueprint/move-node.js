import {blueprintStore} from "@/stores/blueprint.js";
export function moveNode(id, position) {
  blueprintStore.updateNodePosition(id, position);
}