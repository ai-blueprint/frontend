import dagre from '@dagrejs/dagre'

/**
 * 整理蓝图布局
 * @param {Object} state - 蓝图状态对象
 * @param {Object} options - 布局配置选项
 */
export function arrangeBlueprint(state, options = {}) {
  // 创建新的有向图
  const g = new dagre.graphlib.Graph()
  
  // 设置图布局选项
  g.setGraph({
    rankdir: 'LR', // 布局方向：LR（左右）、TB（上下）、RL、BT
    nodesep: 100,  // 节点间距
    ranksep: 150,  // 层级间距
    marginx: 50,   // 边距
    marginy: 50,
    ...options     // 合并自定义选项
  })
  
  // 设置默认边属性
  g.setDefaultEdgeLabel(() => ({}))
  
  // 添加节点
  state.nodes.forEach(node => {
    g.setNode(node.id, {
      width: 200,  // 固定节点宽度
      height: 50  // 固定节点高度
    })
  })
  
  // 添加边（从 links 中提取连接关系）
  state.links.forEach(link => {
    // 提取节点ID（去掉端口标识）
    const fromNodeId = link.from.split('_')[0]
    const toNodeId = link.to.split('_')[0]
    g.setEdge(fromNodeId, toNodeId)
  })
  
  // 执行布局
  dagre.layout(g)
  
  // 更新节点位置
  state.nodes.forEach(node => {
    const nodeWithPosition = g.node(node.id)
    node.position = {
      x: nodeWithPosition.x - 100,  // 减去节点宽度的一半
      y: nodeWithPosition.y - 25    // 减去节点高度的一半
    }
  })
  
  return state
}
