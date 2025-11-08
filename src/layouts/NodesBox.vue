<template>
  <div class="nodes-box" @dragover.prevent @drop="onNodeDrop" @dragenter="onDragEnter" @dragleave="onDragLeave">
    <div
      class="nodes-group"
      v-for="(items, category) in nodeStore.state"
      :key="category"
    >
      <h3 class="group-name">{{ category }}</h3>
      <NodeElement
        v-for="node in items"
        :key="node.opcode"
        :node="node"
      ></NodeElement>
    </div>
  </div>
</template>

<script setup>
import NodeElement from "../components/editor/NodeElement.vue";
import { nodeStore } from "@/stores/nodeStore";
import { deleteNode } from "@/tools/blueprint/delete-node.js";

// 添加拖拽进入和离开事件处理，用于视觉反馈
function onDragEnter(e) {
  e.preventDefault();
  // 只有当拖拽的是蓝图内节点时，才显示删除区域样式
  const isMove = e.dataTransfer.getData("isMove") === "true";
  if (isMove && e.dataTransfer.getData("nodeId")) {
    e.currentTarget.classList.add("drag-over");
  }
}

function onDragLeave(e) {
  e.preventDefault();
  // 检查是否真的离开了容器
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove("drag-over");
  }
}

function onNodeDrop(e) {
  e.preventDefault();
  // 移除拖拽样式
  e.currentTarget.classList.remove("drag-over");
  
  // 检查是否是蓝图内节点的移动操作
  const isMove = e.dataTransfer.getData("isMove") === "true";
  const originalNodeId = e.dataTransfer.getData("nodeId");
  
  // 如果是蓝图内节点，直接删除它
  if (isMove && originalNodeId) {
    deleteNode(originalNodeId);
    // 可以添加视觉反馈，比如删除动画等
  }
}
</script>

<style scoped>
/* 需要添加一个全局样式来处理拖拽时的hover效果 */
:global(.nodes-box.drag-over) {
  background-color: #f5f0fc !important;
}
.nodes-box {
  width: 30%;
  min-width: 180px;
  max-width: 200px;
  background-color: #eaeffc;
  overflow-y: auto;
  padding: 20px;
  height: 100%;
  /* 添加拖拽接收时的视觉效果 */
  &:hover.drag-over {
    background-color: #f5f0fc;
  }
}

.nodes-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  gap: 18px;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
}
</style>
