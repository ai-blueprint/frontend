<script setup>
import { computed } from 'vue' // 引入计算属性
import store from '@/store.js' // 引入全局状态管理

// 计算属性：自动同步 store 中的注册表数据
const registryList = computed(() => store.registry)

// 根据分类键获取该分类下的所有节点
const groupNodes = (categoryKey) => {
    const category = registryList.value.categories?.[categoryKey]
    if (!category) return []

    return (category.nodes || [])
        .map(opcode => {
            const def = registryList.value.nodes?.[opcode]
            return def ? { opcode, label: def.label } : null
        })
        .filter(Boolean) // 过滤掉无效节点
}

// 拖拽开始事件处理
const onDragStart = (event, opcode) => {
    event.dataTransfer.setData('application/opcode', opcode) // 传递节点数据
    event.dataTransfer.effectAllowed = 'move' // 设置为移动操作
}
</script>

<template>
    <div class="node-list">
        <!-- 遍历所有分类 -->
        <div v-for="(category, key) in registryList.categories" :key="key" class="node-group">
            <div class="group-name">{{ category.label }}</div> <!-- 分类标题 -->

            <!-- 遍历分类下的节点 -->
            <div 
                v-for="node in groupNodes(key)" 
                :key="node.opcode" 
                class="node-item" 
                draggable="true" 
                @dragstart="onDragStart($event, node.opcode)" 
                :style="{ '--node-color': category.color }"
            >
                <span class="node-name">{{ node.label }}</span> <!-- 节点名称 -->
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 列表容器 */
.node-list {
    
    user-select: none;
    width: 30%;
    min-width: 180px;
    max-width: 200px;
    height: 100%;
    background-color: #eaeffc;
    padding: 10px;
    overflow-y: auto;
    overflow-x: hidden;
    direction: rtl; /* 滚动条置左 */
}

/* 滚动条样式 */
.node-list::-webkit-scrollbar { width: 6px; }
.node-list::-webkit-scrollbar-track { background: transparent; }
.node-list::-webkit-scrollbar-thumb { 
    background: #aaaaaa;
    border-radius: 3px;
}
.node-list::-webkit-scrollbar-thumb:hover { background: #8992eb; }

/* 分类组 */
.node-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 30px;
    gap: 18px;
    direction: ltr; /* 恢复文字方向 */
}

/* 分类标题 */
.group-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

/* 节点卡片 */
.node-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 12px 20px;
    border-radius: 12px;
    background-color: var(--node-color);
    cursor: grab;
    transition: opacity 0.2s, transform 0.1s;
}

.node-item:hover {
    opacity: 0.9;
}

.node-item:active {
    cursor: grabbing;
    transform: scale(0.98);
}

/* 节点文字 */
.node-name {
    font-size: 18px;
    color: #fff;
    white-space: nowrap;
}
</style>
