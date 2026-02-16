<script setup>
import { ref, watch } from 'vue'                   // 引入Vue组合式API
import Node from '@/commands/Node.js'               // 引入节点命令

const props = defineProps({                         // 接收父组件传入的属性
    paramKey: { type: String, required: true },       // 参数标识
    param: { type: Object, required: true },          // 参数完整对象
    nodeId: { type: String, required: true },         // 所属节点ID
})

const currentValue = ref(props.param.value)         // 当前输入值

// --- 输入值变化时更新节点参数 ---
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
    <div class="str-input"> <!-- 字符串输入容器 -->
        <label class="input-label">{{ param.label }}</label> <!-- 参数名称标签 -->
        <var-input :model-value="currentValue" @update:model-value="onChange" size="small" variant="outlined" /> <!-- Varlet输入框组件 -->
    </div>
</template>

<style scoped>
.str-input {
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
</style>
