<template>
  <svg class="links">
    <path v-for="path in paths" :key="path.id || 'temp'" :d="path.d" :class="{ 
      selected: path.selected, 
      'temp-link': path.isTemp 
    }" />
  </svg>
</template>

<script setup>
import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue'
import { getScale } from '@/tools/data/get-scale'
import { blueprintStore } from '@/stores/blueprintStore'
const props = defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const paths = ref([])

// 获取元素中心坐标
function getCenter(id) {
  // 这里采用获取相对位置，相对于blueprint元素的位置
  const element = document.getElementById(id)
  if (!element) return null

  const elementRect = element.getBoundingClientRect()
  // 获取相对于blueprint元素的位置
  const blueprint = document.getElementById('blueprint')
  const blueprintRect = blueprint.getBoundingClientRect()

  // 获取元素缩放比例
  const scale = getScale(blueprint)

  return {
    x: (elementRect.left + elementRect.width / 2 - blueprintRect.left) / scale,
    y: (elementRect.top + elementRect.height / 2 - blueprintRect.top) / scale
  }

}

// 核心算法：计算贝塞尔曲线路径
function updatePaths() {
  const allPaths = []
  
  // 添加正式连接线
  if (props.links && Array.isArray(props.links)) {
    const regularPaths = props.links.map(link => {
      const from = getCenter(link.from)
      const to = getCenter(link.to)

      if (!from || !to) return null

      const midX = (from.x + to.x) / 2

      return {
        id: link.id,
        selected: link.selected,
        d: `M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`
      }
    }).filter(Boolean) // 过滤掉无效路径
    
    allPaths.push(...regularPaths)
  }
  
  // 添加临时连接线
  if (blueprintStore.state.tempLink) {
    const tempLink = blueprintStore.state.tempLink
    const from = getCenter(tempLink.from)
    let to = tempLink.to
    
    if (from) {
      // 如果to是坐标对象，直接使用；否则尝试获取端点中心
      if (typeof to === 'object' && to !== null && 'x' in to && 'y' in to) {
        // to是鼠标坐标
      } else if (typeof to === 'string') {
        // to是端点ID，获取其中心
        to = getCenter(to)
        if (!to) return
      } else {
        return
      }
      
      const midX = (from.x + to.x) / 2
      
      allPaths.push({
        id: 'temp',
        isTemp: true,
        d: `M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`
      })
    }
  }
  
  paths.value = allPaths
}

// 监听节点和临时连接线变化
watch(
  () => [blueprintStore.state.nodes, blueprintStore.state.tempLink],
  () => {
    updatePaths()
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  window.addEventListener('mousemove', () => updatePaths())
})

onUnmounted(() => {
  window.removeEventListener('mousemove', () => updatePaths())
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

}

path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 4;
  stroke-linecap: round;
  /* stroke-dasharray: 7; */
}

.temp-link {
  stroke: #ffffff;
  stroke-width: 4;
}

</style>
