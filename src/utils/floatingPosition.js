import store from '@/store.js'              // 引入全局状态
import { toScreen } from '@/utils/position.js' // 引入坐标转换

// --- 更新节点菜单和面板的屏幕位置 ---
const updateFloatingPosition = (nodeId) => {
    if (!nodeId) return                                          // 没有节点ID直接返回

    const node = store.blueprint.nodes.find(n => n.id === nodeId) // 找到目标节点
    if (!node) return                                            // 节点不存在直接返回

    const width = node.measured?.width || 150                    // 获取节点宽度
    const height = node.measured?.height || 50                   // 获取节点高度
    const centerX = node.position.x + width / 2                 // 计算节点中心X
    const topY = node.position.y                                 // 节点顶部Y
    const bottomY = node.position.y + height                     // 节点底部Y
    const gap = 10                                                // 菜单/面板与节点的间距
    const halfHeight = (height * store.viewport.zoom) / 2         // 节点高度的一半（屏幕尺度）

    const screenTop = toScreen(centerX, topY)                    // 节点顶部中心转屏幕坐标
    const screenBottom = toScreen(centerX, bottomY)              // 节点底部中心转屏幕坐标

    store.nodeContext.x = screenTop.x                               // 菜单X设为节点中心
    store.nodeContext.y = screenTop.y - gap - halfHeight             // 菜单Y设在节点顶部上方（减去半高偏移）

    store.nodeContext.x = screenBottom.x                           // 面板X设为节点中心
    store.nodeContext.y = screenBottom.y + gap + halfHeight         // 面板Y设在节点底部下方（加上半高偏移）
}

export { updateFloatingPosition }                               // 导出位置更新函数
