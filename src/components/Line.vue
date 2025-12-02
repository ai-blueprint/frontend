<template>
  <svg class="links">
    <path v-for="path in paths" :key="path.id || 'temp'" :d="path.d" :class="{
      selected: path.selected,
      'temp-link': path.isTemp
    }" />
  </svg>
</template>

<script setup>
import { ref, defineProps, onMounted, onUnmounted } from 'vue'
import { blueprintStore } from '@/stores/blueprint'
import { updatePaths } from '@/tools/line/update-line-paths'
// 定义组件属性
const props = defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

// 响应式数据
const paths = ref([])

// 实时更新连接线，采用帧动画，避免卡顿
function handleFrameUpdate() {
  paths.value = updatePaths(props.links, blueprintStore.state.nodes, blueprintStore.state.tempLink)
}
// 使用 requestAnimationFrame 实现帧动画
function startFrameUpdate() {
  const frameUpdate = () => {
    handleFrameUpdate()
    requestAnimationFrame(frameUpdate)
  }
  requestAnimationFrame(frameUpdate)
}

// 组件挂载后启动帧动画
onMounted(() => {
  startFrameUpdate()
})
// 组件卸载后停止帧动画
onUnmounted(() => {
  cancelAnimationFrame(startFrameUpdate)
})
</script>

<style scoped>
.links {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999999999999;
}

path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 4;
  stroke-linecap: round;

}

.temp-link {
  stroke: #ffffff;
  stroke-width: 4;
}
</style>
