// 接收起点和终点坐标
// 计算控制点
// 返回 SVG 贝塞尔曲线指令
export function generateBezier(start, end) {
  const control = {
    x: (start.x + end.x) / 2,
    y: start.y
  }
  return `M${start.x},${start.y} C${control.x},${control.y} ${control.x},${control.y} ${end.x},${end.y}`
}