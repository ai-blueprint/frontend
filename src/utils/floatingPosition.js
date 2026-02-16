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

    const screenCenter = toScreen(centerX, topY)                 // 节点顶部中心转屏幕坐标
    const screenBottom = toScreen(centerX, bottomY)              // 节点底部中心转屏幕坐标

    store.nodeMenu.x = screenCenter.x                            // 菜单X设为节点中心
    store.nodeMenu.y = screenCenter.y - gap                      // 菜单Y设在节点正上方

    store.nodePanel.x = screenBottom.x                           // 面板X设为节点中心
    store.nodePanel.y = screenBottom.y + gap                     // 面板Y设在节点正下方
}

export { updateFloatingPosition }                               // 导出位置更新函数
