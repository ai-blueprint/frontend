<template>
  <span class="node" draggable="true" ref="nodeElement" @dragstart="onDragStart" @click="onNodeClick"
    :class="{ selected: isSelected }" :style="{ backgroundColor: nodeColor }">
    <span class="endpoint-group in">
      <EndPoint v-for="endpoint in inputEndpoints" :id="`${nodeId}_${endpoint}`" :key="endpoint"
        :class="endpoint"></EndPoint>
    </span>
    <span class="node-name">{{ nodeName }}</span>
    <span class="endpoint-group out">
      <EndPoint v-for="endpoint in outputEndpoints" :id="`${nodeId}_${endpoint}`" :key="endpoint"
        :class="endpoint"></EndPoint>
    </span>
  </span>
</template>
<script setup>
import EndPoint from "./EndPoint.vue";
import { ref, computed, defineProps } from "vue";
import { blueprintStore } from "@/stores/blueprintStore.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";
import { nodeStore } from "@/stores/nodeStore.js";
const nodeElement = ref(null);
const props = defineProps({
  node: {
    type: Object,
    default: () => ({}),
  },
  color: {
    type: String,
    default: "#8B92E5",
  },
});

// 计算属性，提高代码可读性
const nodeId = computed(() => props.node?.id || '');
const nodeColor = computed(() => nodeStore.getNodeColor(props.node?.opcode || "") || props.color);
const nodeName = computed(() => props.node?.name || "未命名节点");
const isSelected = computed(() => props.node?.selected || false);
const inputEndpoints = computed(() => props.node?.endpoints?.in || []);
const outputEndpoints = computed(() => props.node?.endpoints?.out || []);

function onNodeClick(e) {
  // 阻止事件冒泡，避免触发蓝图的点击事件
  e.stopPropagation();
  // 提升图层
  nodeElement.value.style.zIndex = 1000;

  if (e.ctrlKey || e.metaKey) {
    // 按下Ctrl键，切换选中状态
    blueprintStore.toggleSelectNode(nodeId.value);
  } else {
    // 未按Ctrl键，先清空所有选择，然后选中当前节点
    blueprintStore.clearSelectNode();
    blueprintStore.toggleSelectNode(nodeId.value);
  }
}

function onDragStart(e) {
  // 获取并存储鼠标相对于节点的位置，用于节点放置时是同样的相对位置
  const position = getMouseRelativeCoordinate(nodeElement, e);
  e.dataTransfer.setData("position", JSON.stringify(position));
  // 存储节点信息，用于放置时创建相应节点
  e.dataTransfer.setData("node", JSON.stringify(props.node));
  
  // 如果节点有ID，那就是蓝图内节点移动，否则就是新节点创建
  if (nodeId.value) {
    e.dataTransfer.setData("isMove", "true");
    e.dataTransfer.setData("nodeId", nodeId.value);
    // 视觉反馈，移动状态
    e.dataTransfer.effectAllowed = "move";
  } else {
    // 视觉反馈，复制状态
    e.dataTransfer.effectAllowed = "copy";
  }
}
</script>
<style scoped>
.node {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: fit-content;
  flex-wrap: nowrap;
  border-radius: 12px;
  background-color: #8992eb;
  padding: 12px 10px;
  gap: 40px;
  cursor: grab;
  outline: #ffffff;
  transition: opacity 0.2s, filter 0.2s, outline 0.2s, scale 0.2s;
}

.node:active {
  cursor: grabbing;
}

.blueprint .node {
  position: absolute;
}

.blueprint .node:hover {
  filter: brightness(1.1);
}

.blueprint .node:hover:active {
  scale: 0.98;
}

.blueprint .node.selected {
  outline: 3px solid #ffffff;
  filter: drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 15px #ffffff) brightness(1.1);
}

.node-name {
  width: fit-content;
  font-size: 18px;
  color: #fff;
  word-break: keep-all;
}

.endpoint-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 8px;
}
</style>
