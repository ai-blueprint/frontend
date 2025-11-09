// 计算蓝图长宽
// 更新蓝图长宽
// 遍历所有节点进行偏移
import { calculateBlueprintSize } from "@/tools/data/calculate-blueprint-size.js";
import { blueprintStore } from "@/stores/blueprintStore.js";
import { limitBlueprint } from "../data/blueprint-limit";
export function changeBlueprintSize() {
  const padding = 1000;
  const { width, height } = calculateBlueprintSize(
    blueprintStore.state.nodes,
    padding
  );

  blueprintStore.updateSize(width, height);
  const parent = document.getElementById("workspace");
  limitBlueprint({ width, height }, parent.getBoundingClientRect(), {
    scale: blueprintStore.state.scale,
    translate: blueprintStore.state.translate,
  });

  let minX = Infinity;
  let minY = Infinity;
  // 计算所有节点的最小X和Y坐标
  if (blueprintStore.state.nodes.length > 0) {
    blueprintStore.state.nodes.forEach((node) => {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
    });

    // 计算偏移量，考虑padding
    const offsetX = Math.max(0, padding / 2 - minX);
    const offsetY = Math.max(0, padding / 2 - minY);

    blueprintStore.state.nodes.forEach((node) => {
      node.position.x += offsetX;
      node.position.y += offsetY;
    });

    // 以定位节点的偏移量为基准，反向偏移蓝图
    const currentTranslate = blueprintStore.state.translate;
    blueprintStore.updateTranslate(
      currentTranslate.x - offsetX,
      currentTranslate.y - offsetY
    );
  }
}
