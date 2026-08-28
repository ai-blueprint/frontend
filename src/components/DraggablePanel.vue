<script setup>
import { ref, onBeforeUnmount } from "vue"; // 引入拖拽位置和组件销毁能力

const props = defineProps({
	initialLeft: { type: Number, default: 12 }, // 面板初始左边距
	initialBottom: { type: Number, default: 12 }, // 面板初始下边距
});

const panelElement = ref(null); // 保存包裹层DOM，用于计算画布内坐标
const position = ref({ left: null, top: null }); // 拖动后保存左上角位置
let dragState = null; // 保存当前拖拽起点和面板起点
let suppressClick = false; // 拖动结束后阻止同一手势误触标题按钮

// --- 开始拖拽面板 ---
const onMouseDown = (event) => {
	if (!event.target.closest("[data-drag-handle]")) return; // 只有标题栏可以拖拽，控件点击保持原行为
	if (event.target.closest("[data-no-drag]")) return; // 标题栏中的业务按钮保持点击行为
	if (event.button !== 0 || !panelElement.value) return; // 只响应鼠标左键和有效面板

	const parentRect = panelElement.value.offsetParent.getBoundingClientRect(); // 获取蓝图容器屏幕位置
	const panelRect = panelElement.value.getBoundingClientRect(); // 获取面板当前屏幕位置
	position.value = { left: panelRect.left - parentRect.left, top: panelRect.top - parentRect.top }; // 首次拖动时把bottom布局转换为left/top布局
	dragState = { startX: event.clientX, startY: event.clientY, left: position.value.left, top: position.value.top }; // 记录鼠标和面板起点
	document.addEventListener("mousemove", onMouseMove); // 监听画布外的鼠标移动
	document.addEventListener("mouseup", onMouseUp); // 监听画布外的鼠标抬起
	event.preventDefault(); // 阻止拖动标题文字时选中文字
};

// --- 移动面板 ---
const onMouseMove = (event) => {
	if (!dragState || !panelElement.value) return; // 没有拖拽时不改变位置
	position.value = { left: Math.max(0, dragState.left + event.clientX - dragState.startX), top: Math.max(0, dragState.top + event.clientY - dragState.startY) }; // 把面板限制在画布左上方以内
	if (Math.abs(event.clientX - dragState.startX) > 3 || Math.abs(event.clientY - dragState.startY) > 3) suppressClick = true; // 超过3像素视为拖动而不是点击
};

// --- 结束拖拽面板 ---
const onMouseUp = () => {
	dragState = null; // 清除本次拖拽起点
	document.removeEventListener("mousemove", onMouseMove); // 释放移动监听
	document.removeEventListener("mouseup", onMouseUp); // 释放抬起监听
};

onBeforeUnmount(onMouseUp); // 面板销毁时释放全局事件监听

// --- 阻止拖动后的标题误触 ---
const onClick = (event) => {
	if (!suppressClick) return; // 普通点击继续交给面板自身处理
	event.stopPropagation(); // 拖动结束不触发标题折叠或按钮操作
	suppressClick = false; // 只抑制当前这一轮点击
};
</script>

<template>
	<div
		ref="panelElement"
		class="draggable-panel"
		:style="position.left === null ? { left: `${props.initialLeft}px`, bottom: `${props.initialBottom}px` } : { left: `${position.left}px`, top: `${position.top}px` }"
		@mousedown="onMouseDown"
		@click.capture="onClick">
		<slot />
	</div>
</template>

<style scoped>
.draggable-panel { position: absolute; z-index: 50; }
</style>
