/**
 * 获取节点样式
 * 根据节点位置计算CSS样式
 * @param {Object} node - 节点对象
 * @returns {Object} CSS样式对象
 */
export function getNodeStyle(node) {
  if (!node || !node.position) return {};

  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
  };
}