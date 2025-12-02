<template>
  <span class="port" ref="portRef" @mousedown="handleMouseDown" :id="id" :class="{ connected: isConnected }"></span>
</template>



<script setup>
import { ref, defineProps, onUnmounted, computed } from "vue";
import { blueprintStore } from "@/stores/blueprint";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate";
import { getElementCenter } from "@/tools/data/get-element-center";
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
      node.ports[type]?.forEach(e => {
        map.set(`${node.id}_${e}`, type);
      });
    });
  });
  return map;
});

// 获取端点类型
const getType = (portId) => typeMap.value.get(portId);

// 清理事件监听和样式
function cleanupEventListeners() {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('mouseleave', handleMouseUp);
  clearSnapStyles();
}

// 清除吸附样式
function clearSnapStyles() {
  document.querySelectorAll('.port.snap').forEach(el =>
    el.classList.remove('snap')
  );
}

// 检查连接有效性
function isValidConnectionType(fromType, toType) {
  return (fromType === 'out' && toType === 'in') || (fromType === 'in' && toType === 'out');
}



// 查找附近的端点
function findNearbyPort(position, radius) {
  if (!blueprintEl.value) return null;
  const fromType = getType(blueprintStore.state.tempLink.from);
  return Array.from(document.querySelectorAll('.port'))
    .filter(port => {
      const portId = port.id;
      // 排除自己
      if (portId === blueprintStore.state.tempLink.from) return false;
      // 排除该端点所在节点的其他端点
      const nodeId = portId.split('_')[0];
      if (nodeId === blueprintStore.state.tempLink.from.split('_')[0]) return false;

      // 只考虑类型不同的端点
      const toType = getType(portId);
      return fromType && toType && fromType !== toType;
    })
    .find(port => {
      // 获取端点中心位置
      const center = getElementCenter(port.id);

      // 计算距离
      const distance = Math.hypot(
        position.x - center.x,
        position.y - center.y
      );

      return distance <= radius;
    })?.id || null;
}

// 查找端点元素
function findPortElement(element) {
  while (element?.nodeType === 1) {
    if (element.classList.contains('port')) return element;
    element = element.parentNode;
  }
  return null;
}
// 处理鼠标按下事件
function handleMouseDown(event) {
  const nodeId = props.id.split('_')[0];
  // 如果节点id是空的或者是undefined，那么就直接返回
  if (nodeId === "undefined" || nodeId === "") return;
  const portId = props.id;

  event.stopPropagation();
  event.preventDefault();
  // 如果端点是输入端点，并且已经连接，则断开连接并溯源至原本的输出端点来创建新的连接，如果没有连接那就正常拉出连接
  if (getType(portId) === 'in' && isConnected.value) {
    const link = blueprintStore.state.links.find(link => link.to === props.id);
    if (link) {
      blueprintStore.deleteLink(link.id);
      blueprintStore.setTempLink(link.from);
    }
  } else {
    blueprintStore.setTempLink(portId);
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

  // 连接线吸附效果实现
  const position = getMouseRelativeCoordinate(blueprintEl.value, event, true);
  const blueprintScale = blueprintStore.state.scale;
  const nearbyPort = findNearbyPort(position, 30 / blueprintScale);

  clearSnapStyles();

  // 处理吸附效果
  if (nearbyPort && nearbyPort !== blueprintStore.state.tempLink.from) {
    document.getElementById(nearbyPort)?.classList.add('snap');
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, nearbyPort);
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
    : findPortElement(event.target)?.id;

  if (!targetId || targetId === tempLink.from) {
    blueprintStore.clearTempLink();
    return;
  }

  // 验证连接有效性
  const [fromType, toType] = [getType(tempLink.from), getType(targetId)];
  if (!isValidConnectionType(fromType, toType) || tempLink.from.split('_')[0] === targetId.split('_')[0]) {
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
// 组件卸载时清理
onUnmounted(cleanupEventListeners);
</script>


<style scoped>
.port {
  display: flex;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.1s ease-in-out;
}

.port:hover {
  transform: scale(1.2);
  background-color: #8cff00;
}

.port.snap {
  background-color: #FFD700;
  transform: scale(1.4);
}
</style>