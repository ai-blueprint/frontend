// 获取元素本身的尺寸
// 获取元素缩放
// 根据要求返回长宽
import { getScale } from "./get-scale.js";
export function getElementSize(element, require_scale = false) {
    const { width, height } = element.getBoundingClientRect();
    const scale = getScale(element.value);
    if (require_scale) {
      return { width: width / scale, height: height / scale };
    } else {
      return { width, height };
    }
}
