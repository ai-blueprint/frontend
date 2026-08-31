<script setup>
import { computed } from "vue"; // 引入Vue计算节点预览类型

const props = defineProps({
	opcode: { type: String, required: true }, // 节点操作码决定示意图
});

const previewType = computed(() => {
	if (props.opcode === "pooling") return "pooling"; // 池化需要展示窗口缩小过程
	if (["add", "sub", "mul", "div", "matmul", "bmm", "dot"].includes(props.opcode)) return "binary"; // 两个输入合成一个输出
	if (["reshape", "transpose", "permute", "squeeze", "unsqueeze", "flatten", "unflatten", "pad", "slice", "select", "cat", "stack", "expand", "roll", "flip", "chunk"].includes(props.opcode)) return "shape"; // 形状节点重点展示尺寸或排列变化
	if (props.opcode.endsWith("_loss")) return "loss"; // 损失节点比较预测与目标
	if (["input", "output", "debug", "tensor_like"].includes(props.opcode)) return "base"; // 基础节点展示数据入口或出口
	return "unary"; // 其余大多数节点都是一进一出的变换
});
</script>

<template>
	<div class="node-preview" :class="`preview-${previewType}`" aria-hidden="true">
		<template v-if="previewType === 'pooling'">
			<div class="preview-grid input-grid">
				<span v-for="index in 16" :key="index" :class="{ highlighted: [6, 7, 10, 11].includes(index) }"></span>
			</div>
			<span class="preview-arrow">→</span>
			<div class="preview-grid output-grid"><span v-for="index in 4" :key="index"></span></div>
		</template>

		<template v-else-if="previewType === 'binary'">
			<span class="preview-dot"></span><span class="preview-dot"></span><span class="preview-arrow">→</span><span class="preview-result"></span>
		</template>

		<template v-else-if="previewType === 'shape'">
			<div class="preview-shape wide"></div><span class="preview-arrow">→</span><div class="preview-shape narrow"></div>
		</template>

		<template v-else-if="previewType === 'loss'">
			<span class="preview-pill">预测</span><span class="preview-pill">目标</span><span class="preview-arrow">→</span><span class="preview-result"></span>
		</template>

		<template v-else-if="previewType === 'base'">
			<div class="preview-base-block"></div><span class="preview-arrow">→</span><div class="preview-base-block"></div>
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
	gap: 5px;
	height: 28px;
	margin-bottom: 6px;
	opacity: 0.92;
}

.preview-arrow {
	font-size: 15px;
	font-weight: 700;
	line-height: 1;
	color: rgba(255, 255, 255, 0.9);
}

.preview-grid {
	display: grid;
	gap: 2px;
	padding: 2px;
	border: 1px solid rgba(255, 255, 255, 0.7);
	border-radius: 3px;
}

.input-grid {
	grid-template-columns: repeat(4, 5px);
	grid-template-rows: repeat(4, 5px);
}

.output-grid {
	grid-template-columns: repeat(2, 7px);
	grid-template-rows: repeat(2, 7px);
}

.preview-grid span,
.preview-result,
.preview-dot,
.preview-base-block,
.preview-shape,
.preview-line,
.preview-pill {
	display: block;
	background: rgba(255, 255, 255, 0.7);
}

.input-grid span {
	background: rgba(255, 255, 255, 0.35);
}

.input-grid span.highlighted {
	background: #fff;
}

.preview-dot,
.preview-result {
	width: 12px;
	height: 12px;
	border-radius: 50%;
}

.preview-result {
	border-radius: 3px;
}

.preview-dot:nth-child(2) {
	margin-left: -1px;
	opacity: 0.65;
}

.preview-shape {
	height: 10px;
	border: 1px solid rgba(255, 255, 255, 0.75);
	background: transparent;
}

.preview-shape.wide {
	width: 27px;
}

.preview-shape.narrow {
	width: 12px;
	height: 17px;
}

.preview-pill {
	padding: 2px 4px;
	border-radius: 3px;
	font-size: 8px;
	line-height: 1;
	color: var(--node-color);
}

.preview-base-block {
	width: 14px;
	height: 14px;
	border-radius: 3px;
}

.preview-line {
	width: 27px;
	height: 4px;
	border-radius: 3px;
}

.output-line {
	width: 16px;
	opacity: 0.65;
}
</style>
