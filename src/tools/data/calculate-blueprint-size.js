/**
 * 计算蓝图的大小范围
 * 遍历蓝图所有节点，找到包含所有节点的最小矩形范围
 * @param {Array} nodes - 节点数组，每个节点应包含position属性
 * @param {number} padding - 添加到计算范围的内边距值
 * @returns {Object} 包含width和height属性的对象，表示蓝图的尺寸
 */
export function calculateBlueprintSize(nodes, padding = 0) {
  // 初始化最小/最大坐标值
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 节点的默认宽高
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 50;
  
  /**
   * 遍历单个节点，更新最小/最大坐标值
   * @param {Object} node - 单个节点对象，包含position属性
   */
  function updateNodeBounds(node) {
    try {
      // 验证节点和位置属性
      if (!node || !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        return;
      }
      
      // 更新最小坐标
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
      
      // 更新最大坐标（包含节点宽度和高度）
      if (node.position.x + NODE_WIDTH > maxX) maxX = node.position.x + NODE_WIDTH;
      if (node.position.y + NODE_HEIGHT > maxY) maxY = node.position.y + NODE_HEIGHT;
    } catch (error) {
      console.warn(`计算节点边界时出错: ${error.message}`);
    }
  }

  // 安全检查：确保nodes是有效数组
  if (Array.isArray(nodes)) {
    // 遍历所有节点更新边界
    nodes.forEach(updateNodeBounds);

    // 处理空数组情况
    if (nodes.length === 0 || minX === Infinity) {
      // 如果没有节点或计算失败，返回默认尺寸
      return {
        width: 100 + padding,
        height: 100 + padding
      };
    }
  } else {
    // 非数组输入，返回默认尺寸
    return {
      width: 100 + padding,
      height: 100 + padding
    };
  }

  // 计算最终尺寸（包含内边距）
  return {
    width: maxX - minX + padding,
    height: maxY - minY + padding
  };
}
