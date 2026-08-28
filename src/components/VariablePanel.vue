<script setup>
import { ref } from "vue"; // 引入Vue响应式引用
import store from "@/store.js"; // 引入全局状态
import Variable from "@/commands/Variable.js"; // 引入变量命令

const isExpanded = ref(false); // 变量面板默认折叠，需要时点击标题栏展开
const editingId = ref(null); // 正在编辑名称的变量ID
const editingName = ref(""); // 名称编辑框内容

// --- 新建变量 ---
const onAdd = () => {
	Variable.add(); // 使用自动名称和默认值创建
};

// --- 切换面板展开 ---
const onToggle = () => {
	isExpanded.value = !isExpanded.value; // 折叠时只显示标题栏
};

// --- 进入名称编辑 ---
const onStartRename = (variable) => {
	editingId.value = variable.id; // 绑定编辑目标
	editingName.value = variable.name; // 填入当前名称
};

// --- 确认名称编辑 ---
const onConfirmRename = () => {
	if (editingId.value) Variable.rename(editingId.value, editingName.value.trim()); // 非法或重名时命令层拒绝写入
	editingId.value = null; // 退出编辑状态
};

// --- 名称编辑按键处理 ---
const onRenameKeydown = (event) => {
	if (event.key === "Enter") onConfirmRename(); // 回车确认
	if (event.key === "Escape") editingId.value = null; // Esc放弃修改
};

// --- 将值文本写回变量 ---
const onValueChange = (variable, text) => {
	const trimmed = String(text).trim(); // 前后空白不参与解析
	if (!trimmed) return; // 空文本不写入，保持原值
	const parts = trimmed.split(",").map((item) => Number(item.trim())); // 支持"8"和"2, 4, 8"两种写法
	if (parts.some((item) => Number.isNaN(item))) return; // 非数字文本不写入
	Variable.updateValue(variable.id, parts.length === 1 ? parts[0] : parts); // 单值存数字，多值存列表
};

// --- 显示变量当前值 ---
const formatValue = (value) => (Array.isArray(value) ? value.join(", ") : String(value)); // 列表按逗号拼接

// --- 删除变量并提示引用影响 ---
const onRemove = (variable) => {
	const references = Variable.getReferences(variable.name); // 找出引用该变量的参数
	if (references.length && !window.confirm(`变量 ${variable.name} 正被 ${references.length} 处参数引用，删除后这些参数将无法解析。确认删除？`)) return; // 有引用时明确告知影响
	Variable.remove(variable.id); // 确认后从蓝图移除
};
</script>

<template>
	<div class="variable-panel">
		<!-- 变量面板容器 -->
		<div class="panel-header" data-drag-handle @click="onToggle">
			<span class="panel-title">变量</span>
			<!-- 面板标题 -->
			<button class="add-button" data-no-drag @click.stop="onAdd" title="新建变量">+</button>
			<!-- 新建变量按钮 -->
		</div>

		<div v-if="isExpanded" class="variable-list">
			<!-- 变量列表 -->
			<div v-for="variable in store.blueprint.variables" :key="variable.id" class="variable-item">
				<!-- 单个变量块 -->
				<input
					v-if="editingId === variable.id"
					class="name-edit"
					:value="editingName"
					@input="editingName = $event.target.value"
					@blur="onConfirmRename"
					@keydown="onRenameKeydown" />
				<!-- 名称编辑框 -->
				<span v-else class="variable-name" @dblclick="onStartRename(variable)" :title="'双击重命名'">{{ variable.name }}</span>
				<!-- 变量名称，双击重命名 -->
				<input class="value-edit" :value="formatValue(variable.value)" @change="onValueChange(variable, $event.target.value)" />
				<!-- 变量值输入框 -->
				<button class="remove-button" @click="onRemove(variable)" title="删除变量">×</button>
				<!-- 删除变量按钮 -->
			</div>

			<div v-if="!store.blueprint.variables.length" class="empty-hint">点击 + 创建变量，在参数框中直接使用，如 D 或 D*4</div>
			<!-- 空列表引导 -->
		</div>
	</div>
</template>

<style scoped>
.variable-panel {
	width: 220px;
	border-radius: 12px;
	background: #f6f9fe;
	box-shadow: 0 2px 12px rgba(111, 125, 176, 0.2);
	overflow: hidden;
	user-select: none;
}

.panel-header {
	display: flex;
	/* 标题和按钮两端排列 */
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px;
	background: #eaeffc;
	cursor: pointer;
}

.panel-title {
	font-size: 13px;
	font-weight: 600;
	color: rgb(111, 125, 176);
}

.add-button {
	width: 22px;
	height: 22px;
	border: none;
	border-radius: 6px;
	background: #8992eb;
	color: #ffffff;
	font-size: 15px;
	line-height: 1;
	cursor: pointer;
}

.add-button:hover {
	filter: brightness(1.1);
	/* 悬停提亮 */
}

.variable-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 10px;
	max-height: 220px;
	overflow-y: auto;
}

.variable-item {
	display: flex;
	/* 名称、值和删除横向排列 */
	align-items: center;
	gap: 6px;
}

.variable-name {
	flex: none;
	max-width: 80px;
	padding: 4px 10px;
	border-radius: 999px;
	background: #8992eb;
	/* 与编辑器控件统一使用紫蓝主题色 */
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: pointer;
}

.name-edit {
	flex: none;
	width: 80px;
	padding: 4px 8px;
	border: 1px solid #8992eb;
	border-radius: 999px;
	font-size: 13px;
	outline: none;
}

.value-edit {
	flex: 1;
	min-width: 0;
	padding: 4px 8px;
	border: 1px solid #dfe6f5;
	border-radius: 6px;
	font-size: 13px;
	color: #4c4c4c;
	outline: none;
}

.value-edit:focus {
	border-color: #8992eb;
	/* 聚焦时主题色边框 */
}

.remove-button {
	width: 20px;
	height: 20px;
	border: none;
	border-radius: 6px;
	background: transparent;
	color: #b0b7cc;
	font-size: 15px;
	line-height: 1;
	cursor: pointer;
}

.remove-button:hover {
	color: #e44d60;
	/* 悬停变为删除红色 */
}

.empty-hint {
	font-size: 12px;
	color: #9aa3bd;
	line-height: 1.6;
}
</style>
