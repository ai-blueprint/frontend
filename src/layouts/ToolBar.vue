<template>
  <div class="toolbar">
    <!-- 撤销/重做按钮组 -->
    <div class="toolbar-group">
      <button class="toolbar-button" :disabled="!canUndo" @click="handleUndo" title="撤销 (Ctrl+Z)">
        <img src="../assets/撤销.svg" alt="撤销" class="toolbar-icon" />
      </button>
      <button class="toolbar-button" :disabled="!canRedo" @click="handleRedo" title="重做 (Ctrl+Shift+Z)">
        <img src="../assets/反撤销.svg" alt="重做" class="toolbar-icon" />
      </button>
    </div>

    <!-- 缩放控制按钮组 -->
    <div class="toolbar-group">
      <button class="toolbar-button" @click="handleZoomOut" title="缩小">
        <img src="../assets/减少.svg" alt="缩小" class="toolbar-icon" />
      </button>
      <button class="toolbar-button scale-display" @click="handleResetZoom" title="重置缩放">
        {{ Math.round(currentScale * 100) }}%
      </button>
      <button class="toolbar-button" @click="handleZoomIn" title="放大">
        <img src="../assets/增加.svg" alt="放大" class="toolbar-icon" />
      </button>
    </div>

    <!-- 辅助工具按钮组 -->
    <div class="toolbar-group">
      <button class="toolbar-button" @click="handleArrangeNodes" title="排列节点">
        <img src="../assets/排列.svg" alt="排列" class="toolbar-icon" />
      </button>
      <button class="toolbar-button" @click="handleSearch" title="搜索">
        <img src="../assets/搜索.svg" alt="搜索" class="toolbar-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { historyStore } from '@/stores/historyStore';
import { blueprintStore } from '@/stores/blueprintStore';

// 计算属性
const canUndo = computed(() => historyStore.canUndo());
const canRedo = computed(() => historyStore.canRedo());
const currentScale = computed(() => blueprintStore.state.scale);

// 撤销操作
function handleUndo() {
  if (canUndo.value) {
    historyStore.undo();
  }
}

// 重做操作
function handleRedo() {
  if (canRedo.value) {
    historyStore.redo();
  }
}

// 放大操作
function handleZoomIn() {
  const newScale = Math.min(5, currentScale.value * 1.1);
  updateZoom(newScale);
}

// 缩小操作
function handleZoomOut() {
  const newScale = Math.max(0.1, currentScale.value * 0.9);
  updateZoom(newScale);
}

// 重置缩放
function handleResetZoom() {
  updateZoom(1);
}

// 更新缩放（保持当前视图中心）
function updateZoom(newScale) {
  const blueprintEl = document.getElementById('blueprint');
  if (!blueprintEl) return;

  const rect = blueprintEl.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const currentTranslate = blueprintStore.state.translate;
  const scaleRatio = newScale / currentScale.value;

  const newTranslateX = centerX - (centerX - currentTranslate.x) * scaleRatio;
  const newTranslateY = centerY - (centerY - currentTranslate.y) * scaleRatio;

  blueprintStore.updateTransform(newScale, newTranslateX, newTranslateY);
}

// 排列节点（预留功能）
function handleArrangeNodes() {
  // 这里可以实现节点自动排列的逻辑
  console.log('排列节点功能待实现');
}

// 搜索功能（预留）
function handleSearch() {
  // 这里可以实现搜索节点的功能
  console.log('搜索功能待实现');
}
</script>

<style scoped>
.toolbar {
  position: fixed;
  bottom: 10px;
  right: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}

.toolbar-group {
  display: flex;
}

.toolbar-button {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.1s;
  color: #8992eb;
  font-weight: bold;
  font-size: 18px;
}

.toolbar-button:hover:not(:disabled) {
  scale: 1.1;
}

.toolbar-button:active:not(:disabled) {
  scale: 0.9;
}

.toolbar-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toolbar-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
</style>
