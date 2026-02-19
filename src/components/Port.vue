<script setup>
import { Handle } from "@vue-flow/core"; // 引入vueflow端口组件

defineProps({
	// 接收父组件传入的属性
	portKey: { type: String, required: true }, // 端口标识
	portLabel: { type: String, default: "" }, // 端口显示名称
	type: { type: String, required: true }, // 端口类型：source或target
	position: { type: String, required: true }, // 端口位置：left或right
});
</script>

<template>
	<div class="port" :class="['port-' + position]">
		<!-- 端口容器，根据位置加类名 -->
		<Handle :id="portKey" :type="type" :position="position" class="port-handle" :connectable="true" />
		<!-- vueflow端口圆点 -->
		<span v-if="portLabel" class="port-label">{{ portLabel }}</span>
		<!-- 有名称才显示标签 -->
	</div>
</template>

<style scoped>
.port {
	display: flex; /* 布局容器 */
	align-items: center; /* 垂直居中 */
}

.port-left {
	flex-direction: row;
} /* 左侧端口从左到右排列 */
.port-right {
	flex-direction: row-reverse;
} /* 右侧端口从右到左排列 */

.port-label {
	font-size: 11px; /* 标签字号 */
	color: rgba(255, 255, 255, 0.7); /* 半透明白色文字 */
	padding: 0 8px; /* 左右内边距 */
	white-space: nowrap; /* 不换行 */
	user-select: none; /* 禁止选中 */
}

.port-handle {
	width: 8px !important; /* 端口圆点宽度 */
	height: 8px !important; /* 端口圆点高度 */
	background: #ffffff !important; /* 白色端口 */
	border: none !important; /* 无边框 */
	border-radius: 50% !important; /* 圆形 */
	transition: 0.1s ease-in-out; /* 过渡动画 */
}

.port-handle:hover {
	background: #8cff00 !important; /* 悬停变绿 */
}
</style>
