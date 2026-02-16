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
    display: flex;
    /* 纵向排列 */
    flex-direction: column;
    /* 垂直布局 */
    width: 100%;
    /* 铺满宽度 */
    height: 100%;
    /* 铺满高度 */
    overflow: hidden;
    /* 隐藏溢出 */
}
</style>
