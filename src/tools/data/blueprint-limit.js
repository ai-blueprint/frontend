import { blueprintStore } from "@/stores/blueprintStore";
export function limitBlueprint(childSize, parentSize, transform) {
  const { width: childWidth, height: childHeight } = childSize;
  const { width: parentWidth, height: parentHeight } = parentSize;
  const {
    scale,
    translate: { x, y },
  } = transform;

  // 1. 先锁缩放：最小得“刚好盖满”，最大 3 倍
  const minScale = Math.max(
    parentWidth / childWidth,
    parentHeight / childHeight
  ); // 盖满所需最小倍数
  const newScale = Math.max(minScale, Math.min(3, scale)); //  clamp 一把梭

  // 2. 再锁平移：把子元素“摁”在父容器里，不能拖出黑边
  //    可拖范围：左/上最多露多少（负数），右/下最多露 0
  const maxLeft = Math.min(0, parentWidth - childWidth * newScale); // 负值或 0
  const maxTop = Math.min(0, parentHeight - childHeight * newScale);
  const newTranslateX = Math.max(maxLeft, Math.min(0, x));
  const newTranslateY = Math.max(maxTop, Math.min(0, y));

  blueprintStore.updateTransform(newScale, newTranslateX, newTranslateY);
  return { newScale, newTranslateX, newTranslateY };
}

/* 用法示例
const newT = clampBlueprint(
  {width: 800, height: 600},   // 子原始大小
  {width: 1200, height: 900},  // 父可视大小
  {scale: 0.5, translate: {x: 100, y: -200}} // 想怎么变都行
);
*/
