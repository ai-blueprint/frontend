<template>
  <div id="blueprint" class="blueprint" ref="blueprintContainer" @dragover.prevent @drop="handleNodeDrop"
    @click="handleBlueprintClick" @mousemove="handleBlueprintDrag" @wheel="handleZoom" :style="blueprintStyle">
    <Line :links="blueprintStore.state.links" />
    <Node v-for="node in blueprintStore.state.nodes" :key="node.id" :node="node" :style="getNodeStyle(node)" />
  </div>
</template>

<style scoped>
.blueprint {
  position: absolute;
  /* 网格背景 */
  background-image: linear-gradient(rgba(0, 0, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.07) 1px, transparent 1px);
  background-size: 30px 30px;
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import Node from "@/components/editor/Node.vue";
import Line from "@/components/editor/Line.vue";
import { blueprintStore } from "@/stores/blueprint";
import { createNode } from "@/tools/blueprint/create-node.js";
import { moveNode } from "@/tools/blueprint/move-node.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";
import { mouseStore } from "@/stores/mouse";

// 组件引用
const blueprintContainer = ref(null);

// 计算蓝图样式
const blueprintStyle = computed(() => ({
  width: `${blueprintStore.state.size.width}px`,
  height: `${blueprintStore.state.size.height}px`,
  scale: blueprintStore.state.scale,
  translate: `${blueprintStore.state.translate.x}px ${blueprintStore.state.translate.y}px`,
}));

// 获取节点样式
function getNodeStyle(node) {
  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`
  };
}

// 更新蓝图变换
function updateBlueprintPosition(x, y) {
  blueprintStore.updateTranslate(x, y);
}

// 更新蓝图缩放和位置
function updateBlueprintTransform(scale, x, y) {
  blueprintStore.updateTransform(scale, x, y);
}

// 处理蓝图点击
function handleBlueprintClick(event) {
  // 只有在没有按住Ctrl/Meta键时才清空选择（允许多选）
  if (!(event.ctrlKey || event.metaKey)) {
    blueprintStore.clearSelectNode();
  }

  // 处理点击拖拽
  if (event.buttons === 1) {
    const currentTranslate = blueprintStore.state.translate;
    const offset = {
      x: mouseStore.state.offsetX,
      y: mouseStore.state.offsetY
    };

    updateBlueprintPosition(
      currentTranslate.x + offset.x,
      currentTranslate.y + offset.y
    );
  }
}

// 处理键盘快捷键
function handleKeyboardShortcuts(event) {
  // 删除选中的节点
  if (event.key === 'Delete' || event.key === 'Backspace') {
    const hasSelectedNodes = blueprintStore.getSelectedNodes().length > 0;
    if (hasSelectedNodes) {
      blueprintStore.deleteSelectedNodes();
    }
    return;
  }

  // Esc键清空选择
  if (event.key === 'Escape') {
    blueprintStore.clearSelectNode();
  }
}

// 处理节点拖放
function handleNodeDrop(event) {
  event.preventDefault();

  try {
    // 获取拖放数据
    const position = JSON.parse(event.dataTransfer.getData("position"));
    const nodeProps = JSON.parse(event.dataTransfer.getData("node"));
    const isMove = event.dataTransfer.getData("isMove") === "true";
    const originalNodeId = event.dataTransfer.getData("nodeId");
    
    // 计算放置位置
    const { x, y } = getMouseRelativeCoordinate(blueprintContainer, event, true);
    const targetPosition = {
      x: x - position.x,
      y: y - position.y
    };

    if (isMove && originalNodeId) {
      // 移动现有节点
      moveNode(originalNodeId, targetPosition);
    } else {
      // 创建新节点
      createNode(nodeProps.name, nodeProps.opcode, targetPosition, nodeProps);
    }
  } catch (error) {
    console.error("节点放置失败:", error);
  }
}

// 处理蓝图拖拽移动
function handleBlueprintDrag(event) {
  // 如果正在创建连接线，跳过蓝图拖动
  if (blueprintStore.state.tempLink) {
    return;
  }

  // 处理拖动时的蓝图移动
  if (event.buttons === 1) {
    const currentTranslate = blueprintStore.state.translate;
    const offset = {
      x: mouseStore.state.offset.x,
      y: mouseStore.state.offset.y
    };

    updateBlueprintPosition(
      currentTranslate.x + offset.x,
      currentTranslate.y + offset.y
    );
  }
}

// 处理鼠标滚轮缩放
function handleZoom(event) {
  if (!blueprintContainer.value) return;

  event.preventDefault();

  // 计算缩放参数
  const mousePos = getMouseRelativeCoordinate(blueprintContainer, event, true);
  const currentScale = blueprintStore.state.scale;
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(5, currentScale * zoomFactor)); // 限制缩放范围

  // 计算缩放后的位置偏移（围绕鼠标位置缩放）
  const currentTranslate = blueprintStore.state.translate;
  const newTranslateX = currentTranslate.x + mousePos.x * (currentScale - newScale);
  const newTranslateY = currentTranslate.y + mousePos.y * (currentScale - newScale);

  // 更新蓝图变换
  updateBlueprintTransform(newScale, newTranslateX, newTranslateY);
}

// 组件生命周期
onMounted(() => {
  // 添加键盘事件监听
  window.addEventListener("keydown", handleKeyboardShortcuts);

  // 监听蓝图状态变化，自动调整大小
  watch(
    () => blueprintStore.state,
    () => {
      changeBlueprintSize();
    },
    { deep: true, immediate: true }
  );
});

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener("keydown", handleKeyboardShortcuts);
});
</script>
