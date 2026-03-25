<script setup>
import { ref, watch } from "vue"; // 引入Vue组合式API
import Node from "@/commands/Node.js"; // 引入节点命令

const props = defineProps({
	// 接收父组件传入的属性
	paramKey: { type: String, required: true }, // 参数标识
	param: { type: Object, required: true }, // 参数完整对象
	nodeId: { type: String, required: true }, // 所属节点ID
});

// --- 将数组转为逗号分隔的字符串显示 ---
const arrayToString = (arr) => {
	if (Array.isArray(arr)) return arr.join(", "); // 数组转字符串
	return String(arr || ""); // 非数组直接转字符串
};

// --- 将逗号分隔的字符串转回数组 ---
const stringToArray = (str) => {
	if (!str || !str.trim()) return []; // 空字符串返回空数组
	return str.split(",").map((item) => {
		// 按逗号分割
		const trimmed = item.trim(); // 去除空格
		const num = Number(trimmed); // 尝试转数字
		return isNaN(num) ? trimmed : num; // 能转数字就转，否则保留字符串
	});
};

const displayValue = ref(arrayToString(props.param.value)); // 显示用的字符串值

// --- 输入值变化时更新节点参数 ---
const onChange = (value) => {
	displayValue.value = value; // 更新显示值
	const arrayValue = stringToArray(value); // 转为数组
	Node.updateParam(props.nodeId, props.paramKey, arrayValue); // 同步到节点数据
};

// --- 监听外部参数变化（撤销重做时同步）---
watch(
	() => props.param.value,
	(newVal) => {
		displayValue.value = arrayToString(newVal); // 外部变化时同步显示值
	},
);
</script>

<template>
	<div class="list-input">
		<!-- 列表输入容器 -->
		<var-input variant="outlined" :model-value="displayValue" :placeholder="param.label" @update:model-value="onChange" />
		<!-- Varlet文本输入框 -->
	</div>
</template>

<style scoped>
.list-input {
	margin-bottom: 8px;
	/* 底部间距 */
}
</style>
