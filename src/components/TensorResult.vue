<script setup>
/* 这个组件只显示无文字的负黄、零白、正蓝张量方块图，并保持张量真实末两维形状。 */
import { computed } from "vue"; // 引入切片排列和方块尺寸派生能力
import { createResultPreview, getSliceColumns } from "@/utils/resultPreview.js"; // 引入真实形状切片工具
import { getTensorColorStyle } from "@/utils/tensorColor.js"; // 引入按正负号区分的固定颜色映射

const props = defineProps({
	value: { required: true }, // 接收后端单个序列化张量
	maxWidth: { type: Number, default: 180 }, // 节点下方可视化最大宽度
	maxHeight: { type: Number, default: 130 }, // 节点下方可视化最大高度
});
const preview = computed(() => createResultPreview(props.value)); // 数据变化时重新拆分张量切片

// --- 计算全部切片在节点下方的整体缩放 ---
const layout = computed(() => {
	const rows = Math.max(1, preview.value.rows || 1); // 单切片真实行数
	const columns = Math.max(1, preview.value.columns || 1); // 单切片真实列数
	const sliceCount = Math.max(1, preview.value.sliceCount || 1); // 高维张量切片数量
	const sliceColumns = getSliceColumns(sliceCount, rows, columns, props.maxWidth / props.maxHeight); // 外层排列适配可用区域
	const sliceRows = Math.ceil(sliceCount / sliceColumns); // 计算外层切片行数
	const cellGap = preview.value.values.length > 4096 ? 0 : 1; // 大张量取消方块间隙
	const sliceGap = sliceCount > 1 ? 3 : 0; // 高维切片之间保留清晰分隔
	const horizontalGaps = sliceColumns * (columns - 1) * cellGap + (sliceColumns - 1) * sliceGap; // 统计总横向间隙
	const verticalGaps = sliceRows * (rows - 1) * cellGap + (sliceRows - 1) * sliceGap; // 统计总纵向间隙
	const cellWidth = (props.maxWidth - horizontalGaps) / (sliceColumns * columns); // 宽度允许的方块尺寸
	const cellHeight = (props.maxHeight - verticalGaps) / (sliceRows * rows); // 高度允许的方块尺寸
	const cellSize = Math.max(0.1, Math.min(18, cellWidth, cellHeight)); // 整体缩放但始终保持正方形
	return {
		outer: { gridTemplateColumns: `repeat(${sliceColumns}, auto)`, gap: `${sliceGap}px` },
		inner: { gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`, gridAutoRows: `${cellSize}px`, gap: `${cellGap}px`, width: `${columns * cellSize + (columns - 1) * cellGap}px`, height: `${rows * cellSize + (rows - 1) * cellGap}px`, "--cell-size": `${cellSize}px` },
	}; // 返回切片外层和方块内层布局
});
</script>

<template>
	<div v-if="preview.kind === 'tensor'" class="tensor-result" :style="layout.outer">
		<div v-for="(slice, sliceIndex) in preview.slices" :key="sliceIndex" class="tensor-slice" :style="layout.inner">
			<span v-for="(item, index) in slice" :key="index" class="tensor-cell" :style="getTensorColorStyle(item)"></span>
		</div>
	</div>
</template>

<style scoped>
.tensor-result { display: grid; align-items: center; justify-items: center; overflow: hidden; }
.tensor-slice { display: grid; flex: none; overflow: hidden; }
.tensor-cell { display: block; width: var(--cell-size); height: var(--cell-size); border: 1px solid rgba(33, 33, 33, .08); border-radius: min(2px, calc(var(--cell-size) / 5)); box-sizing: border-box; }
</style>
