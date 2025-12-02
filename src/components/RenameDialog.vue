<template>
  <div v-if="editorStore.state.renameDialogVisible" class="rename-dialog-overlay" @click="handleOverlayClick">
    <div class="rename-dialog" @click.stop>
      <div class="rename-dialog-header">
        <h3>{{ selectedNodes.length === 1 ? '重命名节点' : '重命名多个节点' }}</h3>
      </div>
      <div class="rename-dialog-body">
        <input ref="nameInput" type="text" v-model="inputValue" class="rename-input" :placeholder="selectedNodes.length === 1 ? inputValue : '多个节点重命名'"

          @keyup.enter="handleConfirm" @keyup.esc="handleCancel" />
      </div>
      <div class="rename-dialog-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="confirm-btn" @click="handleConfirm" :disabled="!inputValue.trim()">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { blueprintStore } from '@/stores/blueprint';
import { editorStore } from '@/stores/editor';

const nameInput = ref(null);
const inputValue = ref('');
const selectedNodes = ref([]);


// 监听弹窗可见性变化，自动获取内容并聚焦输入框
watch(() => editorStore.state.renameDialogVisible, (newVal) => {
  if (newVal) {
    // 默认空值
    inputValue.value = '';
    nextTick(() => {
      // 首先获取所有选中的节点
      selectedNodes.value = blueprintStore.getSelectedNodes();
      // 如果只有一个，输入框里就显示这个节点的名称
      if (selectedNodes.value.length === 1) inputValue.value = selectedNodes.value[0].name;
      nameInput.value?.focus();
      nameInput.value?.select();
    });
  }
});


// 确认重命名
function handleConfirm() {
  const newName = inputValue.value.trim();
  // 如果输入框为空，不执行重命名
  if (!newName) return;
  blueprintStore.renameSelectedNodes(newName);
  editorStore.closeRenameDialog();
}

// 取消重命名，关闭弹窗
function handleCancel() {
  editorStore.closeRenameDialog();
}

// 点击遮罩层关闭弹窗
function handleOverlayClick() {
  handleCancel();
}
</script>

<style scoped>
.rename-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.rename-dialog {
  background-color: #F6F9FE;
  border-radius: 14px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.16);
  width: 400px;
  max-width: 90%;
  overflow: hidden;
}

.rename-dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #EAEFFC;
  background-color: #F6F9FE;
}

.rename-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.rename-dialog-body {
  padding: 24px;
}

.rename-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #EAEFFC;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
  background-color: #FFFFFF;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.rename-input:focus {
  outline: none;
  border-color: #8C92DFFF;
  box-shadow: 0 0 0 3px rgba(140, 146, 223, 0.1);
}

.rename-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #EAEFFC;
  background-color: #F6F9FE;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #FFFFFF;
  color: #6F7DB0;
  border: 1px solid #EAEFFC;
}

.cancel-btn:hover {
  background-color: #F6F9FE;
  border-color: #8C92DFFF;
  color: #8C92DFFF;
}

.confirm-btn {
  background-color: #8C92DFFF;
  color: #FFFFFF;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #7A82E0FF;
}

.confirm-btn:disabled {
  background-color: #EAEFFC;
  color: #B0B8D4;
  cursor: not-allowed;
}
</style>