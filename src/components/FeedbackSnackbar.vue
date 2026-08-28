<script setup>
import { watch } from "vue"; // 引入状态变化监听能力
import { Snackbar } from "@varlet/ui"; // 引入项目已使用的消息条组件
import store from "@/store.js"; // 引入现有全局反馈状态

let lastSignature = ""; // 记录最近一次消息，避免同一错误重复弹出

// --- 读取当前最高优先级反馈 ---
const getFeedback = ([transportError, experimentFeedback, trainingError]) => {
	if (trainingError) return { type: "error", message: trainingError }; // 训练错误需要优先让用户看到
	if (transportError) return { type: "error", message: transportError }; // 连接和协议错误影响所有操作
	if (experimentFeedback?.message) return { type: experimentFeedback.type || "info", message: experimentFeedback.message }; // 导入导出反馈沿用命令层类型
	return null; // 没有新反馈时不弹消息
};

// --- 显示全局消息条 ---
const showFeedback = (feedback) => {
	if (!feedback) {
		lastSignature = ""; // 错误清除后允许下次相同错误再次弹出
		return;
	}

	const signature = `${feedback.type}:${feedback.message}`; // 类型和内容共同确定一条消息
	if (signature === lastSignature) return; // 同一状态重复触发时保持安静
	lastSignature = signature; // 记录本次已显示消息
	Snackbar({ content: feedback.message, type: feedback.type, position: "top", duration: feedback.type === "error" ? 5000 : 3000, vertical: true }); // 使用顶部短消息条显示错误或成功反馈
};

watch(
		() => [store.transport.error, store.experiment.feedback, store.runtime.training.error], // 统一监听现有三类反馈来源
		(values) => showFeedback(getFeedback(values)), // 状态变化后自动弹出消息条
		{ deep: true, immediate: true }, // 首次挂载也处理已经存在的反馈
);
</script>

<template>
	<div aria-live="polite" aria-atomic="true"></div>
</template>
