<script setup>
import { ref, watch } from "vue"; // 引入Vue组合式API
import Node from "@/commands/Node.js"; // 引入节点命令

const props = defineProps({
	// 接收父组件传入的属性
	paramKey: { type: String, required: true }, // 参数标识
	param: { type: Object, required: true }, // 参数完整对象
	nodeId: { type: String, required: true }, // 所属节点ID
});

const currentValue = ref(props.param.value); // 当前开关值

// --- 开关切换时更新节点参数 ---
const onChange = (value) => {
	currentValue.value = value; // 更新本地值
	Node.updateParam(props.nodeId, props.paramKey, value); // 同步到节点数据
};

// --- 监听外部参数变化（撤销重做时同步）---
watch(
	() => props.param.value,
	(newVal) => {
		currentValue.value = newVal; // 外部变化时同步本地值
	},
);
</script>

<template>
	<div class="bool-switch">
		<!-- 布尔开关容器 -->
		<label class="switch-label">{{ param.label }}</label>
		<!-- 参数名称标签 -->
		<var-switch :model-value="currentValue" @update:model-value="onChange" />
		<!-- Varlet开关组件 -->
	</div>
</template>

<style scoped>
.bool-switch {
	display: flex;
	/* 横向排列 */
	align-items: center;
	/* 垂直居中 */
	justify-content: space-between;
	/* 两端对齐 */
	padding: 16px 4px;
}

.switch-label {
	font-size: 16px;
	/* 标签字号 */
	color: var(--color-primary);
	/* 灰色标签 */
}
</style>
