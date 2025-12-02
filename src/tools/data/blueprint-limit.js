import { blueprintStore } from "@/stores/blueprint";
/**
 * 限制蓝图在父容器内的显示范围
 * @param {object} childSize - 子元素尺寸 {width, height}
 * @param {object} parentSize - 父元素尺寸 {width, height}
 * @param {object} transform - 当前变换参数 {scale, translate: {x, y}}
 * @returns {object} - 新的变换参数 {newScale, newTranslateX, newTranslateY}
 */
export function limitBlueprint(childSize, parentSize, transform) {
  const { width: childWidth, height: childHeight } = childSize;
  const { width: parentWidth, height: parentHeight } = parentSize;
  let {
    scale,
    translate: { x, y },
  } = transform;

  // 限制缩放
  const minScale = Math.max(
    parentWidth / childWidth,
    parentHeight / childHeight
  ); // 求最小缩放
  // 设置最大缩放
  const maxScale = 1.5;
  const newScale = Math.max(minScale, Math.min(maxScale, scale));

  // 限制平移
  const pivotPoint = {x: parentSize.width/2, y: parentSize.height/2}
  if (scale !== newScale && scale > 0) {
    const ratio = newScale / scale;
    const deltaX = x - pivotPoint.x;  // 当前点到缩放中心的距离
    const deltaY = y - pivotPoint.y;
    x = pivotPoint.x + deltaX * ratio; // 按新比例重新定位
    y = pivotPoint.y + deltaY * ratio;
  }
  // 可拖范围：左/上最多露多少（负数），右/下最多露 0
  const maxLeft = Math.min(0, parentWidth - childWidth * newScale); // 负值或 0
  const maxTop = Math.min(0, parentHeight - childHeight * newScale);
  const newTranslateX = Math.max(maxLeft, Math.min(0, x));
  const newTranslateY = Math.max(maxTop, Math.min(0, y));

  blueprintStore.updateTransform(newScale, newTranslateX, newTranslateY);
  return { newScale, newTranslateX, newTranslateY };
}
