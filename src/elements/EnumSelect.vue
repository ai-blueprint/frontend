<script setup>
import { ref, computed, watch } from "vue"; // 引入Vue组合式API
import Node from "@/commands/Node.js"; // 引入节点命令

const props = defineProps({
	// 接收父组件传入的属性
	paramKey: { type: String, required: true }, // 参数标识
	param: { type: Object, required: true }, // 参数完整对象
	nodeId: { type: String, required: true }, // 所属节点ID
});

const currentValue = ref(props.param.value); // 当前选中值

// --- 将options对象转为选项数组 ---
const optionList = computed(() => {
	const options = props.param.options || {}; // 获取枚举选项
	return Object.keys(options).map((key) => ({
		// 遍历选项
		value: key, // 选项值
		label: options[key], // 选项显示名
	}));
});

// --- 选择变化时更新节点参数 ---
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
	<div class="enum-select">
		<!-- 枚举选择容器 -->
		<var-select variant="outlined" :model-value="currentValue" :placeholder="param.label" @update:model-value="onChange">
			<!-- Varlet下拉选择组件 -->
			<var-option v-for="option in optionList" :key="option.value" :label="option.label" :value="option.value" />
			<!-- 枚举选项 -->
		</var-select>
	</div>
</template>

<style scoped>
.enum-select {
	margin-bottom: 8px;
	/* 底部间距 */
}
</style>
