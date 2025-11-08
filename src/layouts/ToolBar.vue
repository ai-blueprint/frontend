<template>
  <div class="toolbar">
    <!-- 撤销/重做按钮 -->
    <div class="group">
      <button class="toolbar-button">
        <img src="../assets/撤销.svg" alt="撤销" class="icon" />
      </button>
      <button class="toolbar-button">
        <img src="../assets/反撤销.svg" alt="重做" class="icon" />
      </button>
    </div>

    <!-- 缩放控制按钮 -->
    <div class="group">
      <button class="toolbar-button">
        <img
          src="../assets/减少.svg"
          alt="缩小"
          class="icon"
          style="width: 20px"
        />
      </button>
      <button class="toolbar-button">100%</button>
      <button class="toolbar-button">
        <img
          src="../assets/增加.svg"
          alt="放大"
          class="icon"
          style="width: 20px"
        />
      </button>
    </div>

    <!-- 其他工具按钮 -->
    <div class="group">
      <button class="toolbar-button">
        <img src="../assets/排列.svg" alt="排列" class="icon" />
      </button>
      <button class="toolbar-button">
        <img src="../assets/搜索.svg" alt="搜索" class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
// 工具栏组件，提供编辑操作的快捷按钮
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

.group {
  display: flex;
}

.toolbar-button {
  display: flex;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.1s;
  color: #8992eb;
  font-weight: bold;
}

.toolbar-button:hover {
  scale: 1.1;
}
.toolbar-button:active {
  scale: 0.9;
}

.icon {
  width: 24px;
}
</style>
