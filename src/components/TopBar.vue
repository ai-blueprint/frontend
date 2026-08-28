<script setup>
import { ref } from "vue"; // 引入Vue响应式引用
import { computed } from "vue"; // 引入计算属性
import store from "@/store.js"; // 引入全局状态
import Blueprint from "@/commands/Blueprint.js"; // 引入蓝图命令
import Experiment from "@/commands/Experiment.js"; // 引入实验运行指令
import Scan from "@/commands/Scan.js"; // 引入Block可堆叠扫描指令

import textLogo from "@/assets/TopBar/text-logo.svg"; // LOGO图标
import settingIcon from "@/assets/TopBar/setting.svg"; // 设置图标

const fileInput = ref(null); // 文件输入框引用

// --- 蓝图名称变化时更新store ---
const onNameChange = (event) => {
	Blueprint.setName(event.target.value); // 更新蓝图名称
};

// --- 导入蓝图 ---
const onImport = () => {
	fileInput.value.click(); // 触发文件选择
};

// --- 处理文件选择 ---
const onFileSelected = (event) => {
	const file = event.target.files[0]; // 获取选中的文件
	if (!file) return; // 没有文件直接返回

	const reader = new FileReader(); // 创建文件读取器
	reader.onload = (e) => {
		Blueprint.importBlueprint(e.target.result); // 读取完成后导入蓝图
	};
	reader.readAsText(file); // 以文本格式读取文件
	event.target.value = ""; // 清空文件选择（允许重复选同一文件）
};

// --- 导出蓝图 ---
const onExport = () => {
	Blueprint.exportBlueprint(); // 执行导出
};

// --- 切换实时传播 ---
const onRunningChange = (running) => {
	Experiment.setRunning(running); // 开启后持续生成随机输入并逐节点反馈
};

// --- 触发Block可堆叠扫描 ---
const onScan = () => {
	Scan.scan(); // 请求后端一次追踪推导全图形状并回填结论
};

// --- 扫描结论的文字与配色 ---
const scanLabel = computed(() => {
	const status = store.runtime.scan.status; // 读取当前扫描状态
	return { idle: "扫描Block", scanning: "扫描中", stackable: "可堆叠", notStackable: "不可堆叠", unknown: "无法确定" }[status] || "扫描Block"; // 状态到文案映射
});

// --- 扫描问题数量提示 ---
const scanTitle = computed(() => {
	const issues = store.runtime.scan.issues; // 读取问题列表
	if (!issues.length) return "检查输出形状是否与输入一致，可否作为Block重复堆叠"; // 无问题时显示功能说明
	return issues.map((issue) => issue.message).join("\n"); // 有问题时逐条悬停展示
});
</script>

<template>
	<div class="topbar">
		<!-- 顶部栏容器 -->

		<!-- 左侧区域 -->
		<div class="topbar-left">
			<!-- 左侧区域 -->
			<img :src="textLogo" alt="logo" class="text-logo" />
			<!-- 文字LOGO -->

			<div class="function-group">
				<!-- 功能组 -->
				<var-menu placement="bottom">
					<img :src="settingIcon" alt="setting" class="function-icon" />
					<template #menu>
						<var-cell @click="onImport">导入</var-cell>
						<var-cell @click="onExport">导出</var-cell>
					</template>
				</var-menu>

				<div class="monitor-switch" title="持续运行蓝图">
					<span>运行</span>
					<var-switch :model-value="store.experiment.running" @update:model-value="onRunningChange" />
				</div>

				<button class="scan-button" :class="'scan-' + store.runtime.scan.status" :title="scanTitle" @click="onScan">{{ scanLabel }}</button>
				<!-- Block可堆叠扫描按钮，颜色随结论变化 -->
			</div>
		</div>

		<!-- 中部区域 -->
		<div class="topbar-center">
			<!-- 中部区域 -->
			<input class="name-input" :value="store.blueprint.name" @input="onNameChange" placeholder="我的架构" />
			<!-- 蓝图命名输入框 -->
		</div>

		<!-- 右侧区域 -->
		<div class="topbar-right">
			<!-- 右侧区域 -->
			<button class="action-button run-button" @click="onImport">导入</button>
			<!-- 导入按钮 -->
			<button class="action-button score-button" @click="onExport">导出</button>
			<!-- 导出按钮 -->
		</div>

		<!-- 隐藏的文件输入框（用于导入）-->
		<input ref="fileInput" type="file" accept=".json" style="display: none" @change="onFileSelected" />
		<!-- 隐藏的文件选择器 -->
	</div>
</template>

<style scoped>
.topbar {
	display: flex;
	/* 横向排列 */
	justify-content: space-between;
	/* 三区域分布 */
	align-items: center;
	/* 垂直居中 */
	padding: 8px 20px;
	/* 内边距 */
	height: fit-content;
	/* 自适应高度 */
	background-color: #5f38df;
	/* 紫色主题背景 */
	color: #ffffff;
	/* 白色文字 */
	z-index: 100;
	/* 层级 */
	position: relative;
	/* 相对定位 */
}

.topbar-left {
	display: flex;
	/* 横向排列 */
	align-items: center;
	/* 垂直居中 */
	gap: 4vw;
	/* 元素间距 */
}

.text-logo {
	height: 42px;
	/* LOGO高度 */
}

.function-group {
	display: flex;
	/* 横向排列 */
	align-items: center;
	/* 垂直居中 */
	gap: 3vw;
	/* 图标间距 */
}

.function-icon {
	width: 20px;
	/* 图标宽度 */
	height: 20px;
	/* 图标高度 */
	opacity: 0.8;
	/* 默认透明度 */
}

.function-icon:hover {
	scale: 1.05;
	/* 悬停放大效果 */
}

.function-icon:active {
	scale: 0.95;
	/* 点击缩小效果 */
}

.dropdown-menu {
	position: absolute;
	/* 绝对定位 */
	top: 100%;
	/* 紧贴图标下方 */
	left: 0;
	/* 左对齐 */
	background: #ffffff;
	/* 白色背景 */
	border: 1px solid #e0e0e0;
	/* 浅色边框 */
	border-radius: 6px;
	/* 圆角 */
	padding: 4px;
	/* 内边距 */
	min-width: 100px;
	/* 最小宽度 */
	z-index: 200;
	/* 层级 */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	/* 阴影 */
}

.dropdown-item {
	padding: 6px 12px;
	/* 内边距 */
	border-radius: 4px;
	/* 圆角 */
	font-size: 13px;
	/* 字号 */
	color: #333333;
	/* 深色文字 */
	cursor: pointer;
	/* 鼠标指针 */
	transition: background 0.15s;
	/* 过渡动画 */
}

.dropdown-item:hover {
	background: #f0f0f0;
	/* 悬停浅灰背景 */
}

.topbar-center {
	max-width: 170px;
	/* 限制最大宽度 */
	margin: 0 10px;
	/* 左右外边距 */
}

.name-input {
	width: 100%;
	/* 铺满容器 */
	padding: 8px 16px;
	/* 内边距 */
	border: 0px;
	/* 无边框 */
	border-radius: 999px;
	/* 药丸形圆角 */
	font-size: 14px;
	/* 字号 */
	font-weight: 500;
	/* 中等字重 */
	text-align: center;
	/* 文字居中 */
	background-color: #7f60e5;
	/* 紫色输入框背景 */
	color: #ffffff;
	/* 白色文字 */
	outline: none;
	/* 去除聚焦边框 */
}

.name-input::placeholder {
	color: #ffffff;
	/* 占位符白色 */
	opacity: 0.5;
	/* 占位符半透明 */
}

.topbar-right {
	display: flex;
	/* 横向排列 */
	align-items: center;
	/* 垂直居中 */
	gap: 20px;
	/* 按钮间距 */
}

.action-button {
	padding: 6px 16px;
	/* 内边距 */
	border: none;
	/* 无边框 */
	border-radius: 8px;
	/* 圆角 */
	font-size: 16px;
	/* 字号 */
	font-weight: 500;
	/* 字重 */
	color: #ffffff;
	/* 白色文字 */
	cursor: pointer;
	/* 鼠标指针 */
	letter-spacing: -1px;
	/* 紧凑字距 */
	transition: all 0.1s ease-in-out;
	/* 过渡动画 */

	white-space: nowrap;
	/* 禁止换行 */
}

.action-button:hover {
	scale: 1.05;
	/* 悬停放大效果 */
}

.action-button:active {
	scale: 0.95;
	/* 点击缩小效果 */
}

.run-button {
	background-color: #7dc7f5;
	/* 运行按钮天蓝色背景 */
}

.score-button {
	background-color: #e1b86b;
	/* 导出按钮金色背景 */
}

.monitor-switch {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	white-space: nowrap;
}

.scan-button {
	padding: 5px 14px;
	/* 内边距 */
	border: none;
	/* 无边框 */
	border-radius: 999px;
	/* 药丸形圆角 */
	font-size: 13px;
	/* 字号 */
	font-weight: 500;
	/* 字重 */
	color: #ffffff;
	/* 白色文字 */
	cursor: pointer;
	/* 鼠标指针 */
	white-space: nowrap;
	/* 禁止换行 */
	background-color: #7f60e5;
	/* 默认与命名框同色 */
	transition: all 0.1s ease-in-out;
	/* 过渡动画 */
}

.scan-button:hover {
	scale: 1.05;
	/* 悬停放大效果 */
}

.scan-button:active {
	scale: 0.95;
	/* 点击缩小效果 */
}

.scan-button.scan-scanning {
	background-color: #b0a4ef;
	/* 扫描中浅紫色 */
}

.scan-button.scan-stackable {
	background-color: #4caf7d;
	/* 可堆叠绿色 */
}

.scan-button.scan-notStackable {
	background-color: #e44d60;
	/* 不可堆叠红色 */
}

.scan-button.scan-unknown {
	background-color: #e1b86b;
	/* 无法确定金色 */
}
</style>
