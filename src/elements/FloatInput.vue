<script setup>
import { ref, watch } from 'vue'                   // 引入Vue组合式API
import Node from '@/commands/Node.js'               // 引入节点命令

const props = defineProps({                         // 接收父组件传入的属性
    paramKey: { type: String, required: true },       // 参数标识
    param: { type: Object, required: true },          // 参数完整对象
    nodeId: { type: String, required: true },         // 所属节点ID
})

const currentValue = ref(props.param.value)         // 当前输入值
const hasRange = !!(props.param.range && props.param.range.length === 2) // 是否有范围限制
const minValue = hasRange ? props.param.range[0] : null // 最小值
const maxValue = hasRange ? props.param.range[1] : null // 最大值

// --- 输入值变化时更新节点参数 ---
const onChange = (value) => {
    let parsed = parseFloat(value)                    // 将输入转为浮点数
    if (isNaN(parsed)) parsed = 0                     // 非数字默认为0
    if (hasRange) {                                   // 有范围限制时钳制值
        if (parsed < minValue) parsed = minValue        // 不能低于最小值
        if (parsed > maxValue) parsed = maxValue        // 不能超过最大值
    }
    currentValue.value = parsed                       // 更新本地值
    Node.updateParam(props.nodeId, props.paramKey, parsed) // 同步到节点数据
}

// --- 监听外部参数变化（撤销重做时同步）---
watch(() => props.param.value, (newVal) => {
    currentValue.value = newVal                       // 外部变化时同步本地值
})
</script>

<template>
    <div class="float-input"> <!-- 浮点数输入容器 -->
        <label class="input-label">{{ param.label }}</label> <!-- 参数名称标签 -->
        <div class="input-row"> <!-- 输入行 -->
            <input type="number" class="number-input" :value="currentValue" :min="minValue" :max="maxValue" :step="0.01" @change="onChange($event.target.value)" /> <!-- 数字输入框 -->
            <input v-if="hasRange" type="range" class="range-slider" :value="currentValue" :min="minValue" :max="maxValue" :step="0.01" @input="onChange($event.target.value)" /> <!-- 有范围时显示滑块 -->
        </div>
    </div>
</template>

<style scoped>
.float-input {
    margin-bottom: 8px;
    /* 底部间距 */
}

.input-label {
    display: block;
    /* 标签独占一行 */
    font-size: 12px;
    /* 标签字号 */
    color: #666666;
    /* 灰色标签 */
    margin-bottom: 4px;
    /* 标签与输入框间距 */
}

.input-row {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 8px;
    /* 元素间距 */
}

.number-input {
    width: 80px;
    /* 输入框宽度 */
    padding: 4px 6px;
    /* 输入框内边距 */
    background: #f5f5f5;
    /* 浅灰背景 */
    border: 1px solid #d0d0d0;
    /* 浅色边框 */
    border-radius: 4px;
    /* 圆角 */
    color: #333333;
    /* 深色文字 */
    font-size: 13px;
    /* 字号 */
    outline: none;
    /* 去除聚焦边框 */
}

.number-input:focus {
    border-color: #4a90d9;
    /* 聚焦时蓝色边框 */
}

.range-slider {
    flex: 1;
    /* 滑块占满剩余空间 */
    height: 4px;
    /* 滑块高度 */
    accent-color: #4a90d9;
    /* 滑块主色调 */
}
</style>
