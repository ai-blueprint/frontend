<script setup>
import store from "@/store.js"; // 引入全局状态
import Blueprint from "@/commands/Blueprint.js"; // 引入蓝图命令
import History from "@/commands/History.js"; // 引入历史记录命令

import undoIcon from "@/assets/ToolBar/undo.svg"; // 撤销图标
import redoIcon from "@/assets/ToolBar/redo.svg"; // 反撤销图标
import zoomInIcon from "@/assets/ToolBar/zoom-in.svg"; // 放大图标
import zoomOutIcon from "@/assets/ToolBar/zoom-out.svg"; // 缩小图标
import arrangeIcon from "@/assets/ToolBar/arrange.svg"; // 排列图标

// --- 缩放百分比显示 ---
const zoomPercent = () => Math.round(store.viewport.zoom * 100) + "%"; // 计算缩放百分比

// --- 撤销 ---
const onUndo = () => History.undo(); // 执行撤销

// --- 反撤销 ---
const onRedo = () => History.redo(); // 执行重做

// --- 缩小 ---
const onZoomOut = () => Blueprint.zoomOut(); // 执行缩小

// --- 放大 ---
const onZoomIn = () => Blueprint.zoomIn(); // 执行放大

// --- 点击缩放数值重置 ---
const onResetZoom = () => Blueprint.resetZoom(); // 重置缩放到100%

// --- 排列节点 ---
const onArrange = () => Blueprint.arrange(); // 执行自动排列
</script>

<template>
	<div class="toolbar">
		<!-- 工具栏容器 -->
		<button class="tool-button" @click="onUndo" title="撤销 (Ctrl+Z)">
			<img :src="undoIcon" alt="undo" class="tool-icon" />
			<!-- 撤销按钮 -->
		</button>

		<button class="tool-button" @click="onRedo" title="反撤销 (Ctrl+Shift+Z)">
			<img :src="redoIcon" alt="redo" class="tool-icon" />
			<!-- 反撤销按钮 -->
		</button>

		<div class="tool-divider"></div>
		<!-- 分隔线 -->

		<button class="tool-button" @click="onZoomOut" title="缩小">
			<img :src="zoomOutIcon" alt="zoom-out" class="tool-icon" />
			<!-- 缩小按钮 -->
		</button>

		<button class="zoom-display" @click="onResetZoom" title="点击重置缩放">
			{{ zoomPercent() }}
			<!-- 缩放百分比显示 -->
		</button>

		<button class="tool-button" @click="onZoomIn" title="放大">
			<img :src="zoomInIcon" alt="zoom-in" class="tool-icon" />
			<!-- 放大按钮 -->
		</button>

		<div class="tool-divider"></div>
		<!-- 分隔线 -->

		<button class="tool-button" @click="onArrange" title="排列节点">
			<img :src="arrangeIcon" alt="arrange" class="tool-icon" />
			<!-- 排列按钮 -->
		</button>
	</div>
</template>

<style scoped>
.toolbar {
	position: absolute;
	/* 绝对定位在蓝图区域内 */
	bottom: 10px;
	/* 距底部10px */
	right: 10px;
	/* 距右侧10px */
	display: flex;
	/* 横向排列 */
	align-items: center;
	/* 垂直居中 */
	z-index: 10;
	/* 层级 */
}

.toolbar-group {
	display: flex;
	/* 横向排列按钮组 */
}

.tool-button {
	display: flex;
	/* 居中对齐 */
	align-items: center;
	/* 垂直居中 */
	padding: 4px 8px;
	/* 内边距 */
	border: none;
	/* 无边框 */
	cursor: pointer;
	/* 鼠标指针 */
	font-size: 18px;
	/* 字号 */
	font-weight: bold;
	/* 加粗 */
	transition: all 0.1s;
	/* 过渡动画 */
	color: #8992eb;
	/* 紫色文字 */
	background: transparent;
	/* 透明背景 */
	transition: all 0.1s;
	/* 过渡动画 */
}

.tool-button:hover:not(:disabled) {
	scale: 1.1;
	/* 悬停放大效果 */
}

.tool-button:active:not(:disabled) {
	scale: 0.9;
	/* 点击缩小效果 */
}

.tool-button:disabled {
	opacity: 0.7;
	/* 禁用时半透明 */
	cursor: not-allowed;
	/* 禁用时禁止光标 */
}

.tool-icon {
	width: 26px;
	/* 图标宽度 */
	height: 26px;
	/* 图标高度 */
	object-fit: contain;
	/* 图标等比缩放 */
}

.tool-divider {
	width: 1px;
	/* 分隔线宽度 */
	height: 20px;
	/* 分隔线高度 */
	background: #8992eb;
	/* 紫色分隔线 */
	margin: 0 4px;
	/* 左右间距 */
	opacity: 0.3;
	/* 半透明 */
}

.zoom-display {
	padding: 4px 8px;
	/* 内边距 */
	background: transparent;
	/* 透明背景 */
	border: none;
	/* 无边框 */
	color: #8992eb;
	/* 紫色文字 */
	font-size: 20px;
	/* 字号 */
	font-weight: bold;
	/* 加粗 */
	cursor: pointer;
	/* 鼠标指针 */
	min-width: 45px;
	/* 最小宽度 */
	text-align: center;
	/* 文字居中 */
	width: 70px;
	/* 宽度 */
	transition: all 0.1s;
}

.zoom-display:hover {
	scale: 1.1;
	/* 悬停放大效果 */
}
</style>
