<template>
  <!-- 蓝图编辑区域 - 包含节点和连接线，支持拖拽、缩放和交互 -->
  <div id="blueprint" class="blueprint" ref="blueprintContainer" @dragover.prevent @drop="handleNodeDrop"
    @click="handleBlueprintClick" @mousedown="handleBlueprintMousedown" @mousemove="handleBlueprintDrag" @wheel="handleZoom" :style="blueprintStyle">
    <!-- 渲染连接线 -->
    <Line :links="blueprintStore.state.links" />
    <!-- 渲染所有节点 -->
    <Node v-for="node in blueprintStore.state.nodes" :key="node.id" :node="node" :style="getNodeStyle(node)" @contextmenu="handleNodeContextMenu" @dblclick="handleNodeDoubleClick" />
  </div>
  <!-- 右键菜单 -->
  <ContextMenu ref="contextMenu" @menu-click="handleMenuClick" />
  <!-- 重命名弹窗 -->
  <RenameDialog
    :visible="renameDialogVisible"
    :default-name="currentEditingNode?.name || ''"
    @confirm="handleRenameConfirm"
    @cancel="handleRenameCancel"
  />
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
import ContextMenu from "@/components/ContextMenu.vue";
import RenameDialog from "@/components/RenameDialog.vue";

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
const contextMenu = ref(null);

// 右键菜单状态
const menuState = ref({
  visible: false,
  position: { x: 0, y: 0 },
  targetNode: null
});

// 重命名弹窗状态
const renameDialogVisible = ref(false);
const currentEditingNode = ref(null);

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
 * 处理节点双击事件
 * @param {Object} eventData - 包含节点信息的事件数据
 */
function handleNodeDoubleClick(eventData) {
  const { node } = eventData;
  if (node) {
    currentEditingNode.value = node;
    renameDialogVisible.value = true;
  }
}

/**
 * 处理节点右键点击事件
 * @param {Object} eventData - 包含节点信息和位置的事件数据
 */
function handleNodeContextMenu(eventData) {
  const { node, nodeRect } = eventData;
  
  // 保存目标节点
  menuState.value.targetNode = node;
  
  // 计算菜单位置
  const menuElement = document.getElementById('context-menu');
  if (!menuElement) return;
  
  // 获取菜单尺寸
  menuElement.style.display = 'flex'; // 临时显示以获取尺寸
  const menuRect = menuElement.getBoundingClientRect();
  menuElement.style.display = 'none'; // 隐藏菜单
  
  // 计算菜单位置：节点在窗口中的位置如果在中下部分，显示在上方，否则显示在下方
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const nodeCenterY = nodeRect.top + nodeRect.height / 2;
  const nodeCenterX = nodeRect.left + nodeRect.width / 2;
  
  // 计算菜单X坐标，使菜单中心对齐节点中心
  let menuX = nodeCenterX - menuRect.width / 2;
  // 确保菜单在窗口内
  menuX = Math.max(0, Math.min(menuX, windowWidth - menuRect.width));
  
  let menuY;
  if (nodeCenterY > windowHeight / 2) {
    // 节点在中下部分，菜单显示在节点上方
    menuY = nodeRect.top - menuRect.height - 10; // 10px间距
  } else {
    // 节点在上半部分，菜单显示在节点下方
    menuY = nodeRect.bottom + 10; // 10px间距
  }
  
  // 确保菜单在窗口内
  menuY = Math.max(0, Math.min(menuY, windowHeight - menuRect.height));
  
  // 设置菜单位置
  menuState.value.position = {
    x: menuX,
    y: menuY
  };
  
  // 显示菜单
  showContextMenu();
}

/**
 * 显示右键菜单
 */
function showContextMenu() {
  const menuElement = document.getElementById('context-menu');
  if (!menuElement) return;
  
  // 设置菜单位置
  menuElement.style.left = `${menuState.value.position.x}px`;
  menuElement.style.top = `${menuState.value.position.y}px`;
  menuElement.style.display = 'flex';
  
  menuState.value.visible = true;
}

/**
 * 隐藏右键菜单
 */
function hideContextMenu() {
  const menuElement = document.getElementById('context-menu');
  if (menuElement) {
    menuElement.style.display = 'none';
  }
  
  menuState.value.visible = false;
  menuState.value.targetNode = null;
}

/**
 * 处理蓝图鼠标按下事件
 * 鼠标按下时立即隐藏右键菜单
 */
function handleBlueprintMousedown() {
  // 立即隐藏右键菜单
  hideContextMenu();
}

/**
 * 处理蓝图点击事件
 * 1. 处理节点选择
 * 2. 处理蓝图拖拽
 * @param {MouseEvent} event - 鼠标事件对象
 */
function handleBlueprintClick(event) {
  // 隐藏右键菜单
  hideContextMenu();
  
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
  // 添加点击事件监听，点击页面其他地方隐藏右键菜单
  window.addEventListener("click", handleWindowClick);

  // 监听蓝图状态变化，自动调整大小
  watch(
    () => blueprintStore.state,
    () => {
      changeBlueprintSize();
    },
    { deep: true, immediate: true }
  );
});

/**
 * 处理右键菜单点击事件
 * @param {string} action - 菜单动作类型：clone, rename, delete
 */
function handleMenuClick(action) {
  // 隐藏菜单
  hideContextMenu();
  
  // 获取目标节点
  const targetNode = menuState.value.targetNode;
  if (!targetNode) return;
  
  switch (action) {
    case 'clone': {
      // 复制并粘贴节点
      blueprintStore.cloneNode(targetNode.id);
      debugLog(`复制节点: ${targetNode.id}`);
      break;
    }
    case 'rename': {
      // 打开重命名弹窗
      currentEditingNode.value = targetNode;
      renameDialogVisible.value = true;
      break;
    }
    case 'delete': {
      // 删除节点
      blueprintStore.deleteNode(targetNode.id);
      debugLog(`删除节点: ${targetNode.id}`);
      break;
    }
    default:
      break;
  }
}

/**
 * 处理重命名确认
 * @param {string} newName - 新的节点名称
 */
function handleRenameConfirm(newName) {
  if (currentEditingNode.value && newName.trim()) {
    // 更新节点名称
    const node = blueprintStore.state.nodes.find(n => n.id === currentEditingNode.value.id);
    if (node) {
      node.name = newName.trim();
      historyStore.recordState();
      debugLog(`重命名节点 ${currentEditingNode.value.id} 为: ${newName.trim()}`);
    }
  }
  // 关闭弹窗
  renameDialogVisible.value = false;
  currentEditingNode.value = null;
}

/**
 * 处理重命名取消
 */
function handleRenameCancel() {
  // 关闭弹窗
  renameDialogVisible.value = false;
  currentEditingNode.value = null;
}

/**
 * 处理窗口点击事件，点击页面其他地方隐藏右键菜单
 * @param {MouseEvent} event - 鼠标事件对象
 */
function handleWindowClick(event) {
  // 只有当菜单可见时才处理
  if (!menuState.value.visible) return;
  
  // 检查点击是否在菜单内部
  const menuElement = document.getElementById('context-menu');
  if (menuElement && !menuElement.contains(event.target)) {
    hideContextMenu();
  }
}

onUnmounted(() => {
  debugLog('Blueprint组件卸载');

  // 清理事件监听
  window.removeEventListener("keydown", handleKeyboardShortcuts);
  window.removeEventListener("click", handleWindowClick);
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
