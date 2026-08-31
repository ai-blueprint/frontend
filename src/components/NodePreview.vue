<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
	opcode: { type: String, required: true },
	params: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update-param"]);

const step = ref(0);
let timer;

onMounted(() => {
	timer = window.setInterval(() => {
		step.value += 1;
	}, 620);
});

onBeforeUnmount(() => window.clearInterval(timer));

const previewType = computed(() => {
	if (props.opcode === "pooling") return "pooling";
	if (["add", "sub", "mul", "div", "matmul", "bmm", "dot"].includes(props.opcode)) return "binary";
	if (["reshape", "transpose", "permute", "squeeze", "unsqueeze", "flatten", "unflatten", "pad", "slice", "select", "cat", "stack", "expand", "roll", "flip", "chunk"].includes(props.opcode)) return "shape";
	if (props.opcode.endsWith("_loss")) return "loss";
	if (["input", "output", "debug", "tensor_like"].includes(props.opcode)) return "base";
	return "unary";
});

const previewCaption = computed(() => ({
	pooling: "窗口滑过，结果同步生成",
	binary: "两路合成一路",
	shape: "内容不变，形状变",
	loss: "预测和目标的差",
	base: "数据进出这里",
	unary: "输入变成输出",
})[previewType.value]);

const numericParam = (key, fallback) => {
	const value = props.params?.[key]?.value;
	const parsed = Number.parseInt(String(value ?? fallback).split(",")[0], 10);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const poolingMode = computed(() => props.params?.mode?.value || "max");
const kernelSize = computed(() => Math.min(3, Math.max(1, numericParam("kernel_size", 2))));
const stride = computed(() => Math.min(3, Math.max(1, numericParam("stride", 2))));
const poolingSteps = computed(() => {
	const positions = [];
	for (let row = 0; row <= 4 - kernelSize.value; row += stride.value) {
		for (let col = 0; col <= 4 - kernelSize.value; col += stride.value) positions.push({ row, col, output: positions.length });
	}
	return positions.length ? positions : [{ row: 0, col: 0, output: 0 }];
});
const poolingColumns = computed(() => new Set(poolingSteps.value.map((item) => item.col)).size);
const poolingCycle = computed(() => step.value % (poolingSteps.value.length + 3));
const poolingStep = computed(() => poolingSteps.value[Math.min(poolingCycle.value, poolingSteps.value.length - 1)]);
const poolingResults = computed(() => poolingSteps.value.map(({ row, col }) => {
	const values = [];
	for (let y = row; y < row + kernelSize.value; y += 1) {
		for (let x = col; x < col + kernelSize.value; x += 1) values.push(y * 4 + x + 1);
	}
	const useAverage = poolingMode.value.includes("avg");
	return useAverage ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : Math.max(...values);
}));
const poolingAction = computed(() => poolingMode.value.includes("avg") ? "取平均" : "取最大");
const poolingWindowStyle = computed(() => ({
	"--window-x": `${poolingStep.value.col * 11}px`,
	"--window-y": `${poolingStep.value.row * 11}px`,
	"--window-size": `${kernelSize.value * 8 + (kernelSize.value - 1) * 3 + 2}px`,
}));
const poolingOutputStyle = computed(() => ({ "--output-cols": poolingColumns.value }));
const poolingValue = computed(() => poolingResults.value[poolingStep.value.output]);
const poolingCellClass = (index) => ({
	active: index <= poolingStep.value.output,
	current: index === poolingStep.value.output,
});
const poolingInputClass = (index) => {
	const row = Math.floor((index - 1) / 4);
	const col = (index - 1) % 4;
	return { highlighted: row >= poolingStep.value.row && row <= poolingStep.value.row + 1 && col >= poolingStep.value.col && col <= poolingStep.value.col + 1 };
};
const updateParam = (key, event) => emit("update-param", key, event.target.value);
</script>

<template>
	<div class="node-preview" :class="`preview-${previewType}`" aria-hidden="true">
		<template v-if="previewType === 'pooling'">
			<div class="pool-flow">
				<div class="preview-grid input-grid" :style="poolingWindowStyle">
					<span v-for="index in 16" :key="index" :class="poolingInputClass(index)">{{ index }}</span>
					<i class="window-mark"></i>
				</div>
				<span class="flow-word">窗口 {{ poolingStep.row + 1 }},{{ poolingStep.col + 1 }}</span>
			</div>
			<span class="preview-arrow compute-arrow">→</span>
			<div class="pool-flow">
				<div class="preview-grid output-grid" :style="poolingOutputStyle"><span v-for="(value, index) in poolingResults" :key="index" :class="poolingCellClass(index)">{{ index <= poolingStep.output ? value : "·" }}</span></div>
				<span class="flow-word">{{ poolingAction }} = {{ poolingValue }}</span>
			</div>
		</template>

		<template v-else-if="previewType === 'binary'">
			<div class="merge-flow">
				<span class="preview-dot"></span><span class="merge-stem stem-top"></span>
				<span class="preview-dot second"></span><span class="merge-stem stem-bottom"></span>
			</div>
			<span class="preview-arrow">→</span><span class="preview-result"></span>
		</template>

		<template v-else-if="previewType === 'shape'">
			<div class="preview-shape wide"><span></span><span></span><span></span></div>
			<span class="preview-arrow">→</span>
			<div class="preview-shape narrow"><span></span><span></span><span></span></div>
		</template>

		<template v-else-if="previewType === 'loss'">
			<div class="loss-flow"><span class="preview-pill">预测</span><span class="loss-stem"></span><span class="preview-pill target">目标</span></div>
			<span class="preview-arrow">→</span><span class="preview-result error-result"></span>
		</template>

		<template v-else-if="previewType === 'base'">
			<div class="preview-base-block source-block"><span></span><span></span><span></span></div>
			<span class="preview-arrow">→</span>
			<div class="preview-base-block"><span></span><span></span><span></span></div>
		</template>

		<template v-else>
			<div class="preview-line input-line"></div><span class="preview-arrow">→</span><div class="preview-line output-line"></div>
		</template>
		<span class="preview-caption">{{ previewCaption }}</span>
		<div v-if="previewType === 'pooling'" class="computation-controls nodrag nowheel" @mousedown.stop @click.stop>
			<label>模式
				<select aria-label="池化模式" :value="poolingMode" @change="updateParam('mode', $event)">
					<option value="max">最大</option>
					<option value="avg">平均</option>
					<option value="adaptive_max">自适应最大</option>
					<option value="adaptive_avg">自适应平均</option>
				</select>
			</label>
			<label>核
				<select aria-label="池化核大小" :value="String(kernelSize)" @change="updateParam('kernel_size', $event)">
					<option value="1">1</option><option value="2">2</option><option value="3">3</option>
				</select>
			</label>
			<label>步
				<select aria-label="池化步幅" :value="String(stride)" @change="updateParam('stride', $event)">
					<option value="1">1</option><option value="2">2</option><option value="3">3</option>
				</select>
			</label>
		</div>
	</div>
</template>

<style scoped>
.node-preview {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 9px;
	width: 178px;
	min-height: 92px;
	color: color-mix(in srgb, var(--node-color, #5672b8) 88%, white);
	flex-wrap: wrap;
	align-content: center;
}

.preview-arrow {
	font-size: 22px;
	font-weight: 500;
	line-height: 1;
	color: var(--node-color, #5672b8);
}

.preview-grid {
	display: grid;
	position: relative;
	gap: 3px;
	padding: 4px;
	border: 1.5px solid currentColor;
	border-radius: 5px;
}

.input-grid {
	grid-template-columns: repeat(4, 8px);
	grid-template-rows: repeat(4, 8px);
	font-size: 6px;
	line-height: 8px;
	text-align: center;
}

.output-grid {
	grid-template-columns: repeat(var(--output-cols), 12px);
	font-size: 7px;
	line-height: 12px;
	text-align: center;
}

.preview-grid span,
.preview-result,
.preview-dot,
.preview-base-block,
.preview-shape span,
.preview-line,
.preview-pill {
	display: block;
	background: currentColor;
}

.input-grid span { background: color-mix(in srgb, currentColor 22%, transparent); color: color-mix(in srgb, currentColor 72%, #fff); }
.input-grid span.highlighted { background: currentColor; color: #202329; }

.window-mark {
	position: absolute;
	top: 20px;
	left: 20px;
	width: var(--window-size);
	height: var(--window-size);
	border: 2px solid currentColor;
	border-radius: 3px;
	box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 18%, transparent);
	transform: translate(var(--window-x), var(--window-y));
	transition: transform 0.45s ease;
}

.pool-flow { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.flow-word { font-size: 9px; color: #b7c0cf; white-space: nowrap; }
.compute-arrow { animation: compute-pulse 0.62s ease-in-out infinite alternate; }
.output-grid span { color: #202329; background: color-mix(in srgb, currentColor 20%, transparent); }
.output-grid span.active { background: color-mix(in srgb, currentColor 68%, white); }
.output-grid span.current { box-shadow: 0 0 0 2px #fff, 0 0 9px currentColor; }

.merge-flow,
.loss-flow { position: relative; width: 52px; height: 52px; }
.preview-dot { position: absolute; width: 17px; height: 17px; border-radius: 50%; top: 2px; left: 2px; }
.preview-dot.second { top: 33px; left: 2px; opacity: 0.62; }
.preview-binary .preview-dot { animation: input-pulse 1.24s ease-in-out infinite; }
.preview-binary .preview-dot.second { animation-delay: 0.31s; }
.preview-binary .preview-result { animation: result-pulse 1.24s ease-in-out infinite 0.62s; }
.merge-stem,
.loss-stem { position: absolute; width: 28px; height: 2px; background: currentColor; transform-origin: left center; left: 17px; }
.stem-top { top: 13px; transform: rotate(25deg); }
.stem-bottom { top: 40px; transform: rotate(-25deg); opacity: 0.62; }
.preview-result { width: 23px; height: 23px; border-radius: 7px; box-shadow: inset 0 0 0 3px color-mix(in srgb, white 50%, transparent); }

.preview-shape { display: grid; gap: 3px; padding: 5px; border: 1.5px solid currentColor; border-radius: 5px; }
.preview-shape span { height: 5px; border-radius: 2px; opacity: 0.75; }
.preview-shape.wide { width: 47px; grid-template-columns: repeat(3, 1fr); }
.preview-shape.narrow { width: 27px; grid-template-columns: 1fr; }
.preview-shape.narrow span:nth-child(2) { opacity: 0.5; }
.preview-shape.wide { animation: shape-source 1.86s ease-in-out infinite; }
.preview-shape.narrow { animation: shape-result 1.86s ease-in-out infinite; }

.preview-pill { position: absolute; left: 0; padding: 5px 8px; border-radius: 12px; font-size: 10px; line-height: 1; color: #fff; }
.preview-pill.target { top: 34px; left: 10px; opacity: 0.56; }
.preview-pill:not(.target) { top: 3px; }
.loss-stem { left: 30px; top: 27px; width: 25px; transform: rotate(90deg); }
.error-result { border-radius: 50%; background: transparent; border: 3px solid currentColor; box-shadow: inset 0 0 0 4px color-mix(in srgb, currentColor 20%, transparent); }
.preview-loss .error-result { animation: result-pulse 1.24s ease-in-out infinite; }

.preview-base-block { display: flex; flex-direction: column; gap: 3px; width: 22px; padding: 5px; border-radius: 4px; }
.preview-base-block span { height: 3px; border-radius: 2px; background: #fff; opacity: 0.7; }
.source-block { opacity: 0.58; }
.preview-line { width: 38px; height: 6px; border-radius: 6px; }
.output-line { width: 23px; opacity: 0.62; }

.preview-caption { flex-basis: 100%; font-size: 11px; line-height: 1.2; text-align: center; color: #b7c0cf; }

.computation-controls {
	display: grid;
	grid-template-columns: 1.35fr 0.8fr 0.8fr;
	gap: 5px;
	width: 100%;
	margin-top: 1px;
}

.computation-controls label {
	display: flex;
	align-items: center;
	gap: 3px;
	font-size: 9px;
	color: #9fa9b8;
}

.computation-controls select {
	min-width: 0;
	height: 21px;
	padding: 0 3px;
	border: 1px solid #535b68;
	border-radius: 4px;
	background: #202329;
	color: #eef2f7;
	font-size: 9px;
	outline: none;
	cursor: pointer;
}

.computation-controls select:focus { border-color: var(--node-color, #8992eb); }

@keyframes compute-pulse {
	from { opacity: 0.45; transform: translateX(-2px); }
	to { opacity: 1; transform: translateX(2px); }
}

@keyframes input-pulse {
	0%, 100% { transform: scale(0.82); opacity: 0.45; }
	45% { transform: scale(1); opacity: 1; }
}

@keyframes result-pulse {
	0%, 35%, 100% { transform: scale(0.84); opacity: 0.38; }
	65% { transform: scale(1.08); opacity: 1; }
}

@keyframes shape-source {
	0%, 40%, 100% { opacity: 1; transform: translateX(0); }
	70% { opacity: 0.42; transform: translateX(6px); }
}

@keyframes shape-result {
	0%, 35%, 100% { opacity: 0.4; transform: translateX(-5px); }
	70% { opacity: 1; transform: translateX(0); }
}
</style>
