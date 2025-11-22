// 获取元素缩放
export function getScale(element) {
  try {
    // 如果是字符串，先转换为DOM元素
    if (typeof element === 'string') element = document.getElementById(element);
    const scale = element.style.scale;
    if (scale) return parseFloat(scale);
    // 从transform属性中提取scale值
    const transform = element.style.transform;
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    const scaleValue = scaleMatch[1].split(",")[0];
    return parseFloat(scaleValue);
  } catch (error) {
    console.warn(`警告，获取元素scale失败：${error}\n将使用默认值：1`);
    return 1;
  }
}
