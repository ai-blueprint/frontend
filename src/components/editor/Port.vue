<template>
  <span class="endpoint" ref="portRef" @mousedown="handleMouseDown" :id="id" :class="{ connected: isConnected }"></span>
</template>

<style scoped>
.endpoint {
  display: flex;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.1s ease-in-out;
}

.endpoint:hover {
  transform: scale(1.2);
  background-color: #8cff00;
}

.endpoint.snap {
  background-color: #FFD700;
  transform: scale(1.4);
}

/* 没想好用什么样式 */
/* .endpoint.connected {} */
</style>

<script setup>
import { ref, defineProps, onUnmounted, computed } from "vue";
import { blueprintStore } from "@/stores/blueprint";
import { getScale } from "@/tools/data/get-scale";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate";

// 定义组件属性
const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

// 组件引用和计算属性
const portRef = ref(null);
const blueprintEl = computed(() => document.getElementById('blueprint'));

// 计算端点是否已连接
const isConnected = computed(() => {
  return blueprintStore.state.links.some(link =>
    link.from === props.id || link.to === props.id
  );
});

// 端点类型映射
const typeMap = computed(() => {
  const map = new Map();
  blueprintStore.state.nodes.forEach(node => {
    ['in', 'out'].forEach(type => {
      node.endpoints[type]?.forEach(e => {
        map.set(`${node.id}_${e}`, type);
      });
    });
  });
  return map;
});

// 获取端点类型
const getType = (endpointId) => typeMap.value.get(endpointId);

// 清理事件监听和样式
function cleanupEventListeners() {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mouseleave', handleMouseUp);
  clearSnapStyles();
}

// 清除吸附样式
function clearSnapStyles() {
  document.querySelectorAll('.endpoint.snap').forEach(el =>
    el.classList.remove('snap')
  );
}

// 检查连接有效性
function isValidConnectionType(fromType, toType) {
  return (fromType === 'out' && toType === 'in') || (fromType === 'in' && toType === 'out');
}

// 处理鼠标按下事件
function handleMouseDown(event) {
  const nodeId = props.id.split('_')[0];
  // 如果节点id是空的或者是undefined，那么就直接返回
  if (nodeId === "undefined" || nodeId === "") return;
  const endpointId = props.id;
  console.log(props.id);
  
  event.stopPropagation();
  event.preventDefault();
  // 如果端点是输入端点，并且已经连接，则断开连接并溯源至原本的输出端点来创建新的连接，如果没有连接那就正常拉出连接
  if (getType(endpointId) === 'in' && isConnected.value) {
    const link = blueprintStore.state.links.find(link => link.to === props.id);
    if (link) {
      blueprintStore.deleteLink(link.id);
      blueprintStore.setTempLink(link.from);
    }
  } else {
    blueprintStore.setTempLink(endpointId);
  }


  // 添加事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mouseleave', handleMouseUp);
}

// 处理鼠标移动事件
function handleMouseMove(event) {
  event.preventDefault();
  if (!blueprintEl.value) return;

  const position = getMouseRelativeCoordinate(blueprintEl.value, event, true);
  const nearbyEndpoint = findNearbyEndpoint(position, 20);

  clearSnapStyles();

  // 处理吸附效果
  if (nearbyEndpoint && nearbyEndpoint !== blueprintStore.state.tempLink.from) {
    document.getElementById(nearbyEndpoint)?.classList.add('snap');
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, nearbyEndpoint);
  } else {
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, { x: position.x, y: position.y });
  }
}

// 处理鼠标释放事件
function handleMouseUp(event) {
  cleanupEventListeners();

  const tempLink = blueprintStore.state.tempLink;
  if (!tempLink?.from) {
    blueprintStore.clearTempLink();
    return;
  }

  // 确定目标端点ID
  const targetId = typeof tempLink.to === 'string'
    ? tempLink.to
    : findEndpointElement(event.target)?.id;

  if (!targetId || targetId === tempLink.from) {
    blueprintStore.clearTempLink();
    return;
  }

  // 验证连接有效性
  const [fromType, toType] = [getType(tempLink.from), getType(targetId)];
  if (!isValidConnectionType(fromType, toType)) {
    blueprintStore.clearTempLink();
    return;
  }

  // 规范化连接方向（out -> in）
  const [finalFrom, finalTo] = fromType === 'out'
    ? [tempLink.from, targetId]
    : [targetId, tempLink.from];

  // 检查是否已存在相同连接
  const existingLink = blueprintStore.state.links.find(link =>
    link.from === finalFrom && link.to === finalTo
  );

  if (!existingLink) {
    // 移除目标端点的现有连接（如果有）
    const linksToRemove = blueprintStore.state.links.filter(link => link.to === finalTo);
    linksToRemove.forEach(link => blueprintStore.deleteLink(link.id));

    // 添加新连接
    blueprintStore.addLink(finalFrom, finalTo);
  }

  blueprintStore.clearTempLink();
}

// 查找附近的端点
function findNearbyEndpoint(position, radius) {
  if (!blueprintEl.value) return null;

  const scaleValue = getScale(blueprintEl.value);
  const blueprintRect = blueprintEl.value.getBoundingClientRect();
  const fromType = getType(blueprintStore.state.tempLink.from);
  return Array.from(document.querySelectorAll('.endpoint'))
    .filter(endpoint => {
      const endpointId = endpoint.id;
      // 排除自己
      if (endpointId === blueprintStore.state.tempLink.from) return false;

      // 只考虑类型不同的端点
      const toType = getType(endpointId);
      return fromType && toType && fromType !== toType;
    })
    .find(endpoint => {
      // 计算端点中心位置
      const rect = endpoint.getBoundingClientRect();
      const center = {
        x: (rect.left + rect.width / 2 - blueprintRect.left) / scaleValue,
        y: (rect.top + rect.height / 2 - blueprintRect.top) / scaleValue
      };

      // 计算距离
      const distance = Math.hypot(
        position.x - center.x,
        position.y - center.y
      );

      return distance <= radius;
    })?.id || null;
}

// 查找端点元素
function findEndpointElement(element) {
  while (element?.nodeType === 1) {
    if (element.classList.contains('endpoint')) return element;
    element = element.parentNode;
  }
  return null;
}

// 组件卸载时清理
onUnmounted(cleanupEventListeners);
</script>
