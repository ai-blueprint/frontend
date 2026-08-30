<script setup>
import { computed } from "vue"; // 引入Vue计算属性
import store from "@/store.js"; // 引入全局状态
import mathIcon from "@/assets/category/math.svg"; // 数学运算分类图标
import baseIcon from "@/assets/category/base.svg"; // 基础分类图标
import transformIcon from "@/assets/category/transform.svg"; // 变换分类图标
import activationIcon from "@/assets/category/activation.svg"; // 激活分类图标
import attentionIcon from "@/assets/category/attention.svg"; // 注意力分类图标
import lossIcon from "@/assets/category/loss.svg"; // 损失函数分类图标
import normalizationIcon from "@/assets/category/normalization.svg"; // 归一化分类图标
import shapeIcon from "@/assets/category/shape.svg"; // 形状分类图标

const categoryIcons = { base: baseIcon, transform: transformIcon, activation: activationIcon, attention: attentionIcon, loss: lossIcon, normalization: normalizationIcon, shape: shapeIcon, math: mathIcon }; // 每个分类使用一个Hugeicons线性图标

// --- 获取分类列表 ---
const categoryList = computed(() => {
	const categories = store.registry.categories || {}; // 获取分类表
	return Object.entries(categories).map(([key, category]) => ({
		// 转为数组格式
		key, // 分类标识
		label: category.label, // 分类名称
		color: category.color, // 分类颜色
		icon: categoryIcons[key] || category.icon, // 分类优先使用本地图标，未知分类使用注册表图标
	}));
});

// --- 当前选中的分类 ---
const selectedCategory = computed(() => store.selected.category); // 获取选中分类标识

// --- 点击切换分类 ---
const onSelectCategory = (categoryKey) => {
	store.selected.category = categoryKey; // 切换选中分类
};

// --- 生成分类图标样式 ---
const getIconStyle = (category) => ({ backgroundColor: selectedCategory.value === category.key ? "#fff" : category.color, WebkitMaskImage: `url("${category.icon}")`, maskImage: `url("${category.icon}")` }); // 用分类颜色填充图标遮罩
</script>

<template>
	<div class="category-bar">
		<!-- 分类栏容器 -->
		<div
			v-for="category in categoryList"
			:key="category.key"
			class="category-item"
			:class="{ active: selectedCategory === category.key }"
			:style="selectedCategory === category.key ? { background: category.color } : {}"
			@click="onSelectCategory(category.key)"
			:title="category.label">
			<!-- 每个分类项 -->
			<span v-if="category.icon" class="category-icon" :style="getIconStyle(category)" aria-hidden="true"></span>
			<!-- 有图标时显示分类图标 -->
			<span v-else class="category-letter" :style="selectedCategory === category.key ? { color: '#fff' } : { color: category.color }">{{ category.label.charAt(0) }}</span>
			<!-- 无图标时显示首字作为图标 -->
		</div>
	</div>
</template>

<style scoped>
.category-bar {
	flex: 0 0 58px;
	/* 分类栏固定宽度，分类增加时只使用滚动区域 */
	min-width: 58px;
	/* 防止工作区压缩分类栏 */
	background-color: #f6f9fe;
	/* 浅蓝灰背景 */
	display: flex;
	/* 纵向排列 */
	flex-direction: column;
	/* 垂直布局 */
	height: 100%;
	/* 铺满高度 */
	overflow-y: auto;
	/* 分类过多时沿纵向滚动 */
	overflow-x: hidden;
	/* 防止悬停放大产生横向滚动 */
	 scrollbar-width: none;
	/* Firefox隐藏滚动条但保留滚动能力 */
	user-select: none;
	/* 禁止选中 */
}

.category-bar::-webkit-scrollbar {
	display: none;
	/* Chromium和WebView隐藏滚动条但保留滚轮和触控滚动 */
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
	flex: 0 0 50px;
	/* 分类项保持固定高度，不被Flex压缩 */
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
	display: block;
	width: 100%;
	/* 恢复旧版图标占满分类项的宽度 */
	height: 100%;
	/* 恢复旧版图标占满分类项的高度 */
	transform: scale(0.62);
	/* 统一缩小Hugeicons图形，保持分类项尺寸不变 */
	background: var(--icon-color);
	/* 颜色由分类注册表自动提供 */
	-webkit-mask-position: center;
	-webkit-mask-size: contain;
	-webkit-mask-repeat: no-repeat;
	mask-position: center;
	mask-size: contain;
	mask-repeat: no-repeat;
	pointer-events: none;
	/* 禁止点击图标 */
}


.category-letter {
	font-size: 16px;
	/* 首字字号 */
	font-weight: 700;
	/* 加粗 */
}
</style>
