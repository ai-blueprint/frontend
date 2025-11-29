/**
 * 获取元素的缩放比例
 * 优先从元素的style.scale属性获取，其次尝试从transform属性中提取
 * @param {HTMLElement|string} element - DOM元素或元素ID
 * @returns {number} 元素的缩放比例，如果无法获取则返回1
 */
export function getScale(element) {
  try {
    // 如果是字符串，尝试转换为DOM元素
    if (typeof element === 'string') {
      const foundElement = document.getElementById(element);
      if (!foundElement) {
        console.warn(`getScale: 未找到ID为${element}的元素`);
        return 1;
      }
      element = foundElement;
    }
    
    // 验证元素是否为有效的HTMLElement
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('getScale: 无效的元素参数');
      return 1;
    }
    
    // 首先尝试直接从style.scale属性获取
    const scale = element.style.scale;
    if (scale) {
      const scaleValue = parseFloat(scale);
      // 验证是否为有效数字
      if (!isNaN(scaleValue) && scaleValue > 0) {
        return scaleValue;
      }
    }
    
    // 从transform属性中提取scale值
    const transform = element.style.transform;
    if (transform) {
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      // 确保匹配成功且有捕获组
      if (scaleMatch && scaleMatch[1]) {
        const scaleValues = scaleMatch[1].split(",");
        // 确保有值且可以转换为有效数字
        if (scaleValues[0]) {
          const scaleValue = parseFloat(scaleValues[0]);
          if (!isNaN(scaleValue) && scaleValue > 0) {
            return scaleValue;
          }
        }
      }
    }
    
    // 如果无法获取缩放值，返回默认值1
    return 1;
  } catch (error) {
    console.warn(`获取元素缩放比例失败: ${error.message}`);
    return 1;
  }
}
