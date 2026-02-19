<script setup>
import { markRaw } from 'vue'                      // 引入markRaw避免组件被reactive化
import { VueFlow, useVueFlow } from '@vue-flow/core' // 引入vueflow核心
import '@vue-flow/core/dist/style.css';// 引入默认主题样式
import '@vue-flow/core/dist/theme-default.css';
import store from '@/store.js'                     // 引入全局状态
import Node from '@/commands/Node.js'            // 引入节点命令
import Edge from '@/commands/Edge.js'            // 引入连接线命令
import Blueprint from '@/commands/Blueprint.js'  // 引入蓝图命令
import CustomNode from '@/components/Node.vue'      // 引入自定义节点组件
import ToolBar from '@/components/ToolBar.vue'      // 引入工具栏组件
import NodeMenu from '@/components/NodeMenu.vue'    // 引入节点菜单组件
import NodePanel from '@/components/NodePanel.vue'  // 引入节点面板组件

// --- 用markRaw标记组件，避免被reactive包裹导致性能警告 ---
const nodeTypes = { baseNode: markRaw(CustomNode) } // 节点类型映射

// --- 初始化vueflow实例 ---
const { onConnect, onPaneClick, onViewportChange, onNodesChange, project } = useVueFlow() // 获取vueflow钩子

// --- 在组件挂载后设置vueflow实例到蓝图命令中 ---
const onPaneReady = (instance) => {
    Blueprint.setFlowInstance(instance)             // 保存vueflow实例引用
}

// --- 连接线创建时的处理 ---
onConnect((params) => {
    Edge.add(params.source, params.sourceHandle, params.target, params.targetHandle) // 创建连接线
})

// --- 画布空白处被点击 ---
onPaneClick((event) => {
    if (!event.ctrlKey && !event.metaKey) {            // 没有按Ctrl键
        Node.clearSelect()                            // 清空节点选择
    }
    store.nodeMenu.visible = false                    // 隐藏节点菜单
    store.nodePanel.visible = false                   // 隐藏节点面板
})

// --- 视口变化时同步到store ---
onViewportChange((viewport) => {
    store.viewport = viewport                         // 同步视口
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

    const position = project({ x: event.clientX, y: event.clientY }) // 将屏幕坐标转为画布坐标
    Node.add(opcode, position.x, position.y)     // 在画布对应位置创建节点
}
</script>

<template>
    <div class="blueprint" @dragover="onDragOver" @drop="onDrop"> <!-- 蓝图区域容器 -->
        <VueFlow v-model:nodes="store.blueprint.nodes" v-model:edges="store.blueprint.edges" v-model:viewport="store.viewport" :node-types="nodeTypes" :min-zoom="0.5" :max-zoom="2" fit-view-on-init @pane-ready="onPaneReady"> <!-- VueFlow画布 -->
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
    width: 100%;
    /* 确保最小宽度 */
    height: 100%;
    /* 确保最小高度 */
}

.blueprint:active {
    cursor: grabbing;
    /* 拖动时的光标样式 */
}
</style>
