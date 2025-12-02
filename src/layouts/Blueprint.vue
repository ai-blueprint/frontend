<template>
  <!-- 蓝图编辑区域 - 包含节点和连接线，支持拖拽、缩放和交互 -->
  <div id="blueprint" class="blueprint" ref="blueprintContainer" @dragover.prevent @drop="handleNodeDrop"
    @click="handleBlueprintClick" @mousedown="handleBlueprintMousedown" @mousemove="handleBlueprintDrag"
    @wheel="handleZoom" :style="blueprintStyle">
    <!-- 渲染连接线 -->
    <Line :links="blueprintStore.state.links" />
    <!-- 渲染所有节点 -->
    <Node v-for="node in blueprintStore.state.nodes" :key="node.id" :node="node" :style="getNodeStyle(node)" />
  </div>
  <!-- 右键菜单 - 独立组件，自行处理所有逻辑 -->
  <ContextMenu />
</template>

<script setup>
// 导入Vue组合式API
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

// 导入工具函数
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";
import { getNodeStyle } from "@/tools/node/get-node-style.js";

// 导入组件
import Node from "@/components/Node.vue";
import Line from "@/components/Line.vue";
import ContextMenu from "@/components/ContextMenu.vue";

// 导入状态管理
import { blueprintStore } from "@/stores/blueprint";
import { mouseStore } from "@/stores/mouse";
import { historyStore } from "@/stores/history";
import { editorStore } from "@/stores/editor";

// 组件引用
const blueprintContainer = ref(null);

// 计算蓝图样式
const blueprintStyle = computed(() => ({
  width: `${blueprintStore.state.size.width}px`,
  height: `${blueprintStore.state.size.height}px`,
  scale: blueprintStore.state.scale,
  translate: `${blueprintStore.state.translate.x}px ${blueprintStore.state.translate.y}px`,
}));


// 鼠标按下时的处理
function handleBlueprintMousedown() {
  // TODO:立即关闭右键菜单显示
  editorStore.hideNodeContextMenu();
}

// 处理蓝图点击事件，只有在没有按住Ctrl/Meta键时才清空选择（允许多选）
function handleBlueprintClick(event) {
  if (!(event.ctrlKey || event.metaKey)) blueprintStore.clearSelectNode();
}

// 处理键盘快捷键
function handleKeyboardShortcuts(event) {
  // Esc键清空选择
  if (event.key === 'Escape') blueprintStore.clearSelectNode();

  // 删除选中的节点
  if (event.key === 'Delete') {
    const hasSelectedNodes = blueprintStore.getSelectedNodes().length > 0;
    if (hasSelectedNodes) {
      blueprintStore.deleteSelectedNodes();
    }
    return;
  }

  // 撤销操作 (Ctrl+Z)
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    event.preventDefault();
    historyStore.undo();
    return;
  }

  // 重做操作 (Ctrl+Shift+Z 或 Ctrl+Y)
  if ((event.ctrlKey || event.metaKey) && (event.shiftKey && event.key === 'z' || event.key === 'y')) {
    event.preventDefault();
    historyStore.redo();
    return;
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

    // 如果是移动节点，则更新节点位置，否则创建新节点
    if (isMove && originalNodeId) blueprintStore.updateNodePosition(originalNodeId, targetPosition);
    else if (nodeProps) blueprintStore.addNode(nodeProps.name, nodeProps.opcode, targetPosition, nodeProps);
  } catch (error) {
    console.error("节点放置失败:", error);
  }
}

// 处理蓝图拖拽移动
function handleBlueprintDrag(event) {
  // 如果正在创建连接线，跳过蓝图拖动
  if (blueprintStore.state.tempLink) return;

  // 处理拖动时的蓝图移动
  if (event.buttons === 1) {
    const currentTranslate = blueprintStore.state.translate;
    // 计算拖动偏移量
    const offset = {
      x: mouseStore.state.offset.x,
      y: mouseStore.state.offset.y
    };
    // 给蓝图应用拖动偏移
    blueprintStore.updateTranslate(
      currentTranslate.x + offset.x,
      currentTranslate.y + offset.y
    );
  }
}

// 处理鼠标滚轮缩放
function handleZoom(event) {
  if (!blueprintContainer.value) return;
  event.preventDefault();
  try {
    editorStore.hideNodeContextMenu();
    const mousePos = getMouseRelativeCoordinate(blueprintContainer, event, true);
    blueprintStore.zoomBlueprint(event.deltaY, mousePos);
  } catch (error) {
    console.error("缩放操作失败:", error);
  }
}

// 组件生命周期
onMounted(() => {
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
  window.removeEventListener("keydown", handleKeyboardShortcuts);
});
</script>

<style scoped>
.blueprint {
  position: absolute;
  /* 光标样式 */
  cursor: grab;
  /* 变换原点在左上角 */
  transform-origin: 0 0;
  /* 确保最小尺寸 */
  min-width: 100%;
  min-height: 100%;
  /* 网格背景（已注释，需要时可启用） */
  /* background-image: linear-gradient(rgba(0, 0, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.07) 1px, transparent 1px);
  background-size: 30px 30px; */
}

/* 拖动时的光标样式 */
.blueprint:active {
  cursor: grabbing;
}
</style>
