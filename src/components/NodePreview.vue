<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
	opcode: { type: String, required: true },
	params: { type: Object, default: () => ({}) },
});

const step = ref(0);
let timer;

onMounted(() => {
	timer = window.setInterval(() => { step.value += 1; }, 720);
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

const numericParam = (key, fallback) => {
	const value = props.params?.[key]?.value;
	const parsed = Number.parseInt(String(value ?? fallback).split(",")[0], 10);
	return Number.isFinite(parsed) ? parsed : fallback;
};

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
const poolingCycle = computed(() => step.value % (poolingSteps.value.length + 2));
const poolingStep = computed(() => poolingSteps.value[Math.min(poolingCycle.value, poolingSteps.value.length - 1)]);
const poolingWindowStyle = computed(() => ({
	"--window-x": `${poolingStep.value.col * 11}px`,
	"--window-y": `${poolingStep.value.row * 11}px`,
	"--window-size": `${kernelSize.value * 8 + (kernelSize.value - 1) * 3 + 2}px`,
}));
const poolingOutputStyle = computed(() => ({ "--output-cols": poolingColumns.value }));
const poolingCellClass = (index) => ({ active: index <= poolingStep.value.output, current: index === poolingStep.value.output });
const poolingInputClass = (index) => {
	const row = Math.floor((index - 1) / 4);
	const col = (index - 1) % 4;
	return { highlighted: row >= poolingStep.value.row && row <= poolingStep.value.row + kernelSize.value - 1 && col >= poolingStep.value.col && col <= poolingStep.value.col + kernelSize.value - 1 };
};
</script>

<template>
	<div class="node-preview" :class="`preview-${previewType}`" aria-hidden="true">
		<template v-if="previewType === 'pooling'">
			<div class="preview-grid input-grid" :style="poolingWindowStyle">
				<span v-for="index in 16" :key="index" :class="poolingInputClass(index)"></span>
				<i class="window-mark"></i>
			</div>
			<span class="preview-arrow">→</span>
			<div class="preview-grid output-grid" :style="poolingOutputStyle">
				<span v-for="(_, index) in poolingSteps" :key="index" :class="poolingCellClass(index)"></span>
			</div>
		</template>

		<template v-else-if="previewType === 'binary'">
			<div class="merge-flow"><span class="preview-dot"></span><span class="merge-stem stem-top"></span><span class="preview-dot second"></span><span class="merge-stem stem-bottom"></span></div>
			<span class="preview-arrow">→</span><span class="preview-result"></span>
		</template>

		<template v-else-if="previewType === 'shape'">
			<div class="preview-shape wide"><span></span><span></span><span></span></div><span class="preview-arrow">→</span><div class="preview-shape narrow"><span></span><span></span><span></span></div>
		</template>

		<template v-else-if="previewType === 'loss'">
			<div class="loss-flow"><span class="loss-source"></span><span class="loss-source target"></span></div><span class="preview-arrow">→</span><span class="preview-result error-result"></span>
		</template>

		<template v-else-if="previewType === 'base'">
			<div class="preview-base-block source-block"><span></span><span></span><span></span></div><span class="preview-arrow">→</span><div class="preview-base-block"><span></span><span></span><span></span></div>
		</template>

		<template v-else>
			<div class="preview-line input-line"></div><span class="preview-arrow">→</span><div class="preview-line output-line"></div>
		</template>
	</div>
</template>

<style scoped>
.node-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	width: 142px;
	min-height: 68px;
	color: color-mix(in srgb, var(--node-color, #5672b8) 88%, white);
}

.preview-arrow { color: var(--node-color, #5672b8); font-size: 19px; line-height: 1; animation: flow-pulse 0.72s ease-in-out infinite alternate; }
.preview-grid { position: relative; display: grid; gap: 3px; padding: 4px; border: 1.5px solid currentColor; border-radius: 5px; }
.input-grid { grid-template-columns: repeat(4, 8px); grid-template-rows: repeat(4, 8px); }
.output-grid { grid-template-columns: repeat(var(--output-cols), 11px); }
.preview-grid span,
.preview-result,
.preview-dot,
.preview-base-block,
.preview-shape span,
.preview-line,
.loss-source { display: block; background: currentColor; }
.input-grid span { background: color-mix(in srgb, currentColor 20%, transparent); }
.input-grid span.highlighted { background: currentColor; }
.output-grid span { width: 11px; height: 11px; background: color-mix(in srgb, currentColor 16%, transparent); }
.output-grid span.active { background: color-mix(in srgb, currentColor 70%, white); }
.output-grid span.current { box-shadow: 0 0 0 1px #fff, 0 0 7px currentColor; }

.window-mark {
	position: absolute;
	top: 4px;
	left: 4px;
	width: var(--window-size);
	height: var(--window-size);
	border: 2px solid #fff;
	border-radius: 3px;
	transform: translate(var(--window-x), var(--window-y));
	transition: transform 0.48s ease;
}

.merge-flow,
.loss-flow { position: relative; width: 42px; height: 42px; }
.preview-dot { position: absolute; width: 13px; height: 13px; border-radius: 50%; top: 2px; left: 2px; animation: input-pulse 1.4s ease-in-out infinite; }
.preview-dot.second { top: 27px; opacity: 0.55; animation-delay: 0.35s; }
.merge-stem { position: absolute; left: 13px; width: 24px; height: 2px; background: currentColor; transform-origin: left center; }
.stem-top { top: 9px; transform: rotate(27deg); }
.stem-bottom { top: 32px; transform: rotate(-27deg); opacity: 0.55; }
.preview-result { width: 19px; height: 19px; border-radius: 5px; animation: result-pulse 1.4s ease-in-out infinite 0.7s; }

.preview-shape { display: grid; gap: 3px; padding: 4px; border: 1.5px solid currentColor; border-radius: 4px; }
.preview-shape span { height: 4px; border-radius: 2px; opacity: 0.7; }
.preview-shape.wide { width: 38px; grid-template-columns: repeat(3, 1fr); animation: shape-source 1.8s ease-in-out infinite; }
.preview-shape.narrow { width: 22px; grid-template-columns: 1fr; animation: shape-result 1.8s ease-in-out infinite; }

.loss-source { position: absolute; width: 18px; height: 8px; top: 6px; left: 2px; border-radius: 5px; }
.loss-source.target { top: 27px; left: 16px; opacity: 0.5; }
.error-result { border-radius: 50%; background: transparent; border: 3px solid currentColor; }
.preview-base-block { display: flex; flex-direction: column; gap: 3px; width: 19px; padding: 4px; border-radius: 4px; }
.preview-base-block span { height: 2px; border-radius: 2px; background: #fff; opacity: 0.7; }
.source-block { opacity: 0.5; }
.preview-line { width: 32px; height: 5px; border-radius: 5px; }
.output-line { width: 19px; opacity: 0.6; }

@keyframes flow-pulse { from { opacity: 0.4; transform: translateX(-2px); } to { opacity: 1; transform: translateX(2px); } }
@keyframes input-pulse { 0%, 100% { transform: scale(0.8); opacity: 0.4; } 45% { transform: scale(1); opacity: 1; } }
@keyframes result-pulse { 0%, 35%, 100% { transform: scale(0.82); opacity: 0.35; } 65% { transform: scale(1.08); opacity: 1; } }
@keyframes shape-source { 0%, 40%, 100% { opacity: 1; } 70% { opacity: 0.35; transform: translateX(4px); } }
@keyframes shape-result { 0%, 35%, 100% { opacity: 0.35; transform: translateX(-4px); } 70% { opacity: 1; transform: translateX(0); } }
</style>
