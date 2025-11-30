<template>
  <svg class="links">
    <path 
      v-for="path in paths" 
      :key="path.id || 'temp'" 
      :d="path.d" 
      :class="{
        selected: path.selected,
        'temp-link': path.isTemp
      }" 
    />
  </svg>
</template>

<script setup>
import { ref, defineProps, watch, onMounted, onUnmounted, nextTick } from 'vue'

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

// 优化的鼠标移动事件处理函数
function handleMouseMove() {
  paths.value = updatePaths(props.links, blueprintStore.state.nodes, blueprintStore.state.tempLink)
}

// 监听相关状态变化，更新连接线
watch(
  () => [props.links, blueprintStore.state.nodes, blueprintStore.state.tempLink],
  async () => {
    // 使用 nextTick 确保 DOM 已经更新，节点元素已经被重新渲染
    await nextTick()
    paths.value = updatePaths(props.links, blueprintStore.state.nodes, blueprintStore.state.tempLink)
  },
  { deep: true, immediate: true }
)

// 生命周期钩子：添加和移除事件监听器
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
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
