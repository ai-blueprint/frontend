<script setup>
import { computed, ref } from "vue"; // 引入训练曲线和面板折叠状态能力
import store from "@/store.js"; // 引入全局训练状态
import Train from "@/commands/Train.js"; // 引入单步训练命令

// --- 生成损失曲线路径 ---
const curvePath = computed(() => {
	const curve = store.runtime.training.curve; // 获取已经完成的损失序列
	if (curve.length < 2) return ""; // 少于两个点时无法形成曲线
	const max = Math.max(...curve, 0.000001); // 计算纵轴最大值并避免除零
	return curve.map((loss, index) => `${(index / (curve.length - 1)) * 180},${70 - (loss / max) * 62}`).join(" "); // 将损失映射到固定画布坐标
});

// --- 训练按钮文案 ---
const isCollapsed = ref(true); // 训练面板默认折叠，需要时点击标题栏展开

// --- 训练按钮文案 ---
const trainLabel = computed(() => (store.runtime.training.status === "training" ? "训练中" : "训练一步")); // 正在请求时禁止重复误触

// --- 执行一步训练 ---
const onTrain = () => {
	if (store.runtime.training.status === "training") return; // 当前请求完成前不重复发送
	Train.step(); // 发送一轮前向、反向和权重更新
};

// --- 切换连续训练 ---
const onContinuousChange = (continuous) => {
	Train.setContinuous(continuous); // 开关控制后端单步请求是否自动循环
};
</script>

<template>
	<div class="training-panel">
		<div class="training-header" data-drag-handle @click="isCollapsed = !isCollapsed">
			<span class="training-title">训练</span>
			<button v-if="!isCollapsed" class="training-button" data-no-drag :disabled="store.runtime.training.status === 'training'" @click.stop="onTrain">{{ trainLabel }}</button>
			<button v-if="!isCollapsed" class="clear-button" data-no-drag title="重置权重、梯度和训练曲线" @click.stop="Train.reset">重置训练</button>
		</div>
		<div v-if="!isCollapsed" class="training-summary">
			<span>步数 {{ store.runtime.training.step }}</span>
			<span>Loss {{ store.runtime.training.loss == null ? "-" : store.runtime.training.loss.toFixed(4) }}</span>
		</div>
		<div v-if="!isCollapsed" class="training-settings">
			<label>优化器 <select :value="store.runtime.training.optimizer" @change="store.runtime.training.optimizer = $event.target.value"><option value="sgd">SGD</option><option value="adam">Adam</option></select></label>
			<label>学习率 <input :value="store.runtime.training.learningRate" type="number" min="0.000001" step="0.001" @change="store.runtime.training.learningRate = Number($event.target.value)" /></label>
			<label>梯度裁剪 <input :value="store.runtime.training.gradientClip" type="number" min="0" step="0.1" @change="store.runtime.training.gradientClip = Number($event.target.value)" /></label>
		</div>
		<label v-if="!isCollapsed" class="continuous-control"><input type="checkbox" :checked="store.runtime.training.continuous" @change="onContinuousChange($event.target.checked)" />持续训练</label>
		<svg v-if="!isCollapsed" class="loss-chart" viewBox="0 0 180 72" role="img" aria-label="训练损失曲线">
			<polyline points="0,70 180,70" class="chart-axis" />
			<polyline v-if="curvePath" :points="curvePath" class="chart-line" />
			<text v-if="!curvePath" x="90" y="42" text-anchor="middle" class="chart-empty">点击训练一步开始</text>
		</svg>
		<div v-if="!isCollapsed && store.runtime.training.error" class="training-error">{{ store.runtime.training.error }}</div>
	</div>
</template>

<style scoped>
.training-panel { width: 260px; border-radius: 12px; background: #f6f9fe; box-shadow: 0 2px 12px rgba(111, 125, 176, 0.2); overflow: hidden; }
.training-header { display: flex; align-items: center; justify-content: space-between; gap: 7px; padding: 8px 12px; background: #eaeffc; cursor: pointer; }
.training-title { flex: 1; color: #6f7db0; font-size: 13px; font-weight: 600; }
.training-button, .clear-button { border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
.training-button { background: #8992eb; color: #fff; }
.training-button:disabled { opacity: .55; cursor: wait; }
.clear-button { background: #eaeffc; color: #6f7db0; }
.training-summary { display: flex; justify-content: space-between; margin: 8px 12px 0; color: #6f7db0; font-size: 12px; }
.training-settings { display: grid; gap: 5px; margin: 8px 12px 0; color: #6f7db0; font-size: 12px; }
.training-settings label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.training-settings select, .training-settings input { width: 115px; padding: 3px 5px; border: 1px solid #dfe6f5; border-radius: 5px; color: #4c4c4c; outline: none; font-size: 12px; }
.training-settings select:focus, .training-settings input:focus { border-color: #8992eb; }
.continuous-control { display: flex; align-items: center; gap: 5px; margin: 7px 12px 0; color: #6f7db0; font-size: 12px; cursor: pointer; }
.loss-chart { display: block; width: calc(100% - 24px); height: 82px; margin: 4px 12px 0; overflow: visible; }
.chart-axis { stroke: #dfe6f5; stroke-width: 1; }
.chart-line { fill: none; stroke: #8992eb; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.chart-empty { fill: #9aa3bd; font-size: 9px; }
.training-error { margin: 5px 12px 10px; color: #e44d60; font-size: 12px; line-height: 1.4; }
</style>
