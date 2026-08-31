<script setup>
import { computed } from "vue";

const props = defineProps({
	opcode: { type: String, required: true },
});

const previewType = computed(() => {
	if (props.opcode === "pooling") return "pooling";
	if (["add", "sub", "mul", "div", "matmul", "bmm", "dot"].includes(props.opcode)) return "binary";
	if (["reshape", "transpose", "permute", "squeeze", "unsqueeze", "flatten", "unflatten", "pad", "slice", "select", "cat", "stack", "expand", "roll", "flip", "chunk"].includes(props.opcode)) return "shape";
	if (props.opcode.endsWith("_loss")) return "loss";
	if (["input", "output", "debug", "tensor_like"].includes(props.opcode)) return "base";
	return "unary";
});

const previewCaption = computed(() => ({
	pooling: "看局部，变更小",
	binary: "两路合成一路",
	shape: "内容不变，形状变",
	loss: "预测和目标的差",
	base: "数据进出这里",
	unary: "输入变成输出",
})[previewType.value]);
</script>

<template>
	<div class="node-preview" :class="`preview-${previewType}`" aria-hidden="true">
		<template v-if="previewType === 'pooling'">
			<div class="pool-flow">
				<div class="preview-grid input-grid">
					<span v-for="index in 16" :key="index" :class="{ highlighted: [6, 7, 10, 11].includes(index) }"></span>
					<i class="window-mark"></i>
				</div>
				<span class="flow-word">取一块</span>
			</div>
			<span class="preview-arrow">→</span>
			<div class="pool-flow">
				<div class="preview-grid output-grid"><span v-for="index in 4" :key="index"></span></div>
				<span class="flow-word">留一个</span>
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
	color: var(--node-color, #5672b8);
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
}

.output-grid {
	grid-template-columns: repeat(2, 12px);
	grid-template-rows: repeat(2, 12px);
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

.input-grid span { background: color-mix(in srgb, currentColor 22%, transparent); }
.input-grid span.highlighted { background: currentColor; }

.window-mark {
	position: absolute;
	top: 20px;
	left: 20px;
	width: 21px;
	height: 21px;
	border: 2px solid currentColor;
	border-radius: 3px;
	box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 18%, transparent);
}

.pool-flow { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.flow-word { font-size: 9px; color: #52627c; white-space: nowrap; }

.merge-flow,
.loss-flow { position: relative; width: 52px; height: 52px; }
.preview-dot { position: absolute; width: 17px; height: 17px; border-radius: 50%; top: 2px; left: 2px; }
.preview-dot.second { top: 33px; left: 2px; opacity: 0.62; }
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

.preview-pill { position: absolute; left: 0; padding: 5px 8px; border-radius: 12px; font-size: 10px; line-height: 1; color: #fff; }
.preview-pill.target { top: 34px; left: 10px; opacity: 0.56; }
.preview-pill:not(.target) { top: 3px; }
.loss-stem { left: 30px; top: 27px; width: 25px; transform: rotate(90deg); }
.error-result { border-radius: 50%; background: transparent; border: 3px solid currentColor; box-shadow: inset 0 0 0 4px color-mix(in srgb, currentColor 20%, transparent); }

.preview-base-block { display: flex; flex-direction: column; gap: 3px; width: 22px; padding: 5px; border-radius: 4px; }
.preview-base-block span { height: 3px; border-radius: 2px; background: #fff; opacity: 0.7; }
.source-block { opacity: 0.58; }
.preview-line { width: 38px; height: 6px; border-radius: 6px; }
.output-line { width: 23px; opacity: 0.62; }

.preview-caption { flex-basis: 100%; font-size: 11px; line-height: 1.2; text-align: center; color: #52627c; }
</style>
