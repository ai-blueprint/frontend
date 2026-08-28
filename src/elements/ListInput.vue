<script setup>
import { ref, computed, watch } from "vue"; // 引入Vue组合式API
import store from "@/store.js"; // 引入全局状态
import Node from "@/commands/Node.js"; // 引入节点命令
import { getVariablesMap } from "@/utils/expression.js"; // 引入变量表构建工具
import { isExpressionValue, formatParamValue, parseParamText, getResolvedPreview } from "@/utils/paramValue.js"; // 引入参数文本互转工具

const props = defineProps({
	// 接收父组件传入的属性
	paramKey: { type: String, required: true }, // 参数标识
	param: { type: Object, required: true }, // 参数完整对象
	nodeId: { type: String, required: true }, // 所属节点ID
});

const displayText = ref(formatParamValue(props.param.value)); // 显示用的字符串值

// --- 当前变量表，供表达式实时预览 ---
const variables = computed(() => {
	try {
		return getVariablesMap(store.blueprint.variables); // 名称冲突等异常时预览显示错误
	} catch {
		return {}; // 变量表异常不阻塞输入
	}
});

// --- 表达式展开预览与错误 ---
const preview = computed(() => getResolvedPreview(props.param.value, variables.value)); // 普通列表返回空预览

// --- 输入值变化时更新节点参数 ---
const onChange = (value) => {
	displayText.value = value; // 更新显示值
	const parsed = parseParamText(value, "list"); // 纯数字列表保存为数组，含变量保存为表达式对象
	Node.updateParam(props.nodeId, props.paramKey, parsed.value); // 同步到节点数据
};

// --- 监听外部参数变化（撤销重做时同步）---
watch(
	() => props.param.value,
	(newVal) => {
		displayText.value = formatParamValue(newVal); // 外部变化时同步显示值
	},
);
</script>

<template>
	<div class="list-input">
		<!-- 列表或变量表达式输入容器 -->
		<var-input variant="outlined" :model-value="displayText" :placeholder="param.label" @update:model-value="onChange" />
		<!-- Varlet文本输入框 -->
		<div v-if="isExpressionValue(param.value) && preview.text" class="expr-preview">{{ preview.text }}</div>
		<!-- 表达式展开预览 -->
		<div v-if="preview.error" class="expr-error">{{ preview.error }}</div>
		<!-- 表达式解析错误 -->
	</div>
</template>

<style scoped>
.list-input {
	margin-bottom: 8px;
	/* 底部间距 */
}

.expr-preview {
	font-size: 12px;
	/* 预览字号 */
	color: #8992eb;
	/* 主题色显示展开结果 */
	padding: 2px 4px;
}

.expr-error {
	font-size: 12px;
	/* 错误字号 */
	color: #e44d60;
	/* 红色显示解析错误 */
	padding: 2px 4px;
}
</style>
