import { getScale } from "@/tools/data/get-scale";
/**
 * 获取元素中心位置
 * @param {string} id - 元素id
 * @param {string} relativeId - 相对元素id，默认蓝图容器
 * @returns {object} - 中心位置 {x, y}
 */
export function getElementCenter(id, relativeId = "blueprint") {
  // 这里采用获取相对位置，相对于relativeId元素的位置
  const element = document.getElementById(id);
  if (!element) return null;

  const elementRect = element.getBoundingClientRect();
  // 获取相对于relativeId元素的位置
  const relativeElement = document.getElementById(relativeId);
  if (!relativeElement) return null;
  const relativeRect = relativeElement.getBoundingClientRect();

  // 获取元素缩放比例
  const scale = getScale(relativeElement);

  return {
    x: (elementRect.left + elementRect.width / 2 - relativeRect.left) / scale,
    y: (elementRect.top + elementRect.height / 2 - relativeRect.top) / scale,
  };
}
