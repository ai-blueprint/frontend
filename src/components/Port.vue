<script setup>
import { Handle } from '@vue-flow/core' // 引入vueflow端口组件和钩子
import Edge from '@/commands/Edge.js'               // 引入连接线命令

const props = defineProps({                         // 接收父组件传入的属性
    portKey: { type: String, required: true },        // 端口标识
    portLabel: { type: String, default: '' },         // 端口显示名称
    type: { type: String, required: true },           // 端口类型：source或target
    position: { type: String, required: true },       // 端口位置：left或right
    nodeId: { type: String, required: true },         // 所属节点ID
})

// --- 端口被鼠标按下时的处理 ---
const onMouseDown = (event) => {
    if (props.type !== 'target') return               // 只处理输入端口
    const existingEdge = Edge.getByInputPort(props.nodeId, props.portKey) // 检查该输入端口是否已有连线
    if (!existingEdge) return                         // 没有连线就不处理，让VueFlow默认行为生效

    // --- 获取原连接线的输出端口信息 ---
    const sourceNodeId = existingEdge.source          // 原输出端口所在节点ID
    const sourceHandle = existingEdge.sourceHandle    // 原输出端口标识

    Edge.remove(existingEdge.id)                      // 断开旧连接线

    // --- 注意：VueFlow会自动从输出端口开始重新建立连接到鼠标 ---
    // --- 这里通过删除旧线让VueFlow处理后续的重连行为 ---
}
</script>

<template>
    <div class="port" :class="['port-' + position]"> <!-- 端口容器，根据位置加类名 -->
        <Handle :id="portKey" :type="type" :position="position" class="port-handle" :connectable="true" @mousedown="onMouseDown" /> <!-- vueflow端口圆点 -->
        <span v-if="portLabel" class="port-label">{{ portLabel }}</span> <!-- 有名称才显示标签 -->
    </div>
</template>

<style scoped>
.port {
    display: flex;
    /* 布局容器 */
    width: 8px;
    /* 端口宽度 */
    height: 8px;
    /* 端口高度 */
    background-color: #ffffff;
    /* 白色圆点 */
    border-radius: 50%;
    /* 圆形 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: 0.1s ease-in-out;
    /* 过渡动画 */
}

.port:hover {
    background-color: #8cff00;
    /* 悬停变绿 */
}

.port.snap {
    background-color: #FFD700;
    /* 吸附状态金色 */
}

.port-left {
    flex-direction: row;
    /* 左侧端口从左到右排列 */
}

.port-right {
    flex-direction: row-reverse;
    /* 右侧端口从右到左排列 */
}

.port-label {
    font-size: 11px;
    /* 标签字号 */
    color: rgba(255, 255, 255, 0.7);
    /* 标签半透明白色文字 */
    padding: 0 8px;
    /* 左右内边距 */
    white-space: nowrap;
    /* 不换行 */
    user-select: none;
    /* 禁止选中 */
}

.port-handle {
    width: 8px !important;
    /* 端口圆点宽度 */
    height: 8px !important;
    /* 端口圆点高度 */
    background: #ffffff !important;
    /* 白色端口 */
    border: none !important;
    /* 无边框 */
    border-radius: 50% !important;
    /* 圆形 */
    transition: 0.1s ease-in-out;
    /* 过渡动画 */
}

.port-handle:hover {
    background: #8cff00 !important;
    /* 悬停变绿 */
}
</style>
