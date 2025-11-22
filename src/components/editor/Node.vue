<template>
  <span class="node" draggable="true" ref="nodeElement" @dragstart="onDragStart" @click="onNodeClick"
    :class="{ selected: isSelected }" :style="{ backgroundColor: color, zIndex: layer }">
    <span class="port-group in">
      <Port v-for="port in inputs" :id="`${id}_${port}`" :key="port" :class="port"></Port>
    </span>
    <span class="node-name">{{ name }}</span>
    <span class="port-group out">
      <Port v-for="port in outputs" :id="`${id}_${port}`" :key="port" :class="port"></Port>
    </span>
  </span>
</template>
<script setup>
import Port from "./Port.vue";
import { ref, computed, defineProps } from "vue";
import { blueprintStore } from "@/stores/blueprint.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";
import { nodeStore } from "@/stores/nodes.js";
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
const id = computed(() => props.node?.id || '');
const color = computed(() => nodeStore.getNodeColor(props.node?.opcode || "") || props.color);
const name = computed(() => props.node?.name || "未命名节点");
const isSelected = computed(() => props.node?.selected || false);
const inputs = computed(() => props.node?.ports?.in || []);
const outputs = computed(() => props.node?.ports?.out || []);
const layer = computed(() => props.node?.layer || 0);

function onNodeClick(e) {
  // 阻止事件冒泡，避免触发蓝图的点击事件
  e.stopPropagation();
  nodeElement.value.style.zIndex = 1000;// 提升图层
  if (!e.ctrlKey && !e.metaKey) blueprintStore.clearSelectNode();
  blueprintStore.toggleSelectNode(id.value);
}

function onDragStart(e) {
  // 获取并存储鼠标相对于节点的位置，用于节点放置时是同样的相对位置
  const position = getMouseRelativeCoordinate(nodeElement, e);
  e.dataTransfer.setData("position", JSON.stringify(position));
  // 存储节点信息，用于放置时创建相应节点
  e.dataTransfer.setData("node", JSON.stringify(props.node));

  // 如果节点有ID，那就是蓝图内节点移动，否则就是新节点创建
  if (id.value) {
    e.dataTransfer.setData("isMove", "true");
    e.dataTransfer.setData("nodeId", id.value);
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

.port-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 8px;
}
</style>
