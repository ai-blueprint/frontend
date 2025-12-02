import { getScale } from "./get-scale.js";
/**
 * 获取元素尺寸
 * @param {HTMLElement} element - 目标元素
 * @param {boolean} require_scale - 是否需要考虑缩放比例
 * @returns {object} - 尺寸 {width, height}
 */
export function getElementSize(element, require_scale = false) {
  const { width, height } = element.getBoundingClientRect(); // 获取元素本身的尺寸
  const scale = getScale(element.value); // 获取元素缩放
  // 根据要求返回长宽
  if (require_scale) return { width: width / scale, height: height / scale };
  else return { width, height };
}
