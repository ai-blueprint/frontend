<script setup>
import { computed } from 'vue'                     // 引入Vue计算属性
import store from '@/store.js'                     // 引入全局状态

// --- 获取分类列表 ---
const categoryList = computed(() => {
    const categories = store.registry.categories || {} // 获取分类表
    return Object.entries(categories).map(([key, category]) => ({ // 转为数组格式
        key,                                            // 分类标识
        label: category.label,                          // 分类名称
        color: category.color,                          // 分类颜色
        icon: category.icon,                            // 分类图标
    }))
})

// --- 当前选中的分类 ---
const selectedCategory = computed(() => store.selected.category) // 获取选中分类标识

// --- 点击切换分类 ---
const onSelectCategory = (categoryKey) => {
    store.selected.category = categoryKey             // 切换选中分类
}
</script>

<template>
    <div class="category-bar"> <!-- 分类栏容器 -->
        <div v-for="category in categoryList" :key="category.key" class="category-item" :class="{ active: selectedCategory === category.key }" :style="selectedCategory === category.key ? { background: category.color } : {}" @click="onSelectCategory(category.key)" :title="category.label"> <!-- 每个分类项 -->
            <img v-if="category.icon" :src="category.icon" alt="" class="category-icon" :class="{ 'icon-active': selectedCategory === category.key }" /> <!-- 有图标时显示分类图标 -->
            <span v-else class="category-letter" :style="selectedCategory === category.key ? { color: '#fff' } : { color: category.color }">{{ category.label.charAt(0) }}</span> <!-- 无图标时显示首字作为图标 -->
        </div>
    </div>
</template>

<style scoped>
.category-bar {
    display: flex;
    /* 纵向排列 */
    flex-direction: column;
    /* 垂直布局 */
    align-items: center;
    /* 水平居中 */
    width: 48px;
    /* 分类栏宽度 */
    background: #fafafa;
    /* 浅灰背景 */
    border-right: 1px solid #e0e0e0;
    /* 右侧分隔线 */
    padding: 8px 0;
    /* 上下内边距 */
    gap: 4px;
    /* 分类项间距 */
    overflow-y: auto;
    /* 超出时滚动 */
}

.category-item {
    display: flex;
    /* 居中对齐 */
    align-items: center;
    /* 垂直居中 */
    justify-content: center;
    /* 水平居中 */
    width: 36px;
    /* 分类项宽度 */
    height: 36px;
    /* 分类项高度 */
    border-radius: 8px;
    /* 圆角 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: all 0.15s;
    /* 过渡动画 */
}

.category-item:hover {
    background: #eeeeee;
    /* 悬停浅灰背景 */
}

.category-item.active {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    /* 激活态阴影 */
}

.category-icon {
    width: 20px;
    /* 图标宽度 */
    height: 20px;
    /* 图标高度 */
    opacity: 0.7;
    /* 默认透明度 */
}

.category-icon.icon-active {
    opacity: 1;
    /* 激活态完全不透明 */
    filter: brightness(10);
    /* 激活态图标变白 */
}

.category-letter {
    font-size: 16px;
    /* 首字字号 */
    font-weight: 700;
    /* 加粗 */
    user-select: none;
    /* 禁止选中 */
}
</style>
