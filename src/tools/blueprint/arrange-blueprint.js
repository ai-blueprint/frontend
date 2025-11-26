import dagre from '@dagrejs/dagre'
export function arrangeBlueprint(state, options = {}) {
  // 创建新的有向图
  const g = new dagre.graphlib.Graph()
  
  // 设置图布局选项
  g.setGraph({
    rankdir: 'LR', // 布局方向：LR（左右）、TB（上下）、RL、BT
    nodesep: 50,  // 节点间距
    ranksep: 50,  // 层级间距
    marginx: 400,   // 边距
    marginy: 400,
    edgesep: 50,  // 边间距
    align: 'UL', // 节点对齐方式，可选：'UL' | 'UR' | 'DL' | 'DR' | undefined
    acyclicer: 'network-simplex', // 循环检测算法，可选：'greedy' | 'opt2' | undefined
    ranker: 'network-simplex', // 层级排序算法，可选：'network-simplex' | 'tight-tree' | 'longest-path' | undefined
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
      x: nodeWithPosition.x,
      y: nodeWithPosition.y
    }
  })
  
  return state
}
