<script setup>
import { markRaw } from 'vue'                      // 引入markRaw避免组件被reactive化
import { VueFlow, useVueFlow } from '@vue-flow/core' // 引入vueflow核心
import store from '@/store.js'                     // 引入全局状态
import NodeCmd from '@/commands/Node.js'            // 引入节点命令
import EdgeCmd from '@/commands/Edge.js'            // 引入连接线命令
import BlueprintCmd from '@/commands/Blueprint.js'  // 引入蓝图命令
import { toCanvas } from '@/utils/position.js'     // 引入坐标转换
import CustomNode from '@/components/Node.vue'      // 引入自定义节点组件
import ToolBar from '@/components/ToolBar.vue'      // 引入工具栏组件
import NodeMenu from '@/components/NodeMenu.vue'    // 引入节点菜单组件
import NodePanel from '@/components/NodePanel.vue'  // 引入节点面板组件

// --- 用markRaw标记组件，避免被reactive包裹导致性能警告 ---
const nodeTypes = { baseNode: markRaw(CustomNode) } // 节点类型映射

// --- 初始化vueflow实例 ---
const { onConnect, onPaneClick, onViewportChange, onNodesChange } = useVueFlow() // 获取vueflow钩子

// --- 在组件挂载后设置vueflow实例到蓝图命令中 ---
const onPaneReady = (instance) => {
    BlueprintCmd.setFlowInstance(instance)             // 保存vueflow实例引用
}

// --- 连接线创建时的处理 ---
onConnect((params) => {
    EdgeCmd.add(params.source, params.sourceHandle, params.target, params.targetHandle) // 创建连接线
})

// --- 画布空白处被点击 ---
onPaneClick((event) => {
    if (!event.ctrlKey && !event.metaKey) {            // 没有按Ctrl键
        NodeCmd.clearSelect()                            // 清空节点选择
    }
    store.nodeMenu.visible = false                    // 隐藏节点菜单
    store.nodePanel.visible = false                   // 隐藏节点面板
})

// --- 视口变化时同步到store ---
onViewportChange((viewport) => {
    store.viewport.x = viewport.x                     // 同步视口X
    store.viewport.y = viewport.y                     // 同步视口Y
    store.viewport.zoom = viewport.zoom               // 同步缩放
})

// --- 节点尺寸变化时更新measured ---
onNodesChange((changes) => {
    changes.forEach(change => {
        if (change.type === 'dimensions' && change.dimensions) { // 尺寸变化事件
            const node = store.blueprint.nodes.find(n => n.id === change.id) // 找到对应节点
            if (node) {
                node.measured = {                           // 更新节点尺寸
                    width: change.dimensions.width,           // 宽度
                    height: change.dimensions.height,         // 高度
                }
            }
        }
    })
})

// --- 接收拖入事件 ---
const onDragOver = (event) => {
    event.preventDefault()                            // 允许放置
    event.dataTransfer.dropEffect = 'move'            // 设置拖拽效果
}

// --- 放置事件：创建节点 ---
const onDrop = (event) => {
    event.preventDefault()                            // 阻止默认行为
    const opcode = event.dataTransfer.getData('application/opcode') // 获取拖入的节点opcode
    if (!opcode) return                               // 没有opcode直接返回

    const canvasPos = toCanvas(event.clientX, event.clientY) // 将屏幕坐标转为画布坐标
    NodeCmd.add(opcode, canvasPos.x, canvasPos.y)     // 在画布对应位置创建节点
}
</script>

<template>
    <div class="blueprint" @dragover="onDragOver" @drop="onDrop"> <!-- 蓝图区域容器 -->
        <VueFlow v-model:nodes="store.blueprint.nodes" v-model:edges="store.blueprint.edges" :default-viewport="store.viewport" :node-types="nodeTypes" :snap-to-grid="true" :snap-grid="[15, 15]" :min-zoom="0.5" :max-zoom="2" fit-view-on-init @pane-ready="onPaneReady"> <!-- VueFlow画布 -->
        </VueFlow>

        <ToolBar /> <!-- 底部工具栏 -->
        <NodeMenu /> <!-- 节点右键菜单 -->
        <NodePanel /> <!-- 节点参数面板 -->
    </div>
</template>

<style scoped>
.blueprint {
    flex: 1;
    /* 占满剩余空间 */
    position: relative;
    /* 相对定位，用于悬浮元素 */
    overflow: hidden;
    /* 隐藏溢出 */
    cursor: grab;
    /* 默认抓取光标 */
    transform-origin: 0 0;
    /* 变换原点在左上角 */
    min-width: 100%;
    /* 确保最小宽度 */
    min-height: 100%;
    /* 确保最小高度 */
}

.blueprint:active {
    cursor: grabbing;
    /* 拖动时的光标样式 */
}
</style>
