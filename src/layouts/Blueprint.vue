<template>
  <!-- 蓝图编辑区域 - 包含节点和连接线，支持拖拽、缩放和交互 -->
  <div id="blueprint" class="blueprint" ref="blueprintContainer" @dragover.prevent @drop="handleNodeDrop"
    @click="handleBlueprintClick" @mousemove="handleBlueprintDrag" @wheel="handleZoom" :style="blueprintStyle">
    <!-- 渲染连接线 -->
    <Line :links="blueprintStore.state.links" />
    <!-- 渲染所有节点 -->
    <Node v-for="node in blueprintStore.state.nodes" :key="node.id" :node="node" :style="getNodeStyle(node)" />
  </div>
</template>

<script setup>
/**
 * Blueprint 组件
 * 蓝图编辑器的核心组件，负责渲染和管理蓝图画布
 * 处理节点渲染、连接线显示、画布交互（拖拽、缩放等）
 */

// 导入Vue组合式API
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

// 导入工具函数
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate.js";

// 导入组件
import Node from "@/components/Node.vue";
import Line from "@/components/Line.vue";

// 导入状态管理
import { blueprintStore } from "@/stores/blueprint";
import { mouseStore } from "@/stores/mouse";
import { historyStore } from "@/stores/history";

// 调试日志开关
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

// 组件引用
const blueprintContainer = ref(null);

/**
 * 计算蓝图样式
 * 应用蓝图的尺寸、缩放和位移
 */
const blueprintStyle = computed(() => ({
  width: `${blueprintStore.state.size.width}px`,
  height: `${blueprintStore.state.size.height}px`,
  scale: blueprintStore.state.scale,
  translate: `${blueprintStore.state.translate.x}px ${blueprintStore.state.translate.y}px`,
}));

/**
 * 获取节点样式
 * 根据节点位置计算CSS样式
 * @param {Object} node - 节点对象
 * @returns {Object} CSS样式对象
 */
function getNodeStyle(node) {
  if (!node || !node.position) return {};

  return {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
  };
}

/**
 * 更新蓝图位置
 * @param {number} x - X轴位置
 * @param {number} y - Y轴位置
 */
function updateBlueprintPosition(x, y) {
  blueprintStore.updateTranslate(x, y);
}

/**
 * 更新蓝图缩放和位置
 * @param {number} scale - 缩放比例
 * @param {number} x - X轴位置
 * @param {number} y - Y轴位置
 */
function updateBlueprintTransform(scale, x, y) {
  blueprintStore.updateTransform(scale, x, y);
}

/**
 * 处理蓝图点击事件
 * 1. 处理节点选择
 * 2. 处理蓝图拖拽
 * @param {MouseEvent} event - 鼠标事件对象
 */
function handleBlueprintClick(event) {
  // 只有在没有按住Ctrl/Meta键时才清空选择（允许多选）
  if (!(event.ctrlKey || event.metaKey)) {
    blueprintStore.clearSelectNode();
    debugLog('清空节点选择');
  }

  // 处理点击拖拽
  if (event.buttons === 1) {
    const currentTranslate = blueprintStore.state.translate;
    // 计算拖拽偏移量
    const offset = {
      x: mouseStore.state.offset.x,
      y: mouseStore.state.offset.y
    };

    updateBlueprintPosition(
      currentTranslate.x + offset.x,
      currentTranslate.y + offset.y
    );
    debugLog('蓝图拖拽更新位置');
  }
}

/**
 * 处理键盘快捷键
 * @param {KeyboardEvent} event - 键盘事件对象
 */
function handleKeyboardShortcuts(event) {
  // 删除选中的节点
  if (event.key === 'Delete') {
    const hasSelectedNodes = blueprintStore.getSelectedNodes().length > 0;
    if (hasSelectedNodes) {
      blueprintStore.deleteSelectedNodes();
      debugLog('删除选中节点');
    }
    return;
  }

  // 撤销操作 (Ctrl+Z)
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    event.preventDefault();
    historyStore.undo();
    debugLog('执行撤销操作');
    return;
  }

  // 重做操作 (Ctrl+Shift+Z 或 Ctrl+Y)
  if ((event.ctrlKey || event.metaKey) && (event.shiftKey && event.key === 'z' || event.key === 'y')) {
    event.preventDefault();
    historyStore.redo();
    debugLog('执行重做操作');
    return;
  }

  // Esc键清空选择
  if (event.key === 'Escape') {
    blueprintStore.clearSelectNode();
    debugLog('通过Esc键清空选择');
  }
}

/**
 * 处理节点拖放
 * 支持新节点创建和现有节点移动
 * @param {DragEvent} event - 拖放事件对象
 */
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
      blueprintStore.updateNodePosition(originalNodeId, targetPosition);
      debugLog(`移动节点 ${originalNodeId} 到位置: (${targetPosition.x}, ${targetPosition.y})`);
    } else if (nodeProps) {
      // 创建新节点
      blueprintStore.addNode(nodeProps.name, nodeProps.opcode, targetPosition, nodeProps);
      debugLog(`创建新节点: ${nodeProps.name} 在位置: (${targetPosition.x}, ${targetPosition.y})`);
    }
  } catch (error) {
    console.error("节点放置失败:", error);
  }
}

/**
 * 处理蓝图拖拽移动
 * @param {MouseEvent} event - 鼠标事件对象
 */
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

/**
 * 处理鼠标滚轮缩放
 * 实现围绕鼠标位置的缩放效果
 * @param {WheelEvent} event - 滚轮事件对象
 */
function handleZoom(event) {
  if (!blueprintContainer.value) return;

  event.preventDefault();

  try {
    // 计算缩放参数
    const mousePos = getMouseRelativeCoordinate(blueprintContainer, event, true);
    const currentScale = blueprintStore.state.scale;
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    // 限制缩放范围在0.1到5之间
    const newScale = Math.max(0.1, Math.min(5, currentScale * zoomFactor));

    // 计算缩放后的位置偏移（围绕鼠标位置缩放）
    const currentTranslate = blueprintStore.state.translate;
    const newTranslateX = currentTranslate.x + mousePos.x * (currentScale - newScale);
    const newTranslateY = currentTranslate.y + mousePos.y * (currentScale - newScale);

    // 更新蓝图变换
    updateBlueprintTransform(newScale, newTranslateX, newTranslateY);
    debugLog(`蓝图缩放: ${currentScale} -> ${newScale} 位置偏移: (${newTranslateX}, ${newTranslateY})`);
  } catch (error) {
    console.error("缩放操作失败:", error);
  }
}

// 组件生命周期
onMounted(() => {
  debugLog('Blueprint组件挂载');

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
  debugLog('Blueprint组件卸载');

  // 清理事件监听
  window.removeEventListener("keydown", handleKeyboardShortcuts);
});
</script>

<style scoped>
.blueprint {
  /* 绝对定位，作为节点和连接线的容器 */
  position: absolute;

  /* 网格背景（已注释，需要时可启用） */
  /* background-image: linear-gradient(rgba(0, 0, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 255, 0.07) 1px, transparent 1px);
  background-size: 30px 30px; */

  /* 光标样式 */
  cursor: grab;

  /* 禁止文本选择 */
  user-select: none;

  /* 变换原点在左上角 */
  transform-origin: 0 0;

  /* 确保最小尺寸 */
  min-width: 100%;
  min-height: 100%;
}

/* 拖动时的光标样式 */
.blueprint.dragging {
  cursor: grabbing;
}
</style>
