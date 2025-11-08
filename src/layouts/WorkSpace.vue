<template>
  <div class="workspace">
    <BluePrint />
    <Toolbar />
  </div>
</template>

<script setup>
import BluePrint from "./BluePrint.vue";
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
