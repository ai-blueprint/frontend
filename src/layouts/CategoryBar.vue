<template>
  <div class="category-bar">
    <!-- 分类导航图标 -->
    <div class="category-item active">
      <img src="../assets/category/基础.svg" alt="基础" class="icon" />
    </div>
    <div class="category-item">
      <img src="../assets/category/函数.svg" alt="函数" class="icon" />
    </div>
    <div class="category-item">
      <img src="../assets/category/数学.svg" alt="数学" class="icon" />
    </div>
    <div class="category-item">
      <img src="../assets/category/网络.svg" alt="网络" class="icon" />
    </div>

  </div>
</template>

<script setup>

</script>

<style scoped>
.category-bar {
  width: fit-content;
  background-color: #f6f9fe;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  cursor: pointer;
  margin: 4px;
  border-radius: 8px;
  position: relative;
  transition: all 0.1s ease-in-out;
}

.category-item:hover {
  background-color: rgba(0, 0, 0, 0.1);
  scale: 1.1;
}
.category-item:active {
  scale: 0.9;
}
.category-item.active {
  background-color: #6a8ee7;
  color: white;
  /* 图标颜色变为白色 */
  .icon {
    filter: brightness(10);
  }
}
.category-item.active:hover {
  scale: 1;
}
.icon {
  width: 100%;
  /* 禁止拖拽 */
  user-select: none;
  /* 禁止点击打开图片 */
  pointer-events: none;
}
</style>
