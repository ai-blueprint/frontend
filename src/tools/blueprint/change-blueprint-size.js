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

    // 计算偏移量，确保节点始终在蓝图可见范围内
    // 不仅处理左侧和顶部边缘，还确保节点在删除后保持合理布局
    const offsetX = padding / 2 - minX;
    const offsetY = padding / 2 - minY;
    
    // 无论偏移量正负，都应用它，确保节点始终与蓝图边缘保持适当间距
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
