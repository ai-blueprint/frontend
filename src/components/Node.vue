<script setup>
import { ref, computed, nextTick, watch } from "vue"; // 引入Vue组合式API
import store from "@/store.js"; // 引入全局状态
import Node from "@/commands/Node.js"; // 引入节点命令
import Port from "@/components/Port.vue"; // 引入端口组件

const props = defineProps({
	// 接收vueflow传入的节点属性
	id: { type: String, required: true }, // 节点ID
	data: { type: Object, required: true }, // 节点数据
	selected: { type: Boolean, default: false }, // 是否选中
});

const renameInput = ref(null); // 重命名输入框的引用
const renameValue = ref(""); // 重命名输入框的值
const isHoveringWithCtrl = ref(false); // 是否Ctrl+悬停状态

// --- 获取输入端口列表 ---
const inputPorts = computed(() => {
	const ports = props.data?.ports?.input || {}; // 获取输入端口定义
	return Object.entries(ports); // 转为[key, value]数组
});

// --- 获取输出端口列表 ---
const outputPorts = computed(() => {
	const ports = props.data?.ports?.output || {}; // 获取输出端口定义
	return Object.entries(ports); // 转为[key, value]数组
});

// --- 检查是否正在重命名当前节点 ---
const isRenaming = computed(() => {
	return store.renaming.nodeId === props.id; // 比较重命名目标和自身ID
});

// --- 获取当前节点对象（用于读取error和tensorImage）---
const nodeData = computed(() => {
	return store.blueprint.nodes.find((n) => n.id === props.id) || null; // 从store中查找自身
});

// --- 是否有错误 ---
const hasError = computed(() => {
	return !!(nodeData.value && nodeData.value.error); // 节点存在且有error字段
});

// --- 是否有tensorImage ---
const hasTensorImage = computed(() => {
	return !!(nodeData.value && nodeData.value.tensorImage); // 节点存在且有tensorImage
});

// --- 根据节点opcode获取分类颜色 ---
const nodeColor = computed(() => {
	const nodeOpcode = props.data?.opcode; // 读取当前节点opcode
	if (!nodeOpcode) return "#8992eb"; // 没有opcode时回退默认色

	const categoryMap = store.registry.categories || {}; // 获取分类映射表
	const categoryList = Object.values(categoryMap); // 转为分类数组便于遍历
	const targetCategory = categoryList.find((category) => (category?.nodes || []).includes(nodeOpcode)); // 查找包含当前opcode的分类
	if (!targetCategory?.color) return "#8992eb"; // 没有分类颜色时回退默认色
	return targetCategory.color; // 返回分类颜色
});

// --- 节点被单击 ---
const onClick = (event) => {
	if (event.ctrlKey || event.metaKey) {
		// 按住Ctrl键
		Node.toggleSelect(props.id); // 切换选中状态
	} else {
		Node.clearSelect(); // 清空所有选中
		Node.select(props.id); // 选中当前节点
	}

	// --- 如果当前节点不是菜单绑定的节点，就关闭菜单 ---
	if (store.nodeContext.nodeId !== props.id) {
		Node.closeContextMenu();
	}
};

// --- 节点被右键点击 ---
const onContextMenu = (event) => {
	event.preventDefault(); // 阻止浏览器默认右键菜单
	event.stopPropagation(); // 阻止事件冒泡

	Node.select(props.id); // 选中当前节点
	Node.openContextMenu(props.id); // 打开当前节点菜单
};

// --- 节点被双击 ---
const onDoubleClick = () => {
	Node.select(props.id); // 选中当前节点
	store.renaming.nodeId = props.id; // 设置重命名目标
	store.renaming.original = props.data.label; // 记录原始名称
};

// --- 确认重命名 ---
const confirmRename = () => {
	const value = renameValue.value.trim(); // 获取并去除空格
	const finalValue = value || store.renaming.original; // 为空则恢复原名
	Node.rename(props.id, finalValue); // 执行重命名
	store.renaming.nodeId = null; // 清除重命名状态
};

// --- 取消重命名 ---
const cancelRename = () => {
	Node.rename(props.id, store.renaming.original); // 恢复原名称
	store.renaming.nodeId = null; // 清除重命名状态
};

// --- 重命名输入框按键处理 ---
const onRenameKeydown = (event) => {
	if (event.key === "Enter") confirmRename(); // 回车确认
	if (event.key === "Escape") cancelRename(); // Esc取消
};

// --- 鼠标进入节点（检测Ctrl悬停）---
const onMouseEnter = (event) => {
	if (event.ctrlKey && hasTensorImage.value) {
		// Ctrl按下且有tensorImage
		isHoveringWithCtrl.value = true; // 显示tensor图
	}
};

// --- 鼠标离开节点 ---
const onMouseLeave = () => {
	isHoveringWithCtrl.value = false; // 隐藏tensor图
};

// --- 鼠标在节点上移动（检测Ctrl状态变化）---
const onMouseMove = (event) => {
	if (event.ctrlKey && hasTensorImage.value) {
		// Ctrl按下且有tensorImage
		isHoveringWithCtrl.value = true; // 显示tensor图
	} else {
		isHoveringWithCtrl.value = false; // 隐藏tensor图
	}
};

// --- 监听重命名状态，自动聚焦输入框 ---
watch(isRenaming, (newVal) => {
	if (newVal) {
		// 进入重命名模式
		renameValue.value = props.data.label; // 填入当前名称
		nextTick(() => {
			if (renameInput.value) renameInput.value.focus(); // 自动聚焦输入框
		});
	}
});
</script>

<template>
	<div
		class="custom-node"
		:class="{ selected: selected }"
		:style="{ '--node-color': nodeColor }"
		@click="onClick"
		@contextmenu="onContextMenu"
		@dblclick="onDoubleClick"
		@mouseenter="onMouseEnter"
		@mouseleave="onMouseLeave"
		@mousemove="onMouseMove">
		<!-- 节点主容器 -->

		<!-- 警告图标（节点有error时显示在正上方）-->
		<div v-if="hasError" class="warning-icon" :title="nodeData.error">
			<img src="@/assets/warning.svg" alt="warning" class="warning-img" />
			<!-- 警告图标 -->
			<div class="warning-tooltip">{{ nodeData.error }}</div>
			<!-- 悬停时显示错误内容 -->
		</div>

		<!-- 输入端口组 -->
		<div class="ports input-ports">
			<!-- 左侧输入端口区域 -->
			<Port v-for="[key, label] in inputPorts" :key="key" :portKey="key" :portLabel="label" type="target" position="left" :nodeId="id" />
			<!-- 渲染每个输入端口 -->
		</div>

		<!-- 节点名称 -->
		<div class="node-label">
			<!-- 节点名称区域 -->
			<input
				v-if="isRenaming"
				ref="renameInput"
				class="rename-input"
				:value="renameValue"
				@input="renameValue = $event.target.value"
				@blur="confirmRename"
				@keydown="onRenameKeydown" />
			<!-- 重命名输入框 -->
			<span v-else class="label-text">{{ data.label }}</span>
			<!-- 正常显示名称 -->
		</div>

		<!-- 输出端口组 -->
		<div class="ports output-ports">
			<!-- 右侧输出端口区域 -->
			<Port v-for="[key, label] in outputPorts" :key="key" :portKey="key" :portLabel="label" type="source" position="right" :nodeId="id" />
			<!-- 渲染每个输出端口 -->
		</div>

		<!-- 张量可视化图（Ctrl+悬停时显示在节点正右方）-->
		<div v-if="isHoveringWithCtrl && hasTensorImage" class="tensor-tooltip">
			<img :src="nodeData.tensorImage" alt="tensor" class="tensor-image" />
			<!-- 显示tensor图 -->
		</div>
	</div>
</template>

<style scoped>
.custom-node {
	display: flex;
	/* 横向排列：输入端口 | 名称 | 输出端口 */
	flex-direction: row;
	/* 横向布局 */
	align-items: center;
	/* 垂直居中 */
	width: fit-content;
	/* 自适应宽度 */
	flex-wrap: nowrap;
	/* 不换行 */
	border-radius: 12px;
	/* 圆角 */
	background-color: var(--node-color, #8992eb);
	/* 节点背景色：优先分类色，回退默认色 */
	padding: 12px 10px;
	/* 内边距 */
	gap: 40px;
	/* 端口组与名称间距 */
	cursor: grab;
	/* 抓取光标 */
	outline: #ffffff;
	/* 白色描边预设 */
	transition:
		opacity 0.2s,
		filter 0.2s,
		outline 0.2s,
		scale 0.2s;
	/* 过渡动画 */
	position: relative;
	/* 相对定位，用于悬浮元素 */
	user-select: none;
	/* 禁止文字选中 */
	transform-origin: center center; /* 变换原点 */
}

.custom-node:active {
	cursor: grabbing;
	/* 拖拽中光标 */
}

.custom-node:hover {
	filter: brightness(1.1);
	/* 悬停时提亮 */
}

.custom-node:hover:active {
	scale: 0.98;
	/* 按住时轻微缩小 */
}

.custom-node.selected {
	outline: 3px solid #ffffff;
	/* 选中时白色描边 */
	filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 15px #ffffff) brightness(1.1);
	/* 选中发光效果 */
}

.ports {
	display: flex;
	/* 纵向排列端口 */
	flex-direction: column;
	/* 垂直布局 */
	align-items: center;
	/* 水平居中 */
	gap: 16px;
	/* 端口间距 */
}

.input-ports {
	align-items: flex-start;
	/* 输入端口靠左 */
}

.output-ports {
	align-items: flex-end;
	/* 输出端口靠右 */
}

.node-label {
	display: flex;
	/* 居中对齐 */
	align-items: center;
	/* 垂直居中 */
	justify-content: center;
	/* 水平居中 */
	width: fit-content;
	/* 自适应宽度 */
}

.label-text {
	font-size: 18px;
	/* 名称字号 */
	color: #ffffff;
	/* 白色文字 */
	word-break: keep-all;
	/* 保持单词完整 */
	white-space: nowrap;
	/* 不换行 */
}

.rename-input {
	field-sizing: content;
	/* 宽度自动，根据内容长度而变化 */
	padding: 2px 4px;
	/* 内边距 */
	background: rgba(255, 255, 255, 0.2);
	/* 半透明白色背景 */
	border: 1px solid #ffffff;
	/* 白色边框 */
	border-radius: 6px;
	/* 圆角 */
	color: #ffffff;
	/* 白色文字 */
	font-size: 16px;
	/* 字号 */
	outline: none;
	/* 去除聚焦边框 */
	text-align: center;
	/* 文字居中 */
}

.warning-icon {
	position: absolute;
	/* 绝对定位 */
	top: -28px;
	/* 在节点正上方 */
	left: 50%;
	/* 水平居中 */
	transform: translateX(-50%);
	/* 精确居中 */
	cursor: pointer;
	/* 鼠标指针 */
}

.warning-img {
	width: 20px;
	/* 图标宽度 */
	height: 20px;
	/* 图标高度 */
}

.warning-tooltip {
	display: none;
	/* 默认隐藏 */
	position: absolute;
	/* 绝对定位 */
	bottom: 100%;
	/* 在图标上方 */
	left: 50%;
	/* 水平居中 */
	transform: translateX(-50%);
	/* 精确居中 */
	background: #e74c3c;
	/* 红色错误提示背景 */
	color: #ffffff;
	/* 白色文字 */
	padding: 4px 8px;
	/* 内边距 */
	border-radius: 4px;
	/* 圆角 */
	font-size: 12px;
	/* 字号 */
	white-space: nowrap;
	/* 不换行 */
	margin-bottom: 4px;
	/* 与图标间距 */
}

.warning-icon:hover .warning-tooltip {
	display: block;
	/* 悬停时显示 */
}

.tensor-tooltip {
	position: absolute;
	/* 绝对定位 */
	left: calc(100% + 10px);
	/* 在节点正右方 */
	top: 50%;
	/* 垂直居中 */
	transform: translateY(-50%);
	/* 精确居中 */
	background: #ffffff;
	/* 白色背景 */
	border: 1px solid #d0d0d0;
	/* 浅色边框 */
	border-radius: 6px;
	/* 圆角 */
	padding: 4px;
	/* 内边距 */
	z-index: 100;
	/* 层级 */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	/* 阴影 */
}

.tensor-image {
	max-width: 200px;
	/* 最大宽度 */
	max-height: 200px;
	/* 最大高度 */
	display: block;
	/* 块级显示 */
}
</style>
