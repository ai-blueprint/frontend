<template>
  <div id="workspace" class="workspace">
    <Blueprint />
    <Toolbar />
  </div>
</template>

<script setup>
import Blueprint from "./Blueprint.vue";
import Toolbar from "./ToolBar.vue";
</script>

<style scoped>
.workspace {
  position: relative;
  background-color: #e2e9fa;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
