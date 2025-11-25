// 遍历蓝图所有节点
// 找到包含所有节点的最小范围
// 返回这个范围
export function calculateBlueprintSize(nodes, padding) {
  //这个是JSON
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 加上节点的width和height，
  const nodeWidth = 200;
  const nodeHeight = 50;
  function traverse(node) {
    if (node.position.x < minX) minX = node.position.x;
    if (node.position.y < minY) minY = node.position.y;
    if (node.position.x + nodeWidth > maxX) maxX = node.position.x + nodeWidth;
    if (node.position.y + nodeHeight > maxY) maxY = node.position.y + nodeHeight;
  }

  // 安全检查，确保 nodes 是数组且存在
  if (Array.isArray(nodes)) {
    nodes.forEach(traverse);

    if (nodes.length == 0) {
      minX = 0;
      minY = 0;
      maxX = 100;
      maxY = 100;
    }
  } else {
    minX = 0;
    minY = 0;
    maxX = 100;
    maxY = 100;
  }

  return {
    width: maxX - minX + padding,
    height: maxY - minY + padding,
  };
}
