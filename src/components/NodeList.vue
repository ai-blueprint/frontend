<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue"; // 引入Vue能力
import store from "@/store.js"; // 引入全局状态管理

const nodeListRef = ref(null); // 节点列表容器引用
const isAutoScrolling = ref(false); // 是否处于自动滚动中
const isScrollSyncUpdating = ref(false); // 是否由滚动同步触发分类更新

// 计算属性：自动同步 store 中的注册表数据
const registryList = computed(() => store.registry);

// --- 取分类键列表 ---
const categoryKeys = computed(() => Object.keys(registryList.value.categories || {})); // 分类键数组

// --- 取当前所有分类分组元素 ---
const getGroupElements = () => {
	if (!nodeListRef.value) return []; // 容器不存在直接返回
	return Array.from(nodeListRef.value.querySelectorAll(".node-group")); // 获取所有分组元素
};

// --- 自动滚动到指定分类 ---
const scrollToCategory = async (categoryKey) => {
	if (!categoryKey || !nodeListRef.value) return; // 参数无效直接返回

	await nextTick(); // 等待DOM更新完成
	const targetElement = nodeListRef.value.querySelector(`.node-group[data-category="${categoryKey}"]`); // 查询目标分组
	if (!targetElement) return; // 未找到目标分组直接返回

	isAutoScrolling.value = true; // 标记自动滚动开始
	targetElement.scrollIntoView({ behavior: "auto", block: "start" }); // 直接滚动到目标分组，避免中途卡住
	requestAnimationFrame(() => {
		isAutoScrolling.value = false; // 下一帧恢复滚动监听
	});
};

// --- 根据当前滚动位置更新激活分类 ---
const updateCategoryByScroll = () => {
	if (!nodeListRef.value || isAutoScrolling.value) return; // 自动滚动期间不回写激活

	const groupElements = getGroupElements(); // 获取全部分组元素
	if (!groupElements.length) return; // 无分组直接返回

	const containerTop = nodeListRef.value.getBoundingClientRect().top; // 容器顶部位置
	let bestCategoryKey = groupElements[0].dataset.category || ""; // 默认第一组
	let minOffset = Number.POSITIVE_INFINITY; // 最小偏移初始值

	groupElements.forEach((groupElement) => {
		const groupTop = groupElement.getBoundingClientRect().top; // 分组顶部位置
		const offsetValue = Math.abs(groupTop - containerTop); // 与容器顶部的距离
		if (offsetValue >= minOffset) return; // 非更优结果直接跳过
		minOffset = offsetValue; // 更新最小偏移
		bestCategoryKey = groupElement.dataset.category || bestCategoryKey; // 更新当前最佳分类
	});

	if (!bestCategoryKey || store.selected.category === bestCategoryKey) return; // 激活不变就不写入
	isScrollSyncUpdating.value = true; // 标记本次更新来自列表滚动
	store.selected.category = bestCategoryKey; // 回写当前激活分类
	requestAnimationFrame(() => {
		isScrollSyncUpdating.value = false; // 下一帧清除滚动同步标记
	});
};

// --- 滚动事件 ---
const onListScroll = () => {
	updateCategoryByScroll(); // 由滚动驱动分类激活
};

// 根据分类键获取该分类下的所有节点
const groupNodes = (categoryKey) => {
	const category = registryList.value.categories?.[categoryKey];
	if (!category) return [];

	return (category.nodes || [])
		.map((opcode) => {
			const def = registryList.value.nodes?.[opcode];
			return def ? { opcode, label: def.label, description: def.description || "" } : null;
		})
		.filter(Boolean); // 过滤掉无效节点
};

// 拖拽开始事件处理
const onDragStart = (event, opcode) => {
	event.dataTransfer.setData("application/opcode", opcode); // 传递节点数据
	event.dataTransfer.effectAllowed = "move"; // 设置为移动操作
};

// --- 监听分类切换并驱动自动滚动 ---
watch(
	() => store.selected.category,
	(categoryKey) => {
		if (isScrollSyncUpdating.value) return; // 滚动同步触发时不反向滚动
		scrollToCategory(categoryKey); // 点击分类栏后滚动到目标分组
	},
);

// --- 初始化默认激活分类 ---
onMounted(() => {
	if (store.selected.category) return; // 已有分类时不覆盖
	const firstCategoryKey = categoryKeys.value[0]; // 取第一项分类键
	if (!firstCategoryKey) return; // 无分类直接返回
	store.selected.category = firstCategoryKey; // 设置默认激活分类
});
</script>

<template>
	<div ref="nodeListRef" class="node-list" @scroll="onListScroll">
		<!-- 遍历所有分类 -->
		<div v-for="(category, key) in registryList.categories" :key="key" class="node-group" :data-category="key">
			<div class="group-name">{{ category.label }}</div>
			<!-- 分类标题 -->

			<!-- 遍历分类下的节点 -->
			<var-tooltip v-for="node in groupNodes(key)" :key="node.opcode" class="node-tooltip" :content="node.description" placement="right" :disabled="!node.description">
				<div class="node-item" draggable="true" @dragstart="onDragStart($event, node.opcode)" :style="{ '--node-color': category.color }">
					<span class="node-name">{{ node.label }}</span>
					<!-- 节点名称 -->
				</div>
			</var-tooltip>
		</div>
	</div>
</template>

<style scoped>
/* 列表容器 */
.node-list {
	user-select: none;
	width: 30%;
	min-width: 180px;
	max-width: 200px;
	height: 100%;
	background-color: #eaeffc;
	padding: 10px;
	overflow-y: auto;
	overflow-x: hidden;
	direction: rtl; /* 滚动条置左 */
}

/* 滚动条样式 */
.node-list::-webkit-scrollbar {
	width: 6px;
}
.node-list::-webkit-scrollbar-track {
	background: transparent;
}
.node-list::-webkit-scrollbar-thumb {
	background: #aaaaaa;
	border-radius: 3px;
}
.node-list::-webkit-scrollbar-thumb:hover {
	background: #8992eb;
}

/* 分类组 */
.node-group {
	display: flex;
	flex-direction: column;
	margin-bottom: 30px;
	gap: 18px;
	direction: ltr; /* 恢复文字方向 */
}

/* Tooltip 触发容器（防止在 flex 列布局下被拉伸到整行宽） */
.node-tooltip {
	align-self: flex-start;
	display: inline-block;
}

/* 分类标题 */
.group-name {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 8px;
}

/* 节点卡片 */
.node-item {
	display: flex;
	align-items: center;
	justify-content: center;
	width: fit-content;
	padding: 12px 20px;
	border-radius: 12px;
	background-color: var(--node-color);
	cursor: grab;
	transition:
		opacity 0.2s,
		transform 0.1s;
}

.node-item:hover {
	opacity: 0.9;
}

.node-item:active {
	cursor: grabbing;
	transform: scale(0.98);
}

/* 节点文字 */
.node-name {
	font-size: 18px;
	color: #fff;
	white-space: nowrap;
}
</style>
