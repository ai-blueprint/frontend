// 蓝图限制相关的工具函数
import { blueprintStore } from "@/stores/blueprintStore";

export function getContainerSize(blueprintElement) {
  if (!blueprintElement || !blueprintElement.parentElement) {
    console.warn("蓝图元素或其父元素不存在");
    return { width: 1000, height: 1000 }; // 默认值
  }
  const parent = blueprintElement.parentElement;
  return {
    width: parent.clientWidth,
    height: parent.clientHeight,
  };
}

/**
 * 限制偏移量，确保蓝图完全覆盖父容器
 * @param {number} x - 原始X偏移量
 * @param {number} y - 原始Y偏移量
 * @param {number} scale - 当前缩放比例
 * @param {HTMLElement} blueprintElement - 蓝图DOM元素
 * @returns {Object} 限制后的偏移量 {x, y}
 */
import {getElementSize} from "@/tools/data/get-element-size";
export function constrainTranslate(x, y, blueprintElement) {
  const containerSize = getContainerSize(blueprintElement);
  const blueprintSize = getElementSize(blueprintElement,true);

  // 计算限制范围
  const minX = Math.min(0, containerSize.width - blueprintSize.width);
  const maxX = 0;
  const minY = Math.min(0, containerSize.height - blueprintSize.height);
  const maxY = 0;

  // 应用限制
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/**
 * 限制缩放范围，确保蓝图完全覆盖容器
 * @param {number} scale - 原始缩放比例
 * @param {HTMLElement} blueprintElement - 蓝图DOM元素
 * @returns {number} 限制后的缩放比例
 */
export function constrainScale(scale, blueprintElement) {
  const containerSize = getContainerSize(blueprintElement);
  const blueprintSize = blueprintStore.state.size;

  // 计算最小缩放值，确保蓝图完全覆盖容器
  const minScaleX = containerSize.width / blueprintSize.width;
  const minScaleY = containerSize.height / blueprintSize.height;
  const minScale = Math.max(minScaleX, minScaleY);

  // 设置最大缩放限制
  const maxScale = 3; // 根据需要调整最大缩放倍数

  return Math.max(minScale, Math.min(maxScale, scale));
}

/**
 * 应用拖拽限制的辅助函数
 * @param {Object} currentTranslate - 当前偏移量 {x, y}
 * @param {Object} offset - 鼠标偏移量 {x, y}
 * @param {number} currentScale - 当前缩放比例
 * @param {HTMLElement} blueprintElement - 蓝图DOM元素
 * @returns {Object} 限制后的偏移量 {x, y}
 */
export function applyDragConstraints(
  currentTranslate,
  offset,
  currentScale,
  blueprintElement
) {
  // 计算新的偏移量
  const newX = currentTranslate.x + offset.x;
  const newY = currentTranslate.y + offset.y;

  // 应用限制
  return constrainTranslate(newX, newY, blueprintElement);
}

/**
 * 应用缩放限制的辅助函数
 * @param {number} currentScale - 当前缩放比例
 * @param {number} delta - 缩放增量（正值放大，负值缩小）
 * @param {Object} mouse - 鼠标位置 {x, y}
 * @param {Object} currentTranslate - 当前偏移量 {x, y}
 * @param {HTMLElement} blueprintElement - 蓝图DOM元素
 * @returns {Object} 限制后的变换参数 {scale, translateX, translateY}
 */
export function applyScaleConstraints(
  currentScale,
  delta,
  mouse,
  currentTranslate,
  blueprintElement
) {
  // 计算新的缩放比例
  let newScale = currentScale * (delta > 0 ? 1.1 : 0.9);

  // 应用缩放限制
  newScale = constrainScale(newScale, blueprintElement);

  // 计算新的偏移量，保持鼠标位置相对不变
  const newTranslateX =
    currentTranslate.x + mouse.x * (currentScale - newScale);
  const newTranslateY =
    currentTranslate.y + mouse.y * (currentScale - newScale);

  // 应用偏移限制
  const constrainedTranslate = constrainTranslate(
    newTranslateX,
    newTranslateY,
    blueprintElement
  );

  return {
    scale: newScale,
    translateX: constrainedTranslate.x,
    translateY: constrainedTranslate.y,
  };
}
