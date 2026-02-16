<script setup>
import { ref, computed, watch } from 'vue'          // 引入Vue组合式API
import Node from '@/commands/Node.js'               // 引入节点命令

const props = defineProps({                         // 接收父组件传入的属性
    paramKey: { type: String, required: true },       // 参数标识
    param: { type: Object, required: true },          // 参数完整对象
    nodeId: { type: String, required: true },         // 所属节点ID
})

const currentValue = ref(props.param.value)         // 当前选中值

// --- 将options对象转为选项数组 ---
const optionList = computed(() => {
    const options = props.param.options || {}          // 获取枚举选项
    return Object.keys(options).map(key => ({         // 遍历选项
        value: key,                                     // 选项值
        label: options[key],                            // 选项显示名
    }))
})

// --- 选择变化时更新节点参数 ---
const onChange = (value) => {
    currentValue.value = value                        // 更新本地值
    Node.updateParam(props.nodeId, props.paramKey, value) // 同步到节点数据
}

// --- 监听外部参数变化（撤销重做时同步）---
watch(() => props.param.value, (newVal) => {
    currentValue.value = newVal                       // 外部变化时同步本地值
})
</script>

<template>
    <div class="enum-select"> <!-- 枚举选择容器 -->
        <label class="select-label">{{ param.label }}</label> <!-- 参数名称标签 -->
        <select class="select-box" :value="currentValue" @change="onChange($event.target.value)"> <!-- 下拉选择框 -->
            <option v-for="option in optionList" :key="option.value" :value="option.value">{{ option.label }}</option> <!-- 枚举选项 -->
        </select>
    </div>
</template>

<style scoped>
.enum-select {
    margin-bottom: 8px;
    /* 底部间距 */
}

.select-label {
    display: block;
    /* 标签独占一行 */
    font-size: 12px;
    /* 标签字号 */
    color: #666666;
    /* 灰色标签 */
    margin-bottom: 4px;
    /* 标签与输入框间距 */
}

.select-box {
    width: 100%;
    /* 下拉框占满宽度 */
    padding: 4px 6px;
    /* 内边距 */
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
    cursor: pointer;
    /* 鼠标指针 */
}

.select-box:focus {
    border-color: #4a90d9;
    /* 聚焦时蓝色边框 */
}
</style>
