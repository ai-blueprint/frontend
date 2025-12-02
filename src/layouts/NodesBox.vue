<template>
  <div class="nodes-box" @dragover.prevent @drop="onNodeDrop" @dragenter="onDragEnter" @dragleave="onDragLeave">
    <div class="nodes-group" v-for="category in activeCategory" :key="category.name">
      <h3 class="group-name">{{ category.name }}</h3>
      <Node v-for="node in category.nodes" :key="node.opcode" :node="node" :color="category.color"></Node>
    </div>
  </div>
</template>

<script setup>
import Node from "../components/Node.vue";
import { nodeStore } from "@/stores/nodes";
import { blueprintStore } from "@/stores/blueprint.js";
import { editorStore } from "@/stores/editor";
import { computed } from "vue";

// 计算属性：获取当前激活的分类
const activeCategory = computed(() => {
  const index = editorStore.state.activeCategoryIndex;
  return nodeStore.state[index] ? [nodeStore.state[index]] : [];
});

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
    blueprintStore.deleteNode(originalNodeId);
    // 可以添加视觉反馈，比如删除动画等
  }
}
</script>

<style scoped>
.nodes-box {
  width: 30%;
  min-width: 180px;
  max-width: 200px;
  background-color: #eaeffc;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  height: 100%;

  direction: rtl;
}


.nodes-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  gap: 18px;

  direction: ltr;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
}

/* 滚动条 */
.nodes-box::-webkit-scrollbar {
  width: 6px;
}

.nodes-box::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
}

.nodes-box::-webkit-scrollbar-thumb {
  background: #aaa;
}

.nodes-box::-webkit-scrollbar-thumb:hover {
  background: #8992EB;
}

</style>
