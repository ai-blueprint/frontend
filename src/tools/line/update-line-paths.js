/**
 * 连接线工具函数
 * 负责计算和更新蓝图画布上的连接线
 */

import { getElementCenter } from '../data/get-element-center';

/**
 * 计算贝塞尔曲线路径
 * @param {Object} from - 起点坐标 {x, y}
 * @param {Object} to - 终点坐标 {x, y}
 * @returns {string} - SVG路径字符串
 */
export function createBezierPath(from, to) {
  const midX = (from.x + to.x) / 2;
  return `M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`;
}

/**
 * 更新所有连接线
 * @param {Array} links - 连接线列表
 * @param {Array} nodes - 节点列表（用于计算端点位置）
 * @param {Object|null} tempLink - 临时连接线（可选）
 * @returns {Array} - 更新后的路径列表
 */
export function updatePaths(links, nodes, tempLink = null) {
  const allPaths = [];

  // 1. 添加正式连接线
  if (Array.isArray(links)) {
    for (const link of links) {
      const fromCenter = getElementCenter(link.from);
      const toCenter = getElementCenter(link.to);

      if (fromCenter && toCenter) {
        allPaths.push({
          id: link.id,
          selected: link.selected,
          d: createBezierPath(fromCenter, toCenter)
        });
      }
    }
  }

  // 2. 添加临时连接线
  if (tempLink) {
    const fromCenter = getElementCenter(tempLink.from);
    if (fromCenter) {
      let toPoint = tempLink.to;

      // 处理目标点：可能是坐标对象或端点ID
      if (typeof toPoint === 'string') {
        toPoint = getElementCenter(toPoint);
        if (!toPoint) return allPaths;
      }

      if (toPoint && typeof toPoint === 'object' && 'x' in toPoint && 'y' in toPoint) {
        allPaths.push({
          id: 'temp',
          isTemp: true,
          d: createBezierPath(fromCenter, toPoint)
        });
      }
    }
  }

  return allPaths;
}