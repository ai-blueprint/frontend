// 获取鼠标在窗口的绝对位置
// 获取元素的绝对位置
// 计算鼠标相对元素的位置
import { getScale } from "./get-scale.js";
export function getMouseRelativeCoordinate(element, e, require_scale = false) {
  const { clientX, clientY } = e;
  const { left, top } = element.value.getBoundingClientRect();
  
  if (require_scale) {
    const scale = getScale(element.value);
    return {
      x: (clientX - left) / scale,
      y: (clientY - top) / scale,
    };
  }
  return {
    x: clientX - left,
    y: clientY - top,
  };
}
