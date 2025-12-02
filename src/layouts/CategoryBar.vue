<template>
  <div class="category-bar">
    <div v-for="(category, index) in nodeStore.state" :key="category.id" class="category-item"
      :class="{ active: index === editorStore.state.activeCategoryIndex }" :style="{ '--category-color': category.color }"
      @click="setActiveCategoryId(index)">
      <img :src="category.icon || require('@/assets/警告.svg')" :alt="category.name" class="icon" />
    </div>

  </div>
</template>

<script setup>
import { nodeStore } from '@/stores/nodes';
import { editorStore } from '@/stores/editor';
// 设置激活分类，并且节点盒中的节点会根据分类进行过滤
const setActiveCategoryId = (index) => {
  editorStore.setActiveCategoryIndex(index);
};
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
  background-color: var(--category-color);
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
