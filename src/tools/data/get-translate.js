// 获取元素缩放
export function getTranslate(element) {
  try {
    const translateX = element.style.translateX;
    const translateY = element.style.translateY;
    if (translateX && translateY) return { translateX: parseFloat(translateX), translateY: parseFloat(translateY) };
    // 从transform属性中提取translate值
    const transform = element.style.transform;
    const translateMatch = transform.match(/translate\(([^)]+)\)/);
    const translateValue = translateMatch[1].split(",");
    return {
      translateX: parseFloat(translateValue[0]),
      translateY: parseFloat(translateValue[1]),
    };
  } catch (error) {
    console.log(
      `警告，获取元素的translate失败：${error}\n将使用默认值\n{ translateX: 0, translateY: 0 }`
    );
    return { translateX: 0, translateY: 0 };
  }
}
