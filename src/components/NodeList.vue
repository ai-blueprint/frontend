<script setup>
import { computed } from 'vue'                     // 引入Vue计算属性
import store from '@/store.js'                     // 引入全局状态

// --- 获取当前选中分类下的节点列表 ---
const nodeList = computed(() => {
    const categoryKey = store.selected.category       // 当前选中的分类标识
    if (!categoryKey) return []                       // 没有选中分类返回空数组

    const category = store.registry.categories?.[categoryKey] // 获取分类定义
    if (!category) return []                          // 分类不存在返回空数组

    const opcodes = category.nodes || []              // 获取分类下的节点opcode列表
    return opcodes.map(opcode => {
        const nodeDefinition = store.registry.nodes?.[opcode] // 从注册表查找节点定义
        return nodeDefinition ? { opcode, label: nodeDefinition.label } : null // 返回节点信息
    }).filter(Boolean)                                // 过滤掉不存在的节点
})

// --- 拖拽开始时记录opcode ---
const onDragStart = (event, opcode) => {
    event.dataTransfer.setData('application/opcode', opcode)  // 设置拖拽数据为opcode
    event.dataTransfer.effectAllowed = 'move'         // 设置拖拽效果为移动
}
</script>

<template>
    <div class="node-list"> <!-- 节点列表容器 -->
        <div v-for="node in nodeList" :key="node.opcode" class="node-item" draggable="true" @dragstart="onDragStart($event, node.opcode)"> <!-- 每个可拖拽节点项 -->
            <span class="node-name">{{ node.label }}</span> <!-- 节点名称 -->
        </div>

        <div v-if="!nodeList.length" class="empty-text"> <!-- 空列表提示 -->
            暂无节点
        </div>
    </div>
</template>

<style scoped>
.node-list {
    width: 160px;
    /* 节点列表宽度 */
    background: #ffffff;
    /* 白色背景 */
    border-right: 1px solid #e0e0e0;
    /* 右侧分隔线 */
    padding: 8px;
    /* 内边距 */
    overflow-y: auto;
    /* 超出时滚动 */
}

.node-item {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    padding: 8px 10px;
    /* 内边距 */
    border-radius: 6px;
    /* 圆角 */
    cursor: grab;
    /* 抓取鼠标指针 */
    transition: background 0.15s;
    /* 过渡动画 */
    margin-bottom: 2px;
    /* 下方间距 */
    user-select: none;
    /* 禁止选中 */
}

.node-item:hover {
    background: #f0f0f0;
    /* 悬停浅灰背景 */
}

.node-item:active {
    cursor: grabbing;
    /* 拖拽中鼠标指针 */
}

.node-name {
    font-size: 13px;
    /* 名称字号 */
    color: #333333;
    /* 深色文字 */
}

.empty-text {
    text-align: center;
    /* 居中 */
    color: #999999;
    /* 灰色提示文字 */
    font-size: 12px;
    /* 字号 */
    padding: 20px 0;
    /* 上下内边距 */
}
</style>
