/**
 * 计算鼠标相对于指定元素的坐标位置
 * @param {HTMLElement|Object} element - DOM元素或包含value属性的对象（如Vue的ref对象）
 * @param {MouseEvent} e - 鼠标事件对象
 * @param {boolean} require_scale - 是否应用元素的缩放比例
 * @returns {Object} 包含x和y属性的对象，表示鼠标在元素坐标系中的位置
 */
import { getScale } from "./get-scale.js";

export function getMouseRelativeCoordinate(element, e, require_scale = false) {
  try {
    // 处理可能的ref对象（如果有value属性，则使用它）
    if (element && element.value) {
      element = element.value;
    }
    
    // 参数验证
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('getMouseRelativeCoordinate: 无效的元素参数');
      return { x: 0, y: 0 };
    }
    
    if (!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') {
      console.warn('getMouseRelativeCoordinate: 无效的事件对象');
      return { x: 0, y: 0 };
    }
    
    // 获取鼠标在视口中的绝对位置
    const { clientX, clientY } = e;
    
    // 获取元素在视口中的位置
    const { left, top } = element.getBoundingClientRect();
    
    // 计算相对坐标
    let relativeX = clientX - left;
    let relativeY = clientY - top;
    
    // 如果需要应用缩放
    if (require_scale) {
      const scale = getScale(element);
      // 避免除以零的情况
      if (scale > 0) {
        relativeX /= scale;
        relativeY /= scale;
      }
    }
    
    return {
      x: relativeX,
      y: relativeY
    };
  } catch (error) {
    console.warn(`计算鼠标相对坐标时出错: ${error.message}`);
    return { x: 0, y: 0 };
  }
}
