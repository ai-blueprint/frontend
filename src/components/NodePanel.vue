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
			top: store.nodeContext.y + 'px',
		}">
		<!-- 节点参数面板 -->
		<div class="panel-title">节点的参数</div>
		<!-- 面板标题 -->
		<div class="panel-content">
			<!-- 面板内容区域 -->
			<component v-for="[key, param] in paramEntries" :key="key" :is="elementMap[param.type]" :paramKey="key" :param="param" :nodeId="store.nodeContext.nodeId" />
			<!-- 动态渲染参数组件 -->
		</div>
	</div>
</template>

<style scoped>
.node-panel {
	min-width: 200px;
	/* 最小宽度 */
	max-width: 250px;
	/* 最大宽度 */
	width: 100%;
	/* 铺满可用宽度 */
	height: 100%;
	/* 铺满高度 */
	background-color: #f6f9fe;
	/* 浅蓝灰背景 */
	padding: 16px;
	/* 内边距 */
	box-sizing: border-box;
	/* 盒模型 */
	overflow-y: auto;
	/* 内容超出时滚动 */
}

.panel-title {
	font-size: 18px;
	/* 标题字号 */
	font-weight: bold;
	/* 标题加粗 */
	color: #333333;
	/* 深色标题 */
	margin-bottom: 10px;
	/* 标题下方间距 */
	padding-bottom: 5px;
	/* 底部内边距 */
	border-bottom: 2px solid #eaeffc;
	/* 紫蓝色底部分隔线 */
	width: 100%;
	/* 铺满宽度 */
	text-align: left;
	/* 左对齐 */
}

.panel-content {
	display: flex;
	/* 纵向排列 */
	flex-direction: column;
	/* 垂直布局 */
	height: calc(100% - 60px);
	/* 减去标题高度 */
	font-size: 14px;
	/* 内容字号 */
	font-weight: 600;
	/* 加粗 */
	color: #4c4c4c;
	/* 深灰文字 */
	overflow: hidden;
	/* 隐藏溢出 */
}

.param-item {
	display: flex;
	/* 横向排列标签和输入 */
	align-items: center;
	/* 垂直居中 */
	font-size: 14px;
	/* 参数字号 */
	font-weight: 600;
	/* 加粗 */
	color: #333333;
	/* 深色文字 */
	white-space: nowrap;
	/* 不换行 */
	margin-bottom: 10px;
	/* 参数间距 */
	width: 100%;
	/* 铺满宽度 */
	flex-direction: row;
	/* 横向排列 */
	flex-wrap: nowrap;
	/* 不换行 */
	justify-content: space-between;
	/* 两端对齐 */
}
</style>
