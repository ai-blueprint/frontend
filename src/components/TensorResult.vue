<script setup>
/* 这个组件只负责把一个序列化输出显示为标量、向量、二维热力表或高维预览。 */
import { computed } from "vue"; // 引入派生预览能力
import { createResultPreview } from "@/utils/resultPreview.js"; // 引入有边界的结果转换工具

const props = defineProps({ value: { required: true } }); // 接收后端单个serializedValue
const preview = computed(() => createResultPreview(props.value)); // 数据变化时重新生成安全预览

// --- 格式化单个显示值 ---
const formatValue = (value) => {
	if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toPrecision(5); // 浮点数限制有效位避免撑宽
	if (typeof value === "string") return value; // 字符串直接显示
	return JSON.stringify(value); // 布尔、对象和空值统一序列化
};


// --- 计算二维热力颜色 ---
const heatStyle = (value) => {
	const numbers = preview.value.values.filter((item) => Number.isFinite(Number(item))).map(Number); // 只用数值计算色阶
	if (!numbers.length || !Number.isFinite(Number(value))) return {}; // 非数值单元保持普通表格样式
	const minimum = Math.min(...numbers); // 获取预览最小值
	const maximum = Math.max(...numbers); // 获取预览最大值
	const ratio = maximum === minimum ? 0.5 : (Number(value) - minimum) / (maximum - minimum); // 归一化到0到1
	return { backgroundColor: `rgba(95, 56, 223, ${0.12 + ratio * 0.68})`, color: ratio > 0.58 ? "#ffffff" : "#25233a" }; // 使用现有紫色主色表达大小
};
</script>

<template>
	<div class="result-preview">
		<div v-if="preview.kind === 'tensor'" class="result-meta">
			<span>{{ preview.dtype || "tensor" }}</span>
			<span>{{ preview.device || "" }}</span>
			<span>[{{ preview.shape.join(" × ") }}]</span>
		</div>

		<strong v-if="preview.kind === 'tensor' && preview.dimensions === 0" class="scalar-value">{{ formatValue(preview.values[0]) }}</strong>
		<div v-else-if="preview.kind === 'tensor' && preview.dimensions === 1" class="value-row">
			<code v-for="(item, index) in preview.values" :key="index">{{ formatValue(item) }}</code>
		</div>
		<div v-else-if="preview.kind === 'tensor' && preview.dimensions === 2" class="matrix-wrap">
			<table class="matrix-table">
				<tbody>
					<tr v-for="(row, rowIndex) in preview.matrix" :key="rowIndex">
						<td v-for="(item, columnIndex) in row" :key="columnIndex" :style="heatStyle(item)">{{ formatValue(item) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div v-else-if="preview.kind === 'tensor'" class="higher-preview">
			<div class="dimension-label">{{ preview.dimensions }}维张量的扁平预览</div>
			<div class="value-row"><code v-for="(item, index) in preview.values" :key="index">{{ formatValue(item) }}</code></div>
		</div>
		<strong v-else-if="preview.kind === 'scalar'" class="scalar-value">{{ formatValue(preview.value ?? preview.values) }}</strong>
		<pre v-else class="object-preview">{{ formatValue(preview.values ?? preview.value ?? preview) }}</pre>

		<div v-if="preview.previewTruncated" class="truncated-label">仅显示前 {{ preview.values.length }} / {{ preview.totalElements }} 项</div>
	</div>
</template>

<style scoped>
.result-preview { min-width: 180px; max-width: min(420px, 72vw); color: #25233a; font-size: 12px; user-select: text; }
.result-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 7px; color: #6d6a7d; }
.result-meta span { padding: 2px 5px; border-radius: 4px; background: #f0f1f7; }
.scalar-value { display: block; font-size: 18px; color: #5f38df; }
.value-row { display: flex; flex-wrap: wrap; gap: 4px; max-height: 160px; overflow: auto; }
.value-row code { max-width: 110px; padding: 3px 5px; overflow: hidden; text-overflow: ellipsis; border: 1px solid #e0e1e8; border-radius: 3px; background: #f7f7fa; }
.matrix-wrap { max-width: 100%; overflow: auto; }
.matrix-table { border-spacing: 2px; table-layout: fixed; }
.matrix-table td { min-width: 42px; max-width: 74px; height: 32px; padding: 3px; overflow: hidden; text-align: center; text-overflow: ellipsis; border-radius: 2px; font-variant-numeric: tabular-nums; }
.dimension-label, .truncated-label { margin-bottom: 6px; color: #777486; }
.truncated-label { margin-top: 7px; margin-bottom: 0; }
.object-preview { max-height: 160px; overflow: auto; white-space: pre-wrap; word-break: break-word; }
</style>
