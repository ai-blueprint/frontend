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
    width: 30%;
    /* 占工作区30%宽度 */
    min-width: 180px;
    /* 最小宽度 */
    max-width: 200px;
    /* 最大宽度 */
    background-color: #eaeffc;
    /* 浅蓝紫背景 */
    overflow-y: auto;
    /* 纵向滚动 */
    overflow-x: hidden;
    /* 隐藏横向溢出 */
    padding: 10px;
    /* 内边距 */
    height: 100%;
    /* 铺满高度 */
    direction: rtl;
    /* 滚动条移到左侧 */
}

.node-group {
    display: flex;
    /* 纵向排列节点列表 */
    flex-direction: column;
    /* 垂直布局 */
    margin-bottom: 30px;
    /* 分组间距 */
    gap: 18px;
    /* 节点项间距 */
    direction: ltr;
    /* 内容恢复从左到右 */
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
    background: rgba(0, 0, 0, 0.05);
    /* 悬停半透明背景 */
}

.node-item:active {
    cursor: grabbing;
    /* 拖拽中鼠标指针 */
}

.group-name {
    font-size: 16px;
    /* 分组名称字号 */
    font-weight: 600;
    /* 加粗 */
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
    direction: ltr;
    /* 提示文字从左到右 */
}

/* --- 滚动条美化 --- */
.node-list::-webkit-scrollbar {
    width: 6px;
    /* 滚动条宽度 */
}

.node-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0);
    /* 轨道透明 */
}

.node-list::-webkit-scrollbar-thumb {
    background: #aaaaaa;
    /* 滑块默认灰色 */
}

.node-list::-webkit-scrollbar-thumb:hover {
    background: #8992eb;
    /* 滑块悬停紫色 */
}
</style>
