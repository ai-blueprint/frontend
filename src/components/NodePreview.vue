<script setup>
import { computed } from "vue";
import TensorResult from "@/components/TensorResult.vue";

const props = defineProps({
	opcode: { type: String, required: true },
	params: { type: Object, default: () => ({}) },
	result: { type: Object, default: null },
});

const previewType = computed(() => {
	if (props.opcode === "pooling") return "pooling";
	if (["add", "sub", "mul", "div", "matmul", "bmm", "dot"].includes(props.opcode)) return "binary";
	if (["reshape", "transpose", "permute", "squeeze", "unsqueeze", "flatten", "unflatten", "pad", "slice", "select", "cat", "stack", "expand", "roll", "flip", "chunk"].includes(props.opcode)) return "shape";
	if (props.opcode.endsWith("_loss")) return "loss";
	return "unary";
});

const collectTensors = (value, tensors = []) => {
	if (!value || typeof value !== "object" || tensors.length >= 2) return tensors;
	if (value.kind === "tensor") {
		tensors.push(value);
		return tensors;
	}
	for (const item of Object.values(value)) {
		collectTensors(item, tensors);
		if (tensors.length >= 2) break;
	}
	return tensors;
};

const inputTensors = computed(() => collectTensors(props.result?.inputs));
const outputTensors = computed(() => collectTensors(props.result?.outputs));
const hasActualData = computed(() => !!(inputTensors.value.length || outputTensors.value.length));
const tensorHeight = (count) => count > 1 ? 24 : 52;
</script>

<template>
	<div class="node-preview" :class="[`preview-${previewType}`, { 'has-data': hasActualData }]" aria-label="节点输入输出数据">
		<template v-if="hasActualData">
			<div class="tensor-step">
				<TensorResult v-for="(tensor, index) in inputTensors" :key="index" :value="tensor" :max-width="62" :max-height="tensorHeight(inputTensors.length)" />
				<div v-if="!inputTensors.length" class="empty-tensor"></div>
			</div>
			<span class="preview-arrow" aria-hidden="true">›</span>
			<div class="tensor-step">
				<TensorResult v-for="(tensor, index) in outputTensors" :key="index" :value="tensor" :max-width="62" :max-height="tensorHeight(outputTensors.length)" />
				<div v-if="!outputTensors.length" class="empty-tensor"></div>
			</div>
		</template>

		<template v-else-if="previewType === 'pooling'">
			<div class="shape-grid input-shape"><i v-for="index in 9" :key="index"></i></div>
			<span class="preview-arrow" aria-hidden="true">›</span>
			<div class="shape-grid output-shape"><i v-for="index in 4" :key="index"></i></div>
		</template>

		<template v-else-if="previewType === 'binary'">
			<div class="merge-shape"><i></i><i></i><b></b><b></b></div><span class="preview-arrow" aria-hidden="true">›</span><div class="result-shape"></div>
		</template>

		<template v-else-if="previewType === 'shape'">
			<div class="shape-block wide"></div><span class="preview-arrow" aria-hidden="true">›</span><div class="shape-block narrow"></div>
		</template>

		<template v-else-if="previewType === 'loss'">
			<div class="compare-shape"><i></i><i></i></div><span class="preview-arrow" aria-hidden="true">›</span><div class="result-shape circle"></div>
		</template>

		<template v-else>
			<div class="shape-block line"></div><span class="preview-arrow" aria-hidden="true">›</span><div class="shape-block line short"></div>
		</template>
	</div>
</template>

<style scoped>
.node-preview { display: flex; align-items: center; justify-content: center; gap: 8px; width: 164px; min-height: 62px; color: var(--node-color, #5672b8); }
.preview-arrow { color: var(--node-color, #5672b8); font-size: 30px; font-weight: 300; line-height: 0.7; }
.tensor-step { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; width: 62px; height: 52px; overflow: hidden; }
.empty-tensor { width: 46px; height: 38px; border: 1px dashed color-mix(in srgb, currentColor 65%, transparent); border-radius: 5px; }
.shape-grid { display: grid; gap: 3px; padding: 4px; border: 1.5px solid currentColor; border-radius: 5px; }
.input-shape { grid-template-columns: repeat(3, 9px); grid-template-rows: repeat(3, 9px); }
.output-shape { grid-template-columns: repeat(2, 12px); grid-template-rows: repeat(2, 12px); }
.shape-grid i { display: block; background: color-mix(in srgb, currentColor 28%, transparent); border-radius: 2px; }
.shape-grid i:nth-child(5) { background: currentColor; }
.merge-shape { position: relative; width: 40px; height: 40px; }
.merge-shape i { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: currentColor; left: 1px; }
.merge-shape i:nth-child(2) { top: 27px; opacity: 0.55; }
.merge-shape b { position: absolute; left: 12px; width: 24px; height: 2px; background: currentColor; transform-origin: left center; }
.merge-shape b:nth-of-type(1) { top: 9px; transform: rotate(28deg); }
.merge-shape b:nth-of-type(2) { top: 31px; transform: rotate(-28deg); opacity: 0.55; }
.result-shape { width: 20px; height: 20px; border-radius: 5px; background: currentColor; }
.result-shape.circle { border-radius: 50%; background: transparent; border: 3px solid currentColor; }
.shape-block { border: 1.5px solid currentColor; border-radius: 4px; background: repeating-linear-gradient(0deg, transparent 0 5px, color-mix(in srgb, currentColor 65%, transparent) 5px 7px); }
.shape-block.wide { width: 43px; height: 28px; }
.shape-block.narrow { width: 25px; height: 38px; }
.shape-block.line { width: 36px; height: 6px; border: 0; border-radius: 5px; background: currentColor; }
.shape-block.line.short { width: 21px; opacity: 0.55; }
.compare-shape { position: relative; width: 40px; height: 40px; }
.compare-shape i { position: absolute; width: 26px; height: 8px; border-radius: 8px; background: currentColor; top: 3px; left: 1px; }
.compare-shape i:nth-child(2) { top: 28px; left: 12px; opacity: 0.5; }
</style>
