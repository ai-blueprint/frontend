<template>
  <div class="editor">
    <HeaderBar />
    <main class="main-area">
      <CategoryBar />
      <NodesBox />
      <WorkSpace />
      <Panel />
    </main>
  </div>
</template>

<script setup>
// 编辑器主组件，集成所有子组件
// 导入所有子组件
import HeaderBar from "./layouts/HeaderBar.vue";
import CategoryBar from "./layouts/CategoryBar.vue";
import NodesBox from "./layouts/NodesBox.vue";
import WorkSpace from "./layouts/WorkSpace.vue";
import Panel from "./layouts/Panel.vue";

import "./style.css";

import { onMounted, onUnmounted } from "vue";

// 持续监测鼠标位置并全局共享
import { mouseStore } from "@/stores/mouse";
function handleMove(e) {
  mouseStore.move(e);
}
onMounted(() => {
  window.addEventListener("mousemove", handleMove);
});
onUnmounted(() => {
  window.removeEventListener("mousemove", handleMove);
});
</script>

<style scoped>
.editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-area {
  height: 100%;
  display: flex;
  overflow: hidden;
}
</style>
