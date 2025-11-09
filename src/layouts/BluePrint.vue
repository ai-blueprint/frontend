<template>
  <div id="blueprint" class="blueprint" ref="blueprint" @dragover.prevent @drop="onDrop" :style="{
    width: `${blueprintStore.state.size.width}px`,
    height: `${blueprintStore.state.size.height}px`,
    scale: blueprintStore.state.scale,
    translate: `${blueprintStore.state.translate.x}px ${blueprintStore.state.translate.y}px`,
  }">

    <NodeElement v-for="node in nodes" :id="node.id" :key="node.id" :node="node" :style="{
      left: `${node.position.x}px`,
      top: `${node.position.y}px`,
    }" />
    <LinkElement :links="blueprintStore.state.links"></LinkElement>
  </div>
</template>

<style scoped>
.blueprint {
  position: absolute;
  /* 网格背景 */
  /* background-image: linear-gradient(rgba(0, 0, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.07) 1px, transparent 1px);
  background-size: 30px 30px; */
  cursor: grab;
  user-select: none;
  transform-origin: 0 0;
  min-width: 100%;
  min-height: 100%;
}

.blueprint.dragging {
  cursor: grabbing;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import NodeElement from "@/components/editor/NodeElement.vue";
import LinkElement from "@/components/editor/LinkElement.vue";
import { blueprintStore } from "@/stores/blueprintStore";
import { mouseStore } from "@/stores/mouseStore";
import { createNode } from "@/tools/blueprint/create-node.js";
import { moveNode } from "@/tools/blueprint/move-node.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";
import {
  applyDragConstraints,
  applyScaleConstraints,
} from "@/tools/data/blueprint-limit.js";

const nodes = blueprintStore.state.nodes;
const blueprint = ref(null);

const handleMouseMove = () => {
  changeBlueprintSize(blueprint);
};

onMounted(() => {
  blueprint.value.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("mousemove", handleMouseMove);
  blueprint.value.addEventListener("mousemove", BlueprintDrag);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});

function onDrop(e) {
  e.preventDefault();
  const position = JSON.parse(e.dataTransfer.getData("position"));
  const nodeProps = JSON.parse(e.dataTransfer.getData("node"));
  const name = nodeProps.name;
  const opcode = nodeProps.opcode;
  const { x, y } = getMouseRelativeCoordinate(blueprint, e, true);
  const targetPosition = { x: x - position.x, y: y - position.y };

  // 检查是否是蓝图内节点的移动操作
  const isMove = e.dataTransfer.getData("isMove") === "true";
  const originalNodeId = e.dataTransfer.getData("nodeId");

  if (isMove && originalNodeId) {
    // 直接移动节点位置，不需要删除再创建
    moveNode(originalNodeId, targetPosition);
  } else {
    // 从节点盒拖入，创建新节点
    createNode(name, opcode, targetPosition, nodeProps);
  }
}

// 蓝图拖拽移动
function BlueprintDrag(e) {
  // 如果正在创建连接线，跳过蓝图拖动
  if (blueprintStore.state.tempLink) {
    return;
  }

  // 鼠标按下，并且是按在蓝图空白位置
  if (e.buttons === 1 && blueprint.value) {
    const currentTranslate = blueprintStore.state.translate;
    const currentScale = blueprintStore.state.scale;

    // 使用辅助函数应用拖拽限制
    const constrained = applyDragConstraints(
      currentTranslate,
      { x: mouseStore.state.offsetX, y: mouseStore.state.offsetY },
      currentScale,
      blueprint.value
    );

    blueprintStore.updateTranslate(constrained.x, constrained.y);
  }
}

// 处理鼠标滚轮缩放
function handleWheel(event) {
  if (!blueprint.value) return;
  event.preventDefault();

  const currentScale = blueprintStore.state.scale;
  const currentTranslate = blueprintStore.state.translate;
  const mouse = getMouseRelativeCoordinate(blueprint, event, true);

  // 使用辅助函数应用缩放限制
  const constraints = applyScaleConstraints(
    currentScale,
    -event.deltaY, // 反转delta值，使滚轮方向与缩放方向一致
    mouse,
    currentTranslate,
    blueprint.value
  );

  blueprintStore.updateTransform(
    constraints.scale,
    constraints.translateX,
    constraints.translateY
  );
}
</script>
