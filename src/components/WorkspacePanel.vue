<script setup>
/* 这个组件是编辑器内的紧凑运行工作台，只负责展示store并把用户操作交给Runtime指令。 */
import { computed } from "vue"; // 引入结果列表和进度派生能力
import store from "@/store.js"; // 引入工作台及运行时快照
import Runtime from "@/commands/Runtime.js"; // 引入运行、训练、产物和插件指令
import TensorResult from "@/components/TensorResult.vue"; // 引入结构化结果预览组件

const tabs = [
	{ key: "execution", label: "运行" }, // 查看节点输出和错误
	{ key: "scoring", label: "跑分" }, // 查看性能指标
	{ key: "training", label: "训练" }, // 配置合成数据训练
	{ key: "artifacts", label: "产物" }, // 保存、加载和导出
	{ key: "plugins", label: "插件" }, // 查看与重载插件
]; // 页签保持固定顺序便于重复使用

const executionResults = computed(() => Object.values(store.runtime.execution.nodeResults)); // 将节点结果映射转成展示列表
const executionErrors = computed(() => Object.values(store.runtime.execution.nodeErrors)); // 将节点错误映射转成展示列表
const trainingPercent = computed(() => {
	const progress = store.runtime.training.progress; // 读取后端最近进度
	if (!progress) return 0; // 未开始时进度为零
	if (Number.isFinite(Number(progress.percent))) return Math.min(100, Math.max(0, Number(progress.percent))); // 后端给百分比时直接限制范围
	return Math.min(100, Math.max(0, (Number(progress.epoch) / Number(progress.epochs || store.runtime.training.config.epochs)) * 100)); // 否则按epoch计算
});

// --- 切换工作台页签 ---
const selectTab = (tab) => Runtime.setWorkspace(true, tab); // 页签触发交给运行时指令


// --- 更新训练输入 ---
const updateTraining = (key, event) => Runtime.updateTrainingConfig(key, event.target.value); // 输入值由指令执行边界限制
</script>

<template>
	<aside v-if="store.workspace.visible" class="workspace-panel" aria-label="运行工作台">
		<header class="panel-header">
			<div>
				<strong>运行工作台</strong>
				<span :class="['transport-dot', store.transport.status]"></span>
			</div>
			<button class="icon-button" title="关闭工作台" aria-label="关闭工作台" @click="Runtime.setWorkspace(false)">×</button>
		</header>

		<div v-if="store.transport.error" class="status-message error">{{ store.transport.error }}</div>
		<div v-if="store.workspace.feedback" :class="['status-message', store.workspace.feedback.type]">{{ store.workspace.feedback.message }}</div>

		<nav class="panel-tabs" aria-label="工作台功能">
			<button v-for="tab in tabs" :key="tab.key" :class="{ active: store.workspace.activeTab === tab.key }" @click="selectTab(tab.key)">{{ tab.label }}</button>
		</nav>

		<section v-if="store.workspace.activeTab === 'execution'" class="panel-content">
			<div class="section-heading">
				<div><strong>蓝图运行</strong><span class="state-label">{{ store.runtime.execution.status }}</span></div>
				<button :disabled="store.runtime.execution.status === 'running'" @click="Runtime.runBlueprint">运行</button>
			</div>
			<div v-if="store.runtime.execution.durationMs != null" class="metric-strip">
				<span>耗时 <b>{{ store.runtime.execution.durationMs }} ms</b></span>
				<span>错误 <b>{{ store.runtime.execution.errorCount }}</b></span>
			</div>
			<div v-if="!executionResults.length && !executionErrors.length" class="empty-state">运行后在这里查看节点输出</div>
			<article v-for="item in executionResults" :key="item.nodeId" class="result-block">
				<div class="result-heading"><strong>{{ item.opcode }}</strong><span>{{ item.durationMs }} ms</span></div>
				<div v-for="(output, port) in item.outputs" :key="port" class="port-result"><label>{{ port }}</label><TensorResult :value="output" /></div>
			</article>
			<article v-for="error in executionErrors" :key="error.nodeId" class="error-block">
				<strong>{{ error.opcode || error.nodeId }}</strong>
				<span>{{ error.phase }} · {{ error.code }}</span>
				<p>{{ error.message }}</p>
			</article>
		</section>

		<section v-else-if="store.workspace.activeTab === 'scoring'" class="panel-content">
			<div class="section-heading">
				<div><strong>性能跑分</strong><span class="state-label">{{ store.runtime.scoring.status }}</span></div>
				<button :disabled="store.runtime.scoring.status === 'loading'" @click="Runtime.scoreBlueprint">开始</button>
			</div>
			<div v-if="store.runtime.scoring.error" class="status-message error">{{ store.runtime.scoring.error }}</div>
			<div v-if="store.runtime.scoring.result" class="score-grid">
				<div><span>平均延迟</span><strong>{{ Number(store.runtime.scoring.result.latencyMs?.mean || 0).toFixed(3) }} ms</strong></div>
				<div><span>最快延迟</span><strong>{{ Number(store.runtime.scoring.result.latencyMs?.min || 0).toFixed(3) }} ms</strong></div>
				<div><span>总参数量</span><strong>{{ Number(store.runtime.scoring.result.parameters?.total || 0).toLocaleString() }}</strong></div>
				<div><span>可训练参数</span><strong>{{ Number(store.runtime.scoring.result.parameters?.trainable || 0).toLocaleString() }}</strong></div>
			</div>
			<div v-if="store.runtime.scoring.result?.nodeTimings" class="timing-list">
				<div v-for="(timing, nodeId) in store.runtime.scoring.result.nodeTimings" :key="nodeId"><span>{{ nodeId }}</span><b>{{ timing }} ms</b></div>
			</div>
			<div v-if="store.runtime.scoring.status === 'idle'" class="empty-state">运行跑分以查看延迟和参数规模</div>
		</section>

		<section v-else-if="store.workspace.activeTab === 'training'" class="panel-content">
			<div class="section-heading"><div><strong>合成数据训练</strong><span class="state-label">{{ store.runtime.training.status }}</span></div></div>
			<div class="form-grid">
				<label>轮数<input type="number" min="1" max="1000" :value="store.runtime.training.config.epochs" @change="updateTraining('epochs', $event)" /></label>
				<label>批大小<input type="number" min="1" max="4096" :value="store.runtime.training.config.batchSize" @change="updateTraining('batchSize', $event)" /></label>
				<label>样本数<input type="number" min="1" max="1000000" :value="store.runtime.training.config.sampleCount" @change="updateTraining('sampleCount', $event)" /></label>
				<label>学习率<input type="number" min="0.0000001" max="10" step="0.0001" :value="store.runtime.training.config.learningRate" @change="updateTraining('learningRate', $event)" /></label>
				<label>优化器<select :value="store.runtime.training.config.optimizer" @change="updateTraining('optimizer', $event)"><option value="adam">Adam</option><option value="adamw">AdamW</option><option value="sgd">SGD</option></select></label>
				<label>损失节点<input type="text" :value="store.runtime.training.config.lossNodeId" placeholder="节点 ID" @input="updateTraining('lossNodeId', $event)" /></label>
			</div>
			<button v-if="!['running', 'cancelling'].includes(store.runtime.training.status)" class="wide-button" @click="Runtime.trainBlueprint">开始训练</button>
			<button v-else class="wide-button cancel-button" :disabled="store.runtime.training.status === 'cancelling'" @click="Runtime.cancelTraining">{{ store.runtime.training.status === 'cancelling' ? '正在取消' : '取消训练' }}</button>
			<div v-if="store.runtime.training.progress" class="progress-area">
				<div class="progress-label"><span>Epoch {{ store.runtime.training.progress.epoch }} / {{ store.runtime.training.progress.epochs || store.runtime.training.config.epochs }}</span><b>{{ Math.round(trainingPercent) }}%</b></div>
				<div class="progress-track"><span :style="{ width: `${trainingPercent}%` }"></span></div>
				<div v-if="store.runtime.training.progress.loss != null">Loss: {{ store.runtime.training.progress.loss }}</div>
			</div>
			<div v-if="store.runtime.training.error" class="status-message error">{{ store.runtime.training.error }}</div>
			<pre v-if="store.runtime.training.result" class="data-summary">{{ JSON.stringify(store.runtime.training.result, null, 2) }}</pre>
		</section>

		<section v-else-if="store.workspace.activeTab === 'artifacts'" class="panel-content">
			<div class="section-heading"><div><strong>模型产物</strong><span class="state-label">{{ store.runtime.artifacts.status }}</span></div></div>
			<label class="full-field">产物名称<input type="text" maxlength="64" :value="store.runtime.artifacts.artifactName" @input="Runtime.updateArtifactName($event.target.value)" /></label>
			<div class="action-grid">
				<button @click="Runtime.saveCheckpoint">保存检查点</button><button @click="Runtime.loadCheckpoint">加载检查点</button>
				<button @click="Runtime.exportModel('python')">导出 Python</button><button @click="Runtime.exportModel('onnx')">导出 ONNX</button>
			</div>
			<div v-if="store.runtime.artifacts.error" class="status-message error">{{ store.runtime.artifacts.error }}</div>
			<pre v-if="store.runtime.artifacts.result" class="data-summary">{{ JSON.stringify(store.runtime.artifacts.result, null, 2) }}</pre>
		</section>

		<section v-else class="panel-content">
			<div class="section-heading">
				<div><strong>插件注册表</strong><span class="state-label">{{ store.runtime.plugins.status }}</span></div>
				<button :disabled="store.runtime.plugins.status === 'loading'" @click="Runtime.reloadPlugins">重载</button>
			</div>
			<div v-if="store.runtime.plugins.error" class="status-message error">{{ store.runtime.plugins.error }}</div>
			<div v-if="!store.runtime.plugins.items.length" class="empty-state">暂无插件状态</div>
			<div v-for="(plugin, index) in store.runtime.plugins.items" :key="plugin.id || plugin.name || index" class="plugin-row">
				<div><strong>{{ plugin.name || plugin.id || `插件 ${index + 1}` }}</strong><span>{{ plugin.version || "" }}</span></div>
				<b :class="['plugin-state', plugin.status]">{{ plugin.status || "unknown" }}</b>
			</div>
		</section>
	</aside>
</template>

<style scoped>
.workspace-panel { width: min(390px, 38vw); min-width: 320px; height: 100%; overflow: hidden; border-left: 1px solid #d9dcec; background: #fff; color: #302e3f; box-shadow: -5px 0 18px rgba(42, 38, 74, .08); z-index: 80; }
.panel-header { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 14px; border-bottom: 1px solid #ececf3; }
.panel-header > div { display: flex; align-items: center; gap: 8px; }
.transport-dot { width: 8px; height: 8px; border-radius: 50%; background: #a5a4ae; }
.transport-dot.connected { background: #32ad68; }.transport-dot.connecting { background: #e1b86b; }.transport-dot.disconnected { background: #e74c3c; }
.icon-button { width: 32px; height: 32px; padding: 0; border: 0; background: transparent; color: #656274; font-size: 24px; cursor: pointer; }
.panel-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-bottom: 1px solid #ececf3; }
.panel-tabs button { min-width: 0; padding: 10px 2px; border: 0; border-bottom: 2px solid transparent; background: #fff; color: #716e7f; font-size: 12px; cursor: pointer; }
.panel-tabs button.active { border-color: #5f38df; color: #5f38df; font-weight: 700; }
.panel-content { height: calc(100% - 89px); padding: 14px; overflow-y: auto; }
.section-heading, .result-heading, .progress-label, .plugin-row, .timing-list div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.section-heading { margin-bottom: 14px; }.section-heading > div { display: flex; align-items: center; gap: 8px; min-width: 0; }
.state-label { color: #817e8d; font-size: 11px; text-transform: uppercase; }
button { padding: 7px 12px; border: 0; border-radius: 6px; background: #5f38df; color: #fff; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
.status-message { margin: 8px 12px; padding: 8px 10px; border-radius: 5px; background: #edf7f1; color: #267a49; font-size: 12px; line-height: 1.45; word-break: break-word; }
.status-message.error { background: #fff0ee; color: #b33a2f; }.status-message.success { background: #edf7f1; color: #267a49; }
.metric-strip { display: flex; gap: 18px; margin-bottom: 12px; color: #6f6c7b; font-size: 12px; }
.metric-strip b { color: #343141; }
.empty-state { padding: 34px 12px; color: #96939f; text-align: center; font-size: 13px; }
.result-block, .error-block { margin-bottom: 10px; padding: 10px; border: 1px solid #e3e3eb; border-radius: 6px; }
.result-heading { margin-bottom: 8px; }.result-heading span { color: #85818f; font-size: 11px; }
.port-result + .port-result { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eeeeF3; }.port-result label { display: block; margin-bottom: 5px; color: #5f38df; font-size: 11px; font-weight: 700; }
.error-block { border-color: #f2c3bd; background: #fff8f7; }.error-block span { margin-left: 7px; color: #a05e56; font-size: 11px; }.error-block p { margin-top: 6px; color: #833a32; font-size: 12px; word-break: break-word; }
.score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.score-grid div { min-width: 0; padding: 10px; border: 1px solid #e3e3eb; border-radius: 6px; }.score-grid span, .score-grid strong { display: block; }.score-grid span { margin-bottom: 4px; color: #7c7988; font-size: 11px; }.score-grid strong { overflow: hidden; color: #403d4b; text-overflow: ellipsis; }
.timing-list { margin-top: 12px; font-size: 12px; }.timing-list div { padding: 6px 2px; border-bottom: 1px solid #eeeef3; }.timing-list span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.form-grid label, .full-field { min-width: 0; color: #696675; font-size: 12px; }.form-grid input, .form-grid select, .full-field input { width: 100%; height: 34px; margin-top: 4px; padding: 0 8px; border: 1px solid #d9d9e2; border-radius: 5px; outline: none; }.form-grid input:focus, .form-grid select:focus, .full-field input:focus { border-color: #8992eb; }
.wide-button { width: 100%; margin-top: 14px; }.progress-area { margin-top: 14px; color: #656271; font-size: 12px; }.progress-track { height: 7px; margin: 6px 0; overflow: hidden; border-radius: 4px; background: #e8e8ef; }.progress-track span { display: block; height: 100%; background: #32ad68; transition: width .2s; }
.cancel-button { background: #b84b43; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }.action-grid button { background: #716bd9; }
.data-summary { margin-top: 12px; padding: 9px; overflow: auto; border-radius: 5px; background: #f4f4f8; color: #555261; font-size: 11px; white-space: pre-wrap; word-break: break-word; user-select: text; }
.plugin-row { padding: 10px 2px; border-bottom: 1px solid #ececf2; }.plugin-row > div { min-width: 0; }.plugin-row strong, .plugin-row span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.plugin-row span { margin-top: 2px; color: #898694; font-size: 11px; }.plugin-state { color: #777482; font-size: 11px; }.plugin-state.active, .plugin-state.loaded, .plugin-state.ready { color: #258150; }
@media (max-width: 760px) { .workspace-panel { position: absolute; inset: 0 0 0 auto; width: min(92vw, 390px); min-width: 0; z-index: 150; }.form-grid { grid-template-columns: 1fr; } }
</style>
