<script setup>
import CategoryBar from '@/components/CategoryBar.vue' // 引入分类栏组件
import NodeList from '@/components/NodeList.vue'       // 引入节点列表组件
import Blueprint from '@/components/Blueprint.vue'     // 引入蓝图组件
</script>

<template>
    <div class="workspace"> <!-- 工作区容器 -->
        <CategoryBar /> <!-- 分类栏 -->
        <NodeList /> <!-- 节点列表 -->
        <Blueprint /> <!-- 蓝图区域 -->
    </div>
</template>

<style scoped>
.workspace {
    display: flex;
    /* 横向排列 */
    flex: 1;
    /* 占满剩余高度 */
    overflow: hidden;
    /* 隐藏溢出 */
}
</style>
