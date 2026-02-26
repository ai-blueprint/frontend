<script setup>
import TopBar from '@/components/TopBar.vue'       // 引入顶部栏组件
import WorkSpace from '@/components/WorkSpace.vue' // 引入工作区组件
</script>

<template>
    <div class="app"> <!-- 根容器 -->
        <TopBar /> <!-- 顶部栏 -->
        <WorkSpace /> <!-- 工作区 -->
    </div>
</template>

<style scoped>
.app {
    width: 100%;
    /* 铺满宽度 */
    height: 100%;
    /* 铺满高度 */
    display: flex;
    /* 弹性布局 */
    flex-direction: column;
    /* 纵向排列：顶部栏 + 工作区 */
    overflow: hidden;
    /* 隐藏溢出内容 */
    user-select: none;
    /* 禁止选中 */
}
</style>
