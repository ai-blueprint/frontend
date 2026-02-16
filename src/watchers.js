import { watch } from 'vue'                            // 引入Vue的watch
import store from '@/store.js'                         // 引入全局状态
import { updateFloatingPosition } from '@/utils/floatingPosition.js' // 引入位置更新工具

// --- 初始化数据维护监听 ---
const initWatchers = () => {

    // --- 监听节点数量变化，清理失效的菜单和面板 ---
    watch(
        () => store.blueprint.nodes.length,                         // 监听节点数组长度
        () => {
            if (store.nodeMenu.visible && store.nodeMenu.nodeId) {    // 菜单正在显示
                const menuNode = store.blueprint.nodes.find(n => n.id === store.nodeMenu.nodeId) // 查找菜单绑定的节点
                if (!menuNode) {                                        // 节点已被删除
                    store.nodeMenu.visible = false                        // 隐藏菜单
                    store.nodeMenu.nodeId = null                          // 清空绑定
                }
            }

            if (store.nodePanel.visible && store.nodePanel.nodeId) {  // 面板正在显示
                const panelNode = store.blueprint.nodes.find(n => n.id === store.nodePanel.nodeId) // 查找面板绑定的节点
                if (!panelNode) {                                       // 节点已被删除
                    store.nodePanel.visible = false                       // 隐藏面板
                    store.nodePanel.nodeId = null                         // 清空绑定
                }
            }
        }
    )

    // --- 监听菜单绑定节点的位置变化，更新菜单位置 ---
    watch(
        () => {
            if (!store.nodeMenu.visible || !store.nodeMenu.nodeId) return null // 菜单不可见就不监听
            const node = store.blueprint.nodes.find(n => n.id === store.nodeMenu.nodeId) // 找到绑定节点
            if (!node) return null                                    // 节点不存在返回null
            return {                                                  // 返回需要监听的数据
                x: node.position.x,                                    // 节点X坐标
                y: node.position.y,                                    // 节点Y坐标
                width: node.measured?.width,                            // 节点宽度
                height: node.measured?.height,                          // 节点高度
                viewportX: store.viewport.x,                            // 视口X
                viewportY: store.viewport.y,                            // 视口Y
                viewportZoom: store.viewport.zoom,                      // 视口缩放
            }
        },
        (newVal) => {
            if (!newVal) return                                       // 无数据不处理
            updateFloatingPosition(store.nodeMenu.nodeId)             // 更新菜单位置
        },
        { deep: true }                                              // 深度监听
    )

    // --- 监听面板绑定节点的位置变化，更新面板位置 ---
    watch(
        () => {
            if (!store.nodePanel.visible || !store.nodePanel.nodeId) return null // 面板不可见就不监听
            const node = store.blueprint.nodes.find(n => n.id === store.nodePanel.nodeId) // 找到绑定节点
            if (!node) return null                                    // 节点不存在返回null
            return {                                                  // 返回需要监听的数据
                x: node.position.x,                                    // 节点X坐标
                y: node.position.y,                                    // 节点Y坐标
                width: node.measured?.width,                            // 节点宽度
                height: node.measured?.height,                          // 节点高度
                viewportX: store.viewport.x,                            // 视口X
                viewportY: store.viewport.y,                            // 视口Y
                viewportZoom: store.viewport.zoom,                      // 视口缩放
            }
        },
        (newVal) => {
            if (!newVal) return                                       // 无数据不处理
            updateFloatingPosition(store.nodePanel.nodeId)            // 更新面板位置
        },
        { deep: true }                                              // 深度监听
    )
}

export { initWatchers }                                         // 导出初始化函数
