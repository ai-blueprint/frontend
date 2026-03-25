<script setup>
import { computed } from "vue"; // 引入Vue计算属性
import store from "@/store.js"; // 引入全局状态
import Node from "@/commands/Node.js"; // 引入节点命令

import IntInput from "@/elements/IntInput.vue"; // 整数输入组件
import FloatInput from "@/elements/FloatInput.vue"; // 浮点数输入组件
import BoolSwitch from "@/elements/BoolSwitch.vue"; // 布尔开关组件
import StrInput from "@/elements/StrInput.vue"; // 字符串输入组件
import ListInput from "@/elements/ListInput.vue"; // 列表输入组件
import EnumSelect from "@/elements/EnumSelect.vue"; // 枚举选择组件

// --- 参数类型到组件的映射 ---
const elementMap = {
	int: IntInput, // 整数类型 → 整数输入
	float: FloatInput, // 浮点类型 → 浮点输入
	bool: BoolSwitch, // 布尔类型 → 开关
	str: StrInput, // 字符串类型 → 文本输入
	list: ListInput, // 列表类型 → 列表输入
	enum: EnumSelect, // 枚举类型 → 下拉选择
};

// --- 获取当前面板绑定的节点 ---
const currentNode = computed(() => {
	if (!store.nodeContext.nodeId) return null; // 没有绑定节点返回null
	return Node.getById(store.nodeContext.nodeId); // 查找节点对象
});

// --- 获取节点参数列表 ---
const paramEntries = computed(() => {
	if (!currentNode.value) return []; // 没有节点返回空数组
	const params = currentNode.value.data?.params || {}; // 获取参数对象
	return Object.entries(params); // 转为[key, param]数组
});

// --- 是否有参数可显示 ---
const hasParams = computed(() => {
	return paramEntries.value.length > 0; // 有参数项才显示面板
});
</script>

<template>
	<div
		v-if="store.nodeContext.visible && hasParams"
		class="node-panel"
		:style="{
			left: store.nodeContext.x + 'px',
			top: store.nodeContext.y + store.nodeContext.gap + 'px',
			scale: store.viewport.zoom,
		}">
		<!-- 节点参数面板 -->
		<div class="panel-header">
			<div class="panel-title">节点的参数</div>
			<!-- 面板标题 -->
		</div>
		<div class="panel-content">
			<!-- 面板内容区域 -->
			<component v-for="[key, param] in paramEntries" :key="key" :is="elementMap[param.type]" :paramKey="key" :param="param" :nodeId="store.nodeContext.nodeId" />
			<!-- 动态渲染参数组件 -->
		</div>
	</div>
</template>

<style scoped>
.node-panel {
	position: fixed;
	transform: translate(-50%, 0%);
	transform-origin: top left;
	z-index: 999;
	border-radius: 14px;
	background: #f6f9fe;
	box-shadow: 0 2px 20px rgba(111, 125, 176, 0.15);
	min-width: 200px;
	max-width: 380px;
	width: max-content;
	overflow: hidden;
	white-space: nowrap;
}

.panel-header {
	background: #eaeffc;
	padding: 10px 14px;
	border-bottom: 1px solid rgba(111, 125, 176, 0.1);
}

.panel-title {
	font-size: 13px;
	font-weight: 600;
	color: rgb(111, 125, 176);
	letter-spacing: 0.5px;
	text-align: left;
}

.panel-content {
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: 300px;
	overflow-y: auto;
	font-size: 14px;
	font-weight: 600;
	color: #4c4c4c;
}

.param-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	height: 40px;
	white-space: nowrap;
}

.param-label,
label,
.slider__output {
	font-size: 12px;
	font-weight: 500;
	color: rgb(111, 125, 176);
}

.param-input {
	field-sizing: content;
	font-size: 12px;
	width: auto;
	max-width: 100px;
}

:deep(input[type="number"]::-webkit-inner-spin-button),
:deep(input[type="number"]::-webkit-outer-spin-button) {
	opacity: 1;
}

:deep(.number-input) {
	border-radius: 100px;
}

:deep([data-slot="listbox-item"]) {
	padding-inline: 0;
}

:deep(svg[data-slot="listbox-item-indicator--checkmark"]) {
	stroke-width: 4 !important;
	stroke: #8b92e5 !important;
}

:deep([data-slot="select"]) {
	width: max-content;
}

.panel-content::-webkit-scrollbar {
	width: 6px;
}

.panel-content::-webkit-scrollbar-track {
	background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
	background: rgba(111, 125, 176, 0.3);
	border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
	background: rgba(111, 125, 176, 0.5);
}
</style>
