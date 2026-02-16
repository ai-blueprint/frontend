<script setup>
import { computed } from 'vue'                     // 引入Vue计算属性
import store from '@/store.js'                     // 引入全局状态
import NodeCmd from '@/commands/Node.js'            // 引入节点命令

import IntInput from '@/elements/IntInput.vue'     // 整数输入组件
import FloatInput from '@/elements/FloatInput.vue' // 浮点数输入组件
import BoolSwitch from '@/elements/BoolSwitch.vue' // 布尔开关组件
import StrInput from '@/elements/StrInput.vue'     // 字符串输入组件
import ListInput from '@/elements/ListInput.vue'   // 列表输入组件
import EnumSelect from '@/elements/EnumSelect.vue' // 枚举选择组件

// --- 参数类型到组件的映射 ---
const elementMap = {
    int: IntInput,                                    // 整数类型 → 整数输入
    float: FloatInput,                                // 浮点类型 → 浮点输入
    bool: BoolSwitch,                                 // 布尔类型 → 开关
    str: StrInput,                                    // 字符串类型 → 文本输入
    list: ListInput,                                  // 列表类型 → 列表输入
    enum: EnumSelect,                                 // 枚举类型 → 下拉选择
}

// --- 获取当前面板绑定的节点 ---
const currentNode = computed(() => {
    if (!store.nodePanel.nodeId) return null           // 没有绑定节点返回null
    return NodeCmd.getById(store.nodePanel.nodeId)     // 查找节点对象
})

// --- 获取节点参数列表 ---
const paramEntries = computed(() => {
    if (!currentNode.value) return []                 // 没有节点返回空数组
    const params = currentNode.value.data?.params || {} // 获取参数对象
    return Object.entries(params)                     // 转为[key, param]数组
})

// --- 是否有参数可显示 ---
const hasParams = computed(() => {
    return paramEntries.value.length > 0              // 有参数项才显示面板
})
</script>

<template>
    <div v-if="store.nodePanel.visible && hasParams" class="node-panel" :style="{
        left: store.nodePanel.x + 'px',
        top: store.nodePanel.y + 'px',
    }"> <!-- 节点参数面板 -->
        <div class="panel-title">节点的参数</div> <!-- 面板标题 -->
        <div class="panel-content"> <!-- 面板内容区域 -->
            <component v-for="[key, param] in paramEntries" :key="key" :is="elementMap[param.type]" :paramKey="key" :param="param" :nodeId="store.nodePanel.nodeId" /> <!-- 动态渲染参数组件 -->
        </div>
    </div>
</template>

<style scoped>
.node-panel {
    position: fixed;
    /* 固定定位 */
    transform: translateX(-50%);
    /* 水平居中 */
    background: #ffffff;
    /* 白色背景 */
    border: 1px solid #e0e0e0;
    /* 浅色边框 */
    border-radius: 8px;
    /* 圆角 */
    padding: 12px;
    /* 内边距 */
    z-index: 1000;
    /* 高层级 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    /* 阴影 */
    min-width: 200px;
    /* 最小宽度 */
    max-width: 280px;
    /* 最大宽度 */
    max-height: 400px;
    /* 最大高度 */
    overflow-y: auto;
    /* 内容超出时滚动 */
}

.panel-title {
    font-size: 13px;
    /* 标题字号 */
    font-weight: 600;
    /* 标题加粗 */
    color: #333333;
    /* 深色标题 */
    margin-bottom: 10px;
    /* 标题下方间距 */
    padding-bottom: 6px;
    /* 底部内边距 */
    border-bottom: 1px solid #e0e0e0;
    /* 底部分隔线 */
}

.panel-content {
    display: flex;
    /* 纵向排列 */
    flex-direction: column;
    /* 垂直布局 */
    gap: 4px;
    /* 参数间距 */
}
</style>
