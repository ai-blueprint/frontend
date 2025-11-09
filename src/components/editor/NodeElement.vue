<template>
  <span class="node" draggable="true" ref="nodeElement" @dragstart="onDragStart" >
    <span class="endpoint-group in">
      <EndPoint v-for="endpoint in node?.endpoints?.in || []" :id="node.id + '_' + endpoint" :key="endpoint"
        :class="endpoint"></EndPoint>
    </span>
    <span class="node-name">{{ node?.name || "未命名节点" }}</span>
    <span class="endpoint-group out">
      <EndPoint v-for="endpoint in node?.endpoints?.out || []" :id="node.id + '_' + endpoint" :key="endpoint"
        :class="endpoint"></EndPoint>
    </span>
  </span>
</template>
<script setup>
import EndPoint from "./EndPoint.vue";
import { ref, defineProps } from "vue";
const nodeElement = ref(null);
const props = defineProps({
  node: {
    type: Object,
    default: () => ({}),
  },
});

import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";

function onDragStart(e) {
  // 获取并存储鼠标相对于节点的位置，用于节点放置时是同样的相对位置
  const position = getMouseRelativeCoordinate(nodeElement, e);
  e.dataTransfer.setData("position", JSON.stringify(position));
  // 存储节点信息，用于放置时创建相应节点
  e.dataTransfer.setData("node", JSON.stringify(props.node));
  // 如果节点有ID，那就是蓝图内节点移动，否则就是新节点创建
  if (props.node && props.node.id) {
    e.dataTransfer.setData("isMove", "true");
    e.dataTransfer.setData("nodeId", props.node.id);
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
  transition: opacity 0.2s;
}

.node:active {
  cursor: grabbing;
}

.blueprint .node {
  position: absolute;
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
