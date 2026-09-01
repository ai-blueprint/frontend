<script setup>
import { ref, computed, nextTick, watch } from "vue"; // 引入Vue组合式API
import store from "@/store.js"; // 引入全局状态
import Node from "@/commands/Node.js"; // 引入节点命令
import Port from "@/components/Port.vue"; // 引入端口组件
import NodePreview from "@/components/NodePreview.vue"; // 引入节点数据流图形
import TensorResult from "@/components/TensorResult.vue"; // 引入节点下方张量热力图
import { deriveNodeInputs } from "@/utils/nodeInputs.js"; // 使用已有输出和蓝图连线在前端还原节点输入

const props = defineProps({
	// 接收vueflow传入的节点属性
	id: { type: String, required: true }, // 节点ID
	data: { type: Object, required: true }, // 节点数据
	selected: { type: Boolean, default: false }, // 是否选中
});

const renameInput = ref(null); // 重命名输入框的引用
const renameValue = ref(""); // 重命名输入框的值

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

// --- 组合当前节点的真实输入和输出，仅用于前端展示 ---
const nodeResult = computed(() => {
	const result = store.runtime.execution.nodeResults[props.id]; // 后端继续只返回当前节点的输出
	if (!result) return null; // 节点尚未运行时使用静态轮廓
	const inputs = deriveNodeInputs(props.id, store.blueprint.edges, store.runtime.execution.nodeResults, result._requestId); // 只使用同一轮上游输出推导输入
	return { ...result, inputs }; // 不修改协议数据和全局运行结果
});

// --- 获取训练模式下当前节点的参数梯度 ---
const parameterGradients = computed(() => {
	if (!store.runtime.training.nodes[props.id]) return []; // 没有可学习参数时不显示训练图
	return (store.runtime.training.nodes[props.id].parameters || []).filter((parameter) => parameter.nodeId === props.id); // 再按参数归属过滤，防止错误快照显示到其他节点
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
	<div class="node-visualizer">
		<div
			class="custom-node"
			:class="{ selected: selected }"
			:style="{ '--node-color': nodeColor }"
			@click="onClick"
			@contextmenu="onContextMenu"
			@dblclick="onDoubleClick">
		<!-- 节点主容器 -->
		<div class="node-header" :style="{ backgroundColor: nodeColor }">
			<span class="header-dot"></span>
			<input
				v-if="isRenaming"
				ref="renameInput"
				class="rename-input nodrag"
				:value="renameValue"
				@input="renameValue = $event.target.value"
				@blur="confirmRename"
				@keydown="onRenameKeydown" />
			<span v-else class="header-name">{{ data.label }}</span>
			<span v-if="data.technicalLabel && data.technicalLabel !== data.label" class="header-type">{{ data.technicalLabel }}</span>
		</div>

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
			<NodePreview :opcode="data.opcode" :params="data.params" :result="store.experiment.showTensor ? nodeResult : null" :style="{ '--node-color': nodeColor }" />
		</div>

		<!-- 输出端口组 -->
		<div class="ports output-ports">
			<!-- 右侧输出端口区域 -->
			<Port v-for="[key, label] in outputPorts" :key="key" :portKey="key" :portLabel="label" type="source" position="right" :nodeId="id" />
			<!-- 渲染每个输出端口 -->
		</div>

		</div>

		<div v-if="store.experiment.showTensor && store.runtime.training.status === 'succeeded' && parameterGradients.length" class="node-gradients nodrag nowheel">
			<div class="gradient-title">梯度</div>
			<div v-for="parameter in parameterGradients" :key="parameter.name" class="parameter-gradient">
				<div class="parameter-name">{{ parameter.name }}</div>
				<TensorResult :value="parameter.gradient" :max-width="180" :max-height="130" />
			</div>
		</div>
	</div>
</template>

<style scoped>
.node-visualizer {
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 180px;
	gap: 8px;
}

.node-gradients {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
}

.gradient-title {
	color: #8992eb;
	font-size: 11px;
	font-weight: 600;
}

.parameter-gradient {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
}

.parameter-name {
	max-width: 180px;
	color: #7f89b2;
	font-size: 10px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.custom-node {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 238px;
	min-height: 94px;
	flex-wrap: nowrap;
	padding: 25px 8px 8px;
	gap: 6px;
	cursor: grab;
	outline: none;
	transition:
		opacity 0.2s,
		filter 0.2s,
		outline 0.2s,
		scale 0.2s;
	position: relative;
	user-select: none;
	transform-origin: center center;
	background: transparent;
	border: 0;
	border-radius: 0;
	box-shadow: none;
}

.custom-node:active {
	cursor: grabbing;
	/* 拖拽中光标 */
}

.custom-node:hover {
	filter: brightness(1.08);
}

.custom-node:hover:active {
	scale: 0.98;
	/* 按住时轻微缩小 */
}

.custom-node.selected {
	filter: drop-shadow(0 0 4px color-mix(in srgb, var(--node-color) 80%, transparent)) drop-shadow(0 0 14px color-mix(in srgb, var(--node-color) 45%, transparent)) brightness(1.08);
}

.node-header {
	position: absolute;
	top: 0;
	left: 50%;
	right: auto;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	gap: 7px;
	height: 21px;
	padding: 0 9px;
	border-radius: 999px;
	color: #fff;
}

.header-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.85);
}

.header-type {
	margin-left: auto;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 9px;
	letter-spacing: 0;
	opacity: 0.9;
}

.header-name {
	min-width: 0;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.ports {
	display: flex;
	/* 纵向排列端口 */
	flex-direction: column;
	/* 垂直布局 */
	align-items: center;
	/* 水平居中 */
	gap: 18px;
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
	flex-direction: column;
	gap: 0;
	align-items: center;
	/* 垂直居中 */
	justify-content: center;
	/* 水平居中 */
	width: 100%;
	min-width: 0;
}

.rename-input {
	width: 112px;
	min-width: 0;
	padding: 1px 4px;
	background: #292d35;
	border: 1px solid rgba(255, 255, 255, 0.7);
	border-radius: 3px;
	color: #fff;
	font-size: 11px;
	outline: none;
	text-align: left;
}

.warning-icon {
	position: absolute;
	/* 绝对定位 */
	top: -38px;
	/* 在节点正上方 */
	left: 50%;
	/* 水平居中 */
	transform: translateX(-50%);
	/* 精确居中 */
	cursor: pointer;
	/* 鼠标指针 */
}

.warning-img {
	width: 30px;
	/* 图标宽度 */
	height: 30px;
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

</style>
