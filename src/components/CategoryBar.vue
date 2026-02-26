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
    width: fit-content;
    /* 自适应宽度 */
    background-color: #f6f9fe;
    /* 浅蓝灰背景 */
    display: flex;
    /* 纵向排列 */
    flex-direction: column;
    /* 垂直布局 */
    height: 100%;
    /* 铺满高度 */
    user-select: none;
    /* 禁止选中 */
}

.category-item {
    display: flex;
    /* 居中对齐 */
    align-items: center;
    /* 垂直居中 */
    justify-content: center;
    /* 水平居中 */
    width: 50px;
    /* 分类项宽度 */
    height: 50px;
    /* 分类项高度 */
    cursor: pointer;
    /* 鼠标指针 */
    margin: 4px;
    /* 外边距 */
    border-radius: 8px;
    /* 圆角 */
    position: relative;
    /* 相对定位 */
    transition: all 0.1s ease-in-out;
    /* 过渡动画 */
}

.category-item:hover {
    background-color: rgba(0, 0, 0, 0.1);
    /* 悬停半透明背景 */
    scale: 1.1;
    /* 悬停放大效果 */
}

.category-item:active {
    scale: 0.9;
    /* 点击缩小效果 */
}

.category-item.active {
    background-color: var(--category-color);
    /* 激活态使用分类颜色 */
    color: white;
    /* 激活态白色文字 */
}

.category-item.active:hover {
    scale: 1;
    /* 激活态不放大 */
}

.category-icon {
    width: 100%;
    /* 图标铺满 */
    pointer-events: none;
    /* 禁止点击图标 */
}

.category-icon.icon-active {
    filter: brightness(10);
    /* 激活态图标变白 */
}

.category-letter {
    font-size: 16px;
    /* 首字字号 */
    font-weight: 700;
    /* 加粗 */
}
</style>
