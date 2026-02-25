<script setup>
import { markRaw, nextTick } from "vue"; // 引入markRaw和nextTick
import { VueFlow, useVueFlow } from "@vue-flow/core"; // 引入vueflow核心
import "@vue-flow/core/dist/style.css"; // 引入默认主题样式
import "@vue-flow/core/dist/theme-default.css";
import store from "@/store.js"; // 引入全局状态
import Node from "@/commands/Node.js"; // 引入节点命令
import Edge from "@/commands/Edge.js"; // 引入连接线命令
import Blueprint from "@/commands/Blueprint.js"; // 引入蓝图命令
import CustomNode from "@/components/Node.vue"; // 引入自定义节点组件
import ToolBar from "@/components/ToolBar.vue"; // 引入工具栏组件
import NodeMenu from "@/components/NodeMenu.vue"; // 引入节点菜单组件
import NodePanel from "@/components/NodePanel.vue"; // 引入节点面板组件

// --- 用markRaw标记组件，避免被reactive包裹导致性能警告 ---
const nodeTypes = { baseNode: markRaw(CustomNode) }; // 节点类型映射

// --- 初始化vueflow实例 ---
const { onConnect, onPaneClick, onViewportChange, screenToFlowCoordinate, updateEdge, addEdges } = useVueFlow(); // 获取vueflow钩子

// --- 在组件挂载后设置vueflow实例到蓝图命令中 ---
const onPaneReady = (instance) => Blueprint.setFlowInstance(instance);

// --- 连接线创建时的处理 ---
onConnect((params) => {
	const existingId = Edge.getByInputPort(params.target, params.targetHandle)?.id; // 记录旧边ID
	addEdges([params]); // 先让VueFlow添加新边
	if (existingId) nextTick(() => Edge.remove(existingId)); // 等VueFlow更新完再删旧边
});

// --- 连接线被拖拽重连时的处理 ---
const onEdgeUpdate = ({ edge, connection }) => {
	const existing = Edge.getByInputPort(connection.target, connection.targetHandle); // 检查目标端口是否已有连线
	if (existing && existing.id !== edge.id) Edge.remove(existing.id); // 有旧线且不是自己就删掉
	updateEdge(edge, connection); // 更新连接线端点
};

// --- 画布空白处被点击 ---
onPaneClick((event) => {
	if (!event.ctrlKey && !event.metaKey) Node.clearSelect();
	store.nodeContext.visible = false; // 隐藏节点菜单
	store.nodeContext.visible = false; // 隐藏节点面板
});

// --- 视口变化时同步到store ---
onViewportChange((viewport) => (store.viewport = viewport));

// --- 接收拖入事件 ---
const onDragOver = (event) => {
	event.preventDefault(); // 允许放置
	event.dataTransfer.dropEffect = "move"; // 设置拖拽效果
};

// --- 放置事件：创建节点 ---
const onDrop = (event) => {
	event.preventDefault(); // 阻止默认行为
	const opcode = event.dataTransfer.getData("application/opcode"); // 获取拖入的节点opcode
	if (!opcode) return; // 没有opcode直接返回

	const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY }); // 将屏幕坐标转为画布坐标
	Node.add(opcode, position.x, position.y); // 在画布对应位置创建节点
};

const onContextMenu = (event) => {
	event.preventDefault(); // 阻止浏览器默认右键菜单
};
</script>

<template>
	<div class="blueprint" @dragover="onDragOver" @drop="onDrop">
		<!-- 蓝图区域容器 -->
		<VueFlow
			v-model:nodes="store.blueprint.nodes"
			v-model:edges="store.blueprint.edges"
			v-model:viewport="store.viewport"
			selection-mode="partial"
			:node-types="nodeTypes"
			:is-valid-connection="Edge.checkConnection"
			:min-zoom="0.5"
			:max-zoom="2"
			edges-updatable
			fit-view-on-init
			@pane-ready="onPaneReady"
			@edge-update="onEdgeUpdate"
			@contextmenu="onContextMenu">
			<!-- VueFlow画布 -->
		</VueFlow>

		<ToolBar />
		<!-- 底部工具栏 -->
		<NodeMenu />
		<!-- 节点右键菜单 -->
		<NodePanel />
		<!-- 节点参数面板 -->
	</div>
</template>

<style scoped>
.blueprint {
	flex: 1;
	/* 占满剩余空间 */
	position: relative;
	/* 相对定位，用于悬浮元素 */
	overflow: hidden;
	/* 隐藏溢出 */
	cursor: grab;
	/* 默认抓取光标 */
	transform-origin: 0 0;
	/* 变换原点在左上角 */
}

.blueprint:active {
	cursor: grabbing;
	/* 拖动时的光标样式 */
}
</style>
