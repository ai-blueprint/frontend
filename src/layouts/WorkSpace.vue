<template>
  <!-- 工作区容器 - 包含蓝图编辑区域和工具栏 -->
  <div id="workspace" class="workspace-container">
    <!-- 蓝图编辑区域 - 展示节点和连接线 -->
    <Blueprint />
    <!-- 工具栏 - 提供缩放、撤销、重做等操作 -->
    <ToolBar />
    <!-- 上下文菜单 - 提供节点操作选项 -->
    <ContextMenu />
    <!-- 重命名弹窗 -->
    <RenameDialog />
  </div>
</template>

<script setup>
/**
 * WorkSpace 组件
 * 作为蓝图编辑器的主要工作区域容器
 * 管理蓝图编辑区域和工具栏的布局关系
 */

// 导入子组件
import Blueprint from "./Blueprint.vue";
import ToolBar from "./ToolBar.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import RenameDialog from "@/components/RenameDialog.vue";
</script>

<style scoped>
.workspace-container {
  /* 相对定位，作为子组件的定位参考 */
  position: relative;
  /* 工作区背景色 */
  background-color: #e2e9fa;
  /* 隐藏溢出内容 */
  overflow: hidden;
  /* 占据父容器全部空间 */
  width: 100%;
  height: 100%;
  /* 使用flex布局确保子组件正确排列 */
  display: flex;
  flex-direction: column;
}
</style>
