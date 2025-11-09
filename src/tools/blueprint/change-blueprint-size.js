// 计算蓝图长宽
// 更新蓝图长宽
// 遍历所有节点进行偏移
import { calculateBlueprintSize } from "@/tools/data/calculate-blueprint-size.js";
import { blueprintStore } from "@/stores/blueprintStore.js";
export function changeBlueprintSize() {
  // const scale = blueprintStore.state.scale;
  const padding = 1000;
  const { width, height } = calculateBlueprintSize(
    blueprintStore.state.nodes,
    padding
  );

  blueprintStore.updateSize(width, height);

  // 清空console.log
  // console.clear();
  // console.log("scale:", scale);
  // console.log("padding:", padding);
  // 遍历所有节点进行偏移

  let minX = Infinity;
  let minY = Infinity;

  // 计算所有节点的最小X和Y坐标
  if (
    Array.isArray(blueprintStore.state.nodes) &&
    blueprintStore.state.nodes.length > 0
  ) {
    blueprintStore.state.nodes.forEach((node) => {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
    });

    // 计算偏移量，考虑padding
    const offsetX = Math.max(0, padding / 2 - minX);
    const offsetY = Math.max(0, padding / 2 - minY);

    // 先随便找一个定位节点，记录下来，到时候以这个节点为参考点
    const referenceNode = blueprintStore.state.nodes[0];
    const referenceX = referenceNode.position.x;
    const referenceY = referenceNode.position.y;
    // 应用偏移到所有节点
    blueprintStore.state.nodes.forEach((node) => {
      node.position.x += offsetX;
      node.position.y += offsetY;
    });
    // 获取刚刚定位节点的偏移量
    const referenceOffsetX = referenceNode.position.x - referenceX;
    const referenceOffsetY = referenceNode.position.y - referenceY;
    // 以定位节点的偏移量为基准，反向偏移蓝图
    const currentTranslate = blueprintStore.state.translate;
    blueprintStore.updateTranslate(
      currentTranslate.x - referenceOffsetX,
      currentTranslate.y - referenceOffsetY
    );
  }
}
