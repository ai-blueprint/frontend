<script setup>
import { ref, watch } from "vue"; // 引入Vue组合式API
import Node from "@/commands/Node.js"; // 引入节点命令

const props = defineProps({
	// 接收父组件传入的属性
	paramKey: { type: String, required: true }, // 参数标识
	param: { type: Object, required: true }, // 参数完整对象
	nodeId: { type: String, required: true }, // 所属节点ID
});

const currentValue = ref(props.param.value); // 当前输入值
const hasRange = !!(props.param.range && props.param.range.length === 2); // 是否有范围限制
const minValue = hasRange ? props.param.range[0] : null; // 最小值
const maxValue = hasRange ? props.param.range[1] : null; // 最大值

// --- 输入值变化时更新节点参数 ---
const onChange = (value) => {
	let parsed = parseFloat(value); // 将输入转为浮点数
	if (isNaN(parsed)) parsed = 0; // 非数字默认为0
	if (hasRange) {
		// 有范围限制时钳制值
		if (parsed < minValue) parsed = minValue; // 不能低于最小值
		if (parsed > maxValue) parsed = maxValue; // 不能超过最大值
	}
	currentValue.value = parsed; // 更新本地值
	Node.updateParam(props.nodeId, props.paramKey, parsed); // 同步到节点数据
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
	<div class="float-input">
		<!-- 浮点数输入容器 -->
		<var-input type="number" step="0.01" :model-value="String(currentValue)" :placeholder="param.label" @update:model-value="onChange" />
		<!-- Varlet数字输入框 -->
	</div>
</template>

<style scoped>
.float-input {
	margin-bottom: 8px;
	/* 底部间距 */
}
</style>
