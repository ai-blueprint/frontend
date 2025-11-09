import { blueprintStore } from "@/stores/blueprintStore";
export function limitBlueprint(childSize, parentSize, transform) {
  const { width: childWidth, height: childHeight } = childSize;
  const { width: parentWidth, height: parentHeight } = parentSize;
  const {
    scale,
    translate: { x, y },
  } = transform;

  // 限制缩放
  const minScale = Math.max(
    parentWidth / childWidth,
    parentHeight / childHeight
  ); // 求最小缩放
  const newScale = Math.max(minScale, Math.min(3, scale));

  // 限制平移
  // 可拖范围：左/上最多露多少（负数），右/下最多露 0
  const maxLeft = Math.min(0, parentWidth - childWidth * newScale); // 负值或 0
  const maxTop = Math.min(0, parentHeight - childHeight * newScale);
  const newTranslateX = Math.max(maxLeft, Math.min(0, x));
  const newTranslateY = Math.max(maxTop, Math.min(0, y));

  blueprintStore.updateTransform(newScale, newTranslateX, newTranslateY);
  return { newScale, newTranslateX, newTranslateY };
}
