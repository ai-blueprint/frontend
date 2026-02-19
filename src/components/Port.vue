<script setup>
import { nextTick } from "vue"; // 引入nextTick等待DOM更新
import { Handle } from "@vue-flow/core"; // 引入vueflow端口组件
import Edge from "@/commands/Edge.js"; // 引入连接线命令

const props = defineProps({
	// 接收父组件传入的属性
	portKey: { type: String, required: true }, // 端口标识
	portLabel: { type: String, default: "" }, // 端口显示名称
	type: { type: String, required: true }, // 端口类型：source或target
	position: { type: String, required: true }, // 端口位置：left或right
	nodeId: { type: String, required: true }, // 所属节点ID
});

// --- 输入端口被按下时，检查是否需要拔线重连 ---
const onPointerDown = (event) => {
	if (props.type !== "target") return; // 只处理输入端口
	if (!event.target.classList.contains("port-handle")) return; // 只处理点击在端口圆点上的事件

	const existingEdge = Edge.getByInputPort(props.nodeId, props.portKey); // 检查该输入端口是否已有连线
	if (!existingEdge) return; // 没有连线就让VueFlow正常处理新建连接

	event.stopPropagation(); // 阻止VueFlow从此输入端口发起连接
	event.preventDefault(); // 阻止默认行为

	// --- 记录原输出端口信息 ---
	const sourceNodeId = existingEdge.source; // 原输出端口所在节点ID
	const sourcePortKey = existingEdge.sourceHandle; // 原输出端口标识

	Edge.remove(existingEdge.id); // 断开旧连接

	// --- 在DOM更新后，从原输出端口发起新连接到鼠标位置 ---
	nextTick(() => {
		const sourceHandle = document.querySelector(`.vue-flow__handle[data-handleid="${sourcePortKey}"][data-nodeid="${sourceNodeId}"]`); // 找到原输出端口的DOM元素
		if (!sourceHandle) return; // 找不到就放弃

		const pointerEvent = new PointerEvent("pointerdown", {
			// 构造模拟的指针按下事件
			bubbles: true, // 允许冒泡
			cancelable: true, // 允许取消
			clientX: event.clientX, // 使用原始鼠标X坐标
			clientY: event.clientY, // 使用原始鼠标Y坐标
			pointerId: event.pointerId, // 保持指针ID一致
			pointerType: event.pointerType, // 保持指针类型一致
		});
		sourceHandle.dispatchEvent(pointerEvent); // 触发输出端口的连接拖拽
	});
};
</script>

<template>
	<div class="port" :class="['port-' + position]" @pointerdown.capture="onPointerDown">
		<!-- 端口容器，捕获阶段拦截指针事件实现拔线 -->
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
	position: relative !important; /* 脱离绝对定位，参与flex布局 */
	top: auto !important; /* 清除VueFlow默认的top偏移 */
	left: auto !important; /* 清除VueFlow默认的left偏移 */
	right: auto !important; /* 清除VueFlow默认的right偏移 */
	transform: none !important; /* 清除VueFlow默认的居中偏移 */
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
