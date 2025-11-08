// 计算蓝图长宽
// 更新蓝图长宽
// 遍历所有节点进行偏移
import { calculateBlueprintSize } from "@/tools/data/calculate-blueprint-size.js";
import { blueprintStore } from "@/stores/blueprintStore.js";
export function changeBlueprintSize() {
  const { width, height } = calculateBlueprintSize(blueprintStore.state.nodes);
  blueprintStore.updateSize(width, height);
  
  // 遍历所有节点进行偏移
  const padding = 500;
  let minX = Infinity;
  let minY = Infinity;
  
  // 计算所有节点的最小X和Y坐标
  if (Array.isArray(blueprintStore.state.nodes) && blueprintStore.state.nodes.length > 0) {
    blueprintStore.state.nodes.forEach(node => {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
    });
    
    // 计算偏移量，考虑padding
    const offsetX = Math.max(0, -minX + padding / 2);
    const offsetY = Math.max(0, -minY + padding / 2);
    
    // 应用偏移到所有节点
    blueprintStore.state.nodes.forEach(node => {
      node.position.x += offsetX;
      node.position.y += offsetY;
    });
    
    // 蓝图反向偏移，保持节点相对于视图位置不变
    const currentTranslate = blueprintStore.state.translate;
    blueprintStore.updateTranslate(currentTranslate.x - offsetX, currentTranslate.y - offsetY);
  }
}