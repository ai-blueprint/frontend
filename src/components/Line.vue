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
import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue'

import { blueprintStore } from '@/stores/blueprint'
import { getElementCenter } from '@/tools/data/get-element-center'
// 定义组件属性
const props = defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

// 响应式数据
const paths = ref([])



// 计算贝塞尔曲线路径
function createBezierPath(from, to) {
  const midX = (from.x + to.x) / 2
  return `M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`
}

// 更新所有连接线
function updatePaths() {
  const allPaths = []

  // 1. 添加正式连接线
  if (Array.isArray(props.links)) {
    for (const link of props.links) {
      const fromCenter = getElementCenter(link.from)
      const toCenter = getElementCenter(link.to)

      if (fromCenter && toCenter) {
        allPaths.push({
          id: link.id,
          selected: link.selected,
          d: createBezierPath(fromCenter, toCenter)
        })
      }
    }
  }

  // 2. 添加临时连接线
  const tempLink = blueprintStore.state.tempLink
  if (tempLink) {
    const fromCenter = getElementCenter(tempLink.from)
    if (fromCenter) {
      let toPoint = tempLink.to

      // 处理目标点：可能是坐标对象或端点ID
      if (typeof toPoint === 'string') {
        toPoint = getElementCenter(toPoint)
        if (!toPoint) return
      }

      if (toPoint && typeof toPoint === 'object' && 'x' in toPoint && 'y' in toPoint) {
        allPaths.push({
          id: 'temp',
          isTemp: true,
          d: createBezierPath(fromCenter, toPoint)
        })
      }
    }
  }

  paths.value = allPaths
}

// 优化的鼠标移动事件处理函数
function handleMouseMove() {
  updatePaths()
}

// 监听相关状态变化，更新连接线
watch(
  () => [props.links, blueprintStore.state.nodes, blueprintStore.state.tempLink],
  () => {
    updatePaths()
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
