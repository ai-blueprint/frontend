<template>
  <span class="endpoint" ref="endpoint" @mousedown="onMouseDown" :id="id"></span>
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
</style>

<script setup>
import { ref,defineProps, onUnmounted, computed } from "vue";
import { blueprintStore } from "@/stores/blueprintStore";
import { getScale } from "@/tools/data/get-scale";
import { getMouseRelativeCoordinate } from "@/tools/data/get-mouse-relative-coordinate";

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const endpoint = ref(null);
const blueprintEl = computed(() => document.getElementById('blueprint'));

// 端点类型映射
const endpointTypeMap = computed(() => {
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
const getEndpointType = (endpointId) => endpointTypeMap.value.get(endpointId);

// 清理事件监听和样式
function cleanup() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mouseleave', onMouseUp);
  document.querySelectorAll('.endpoint.snap').forEach(el => el.classList.remove('snap'));
}

// 鼠标事件处理
function onMouseDown(e) {
  const endpointId = props.id.split('_')[0];
  if (endpointId === "undefined") return;

  e.stopPropagation();
  e.preventDefault();
  blueprintStore.setTempLink(props.id);

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mouseleave', onMouseUp);
}

function onMouseMove(e) {
  e.preventDefault();
  if (!blueprintEl.value) return;

  const position = getMouseRelativeCoordinate(blueprintEl.value, e, true);
  const nearbyEndpoint = findNearbyEndpoint(position, 20);

  document.querySelectorAll('.endpoint.snap').forEach(el => el.classList.remove('snap'));

  if (nearbyEndpoint && nearbyEndpoint !== blueprintStore.state.tempLink.from) {
    document.getElementById(nearbyEndpoint)?.classList.add('snap');
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, nearbyEndpoint);
  } else {
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, { x: position.x, y: position.y });
  }
}

function onMouseUp(e) {
  cleanup();

  const tempLink = blueprintStore.state.tempLink;
  if (!tempLink?.from) {
    blueprintStore.clearTempLink();
    return;
  }

  const targetId = typeof tempLink.to === 'string'
    ? tempLink.to
    : findEndpointElement(e.target)?.id;

  if (!targetId || targetId === tempLink.from) {
    blueprintStore.clearTempLink();
    return;
  }

  const [fromType, toType] = [getEndpointType(tempLink.from), getEndpointType(targetId)];
  const isValidConnection = (fromType === 'out' && toType === 'in') || (fromType === 'in' && toType === 'out');

  if (!isValidConnection) {
    blueprintStore.clearTempLink();
    return;
  }

  const [finalFrom, finalTo] = fromType === 'out'
    ? [tempLink.from, targetId]
    : [targetId, tempLink.from];

  const existingLink = blueprintStore.state.links.find(link => link.from === finalFrom && link.to === finalTo
  );

  if (!existingLink) {
    const linksToRemove = blueprintStore.state.links.filter(link => link.to === finalTo);
    linksToRemove.forEach(link => blueprintStore.deleteLink(link.id));
    blueprintStore.addLink(finalFrom, finalTo);
  }

  blueprintStore.clearTempLink();
}

// 查找附近的端点
function findNearbyEndpoint(position, radius) {
  if (!blueprintEl.value) return null;

  const scaleValue = getScale(blueprintEl.value);
  const blueprintRect = blueprintEl.value.getBoundingClientRect();
  const fromType = getEndpointType(blueprintStore.state.tempLink.from);

  return Array.from(document.querySelectorAll('.endpoint'))
    .filter(endpoint => {
      const endpointId = endpoint.id;
      if (endpointId === blueprintStore.state.tempLink.from) return false;

      const toType = getEndpointType(endpointId);
      return fromType && toType && fromType !== toType;
    })
    .find(endpoint => {
      const rect = endpoint.getBoundingClientRect();
      const endpointCenter = {
        x: (rect.left + rect.width / 2 - blueprintRect.left) / scaleValue,
        y: (rect.top + rect.height / 2 - blueprintRect.top) / scaleValue
      };

      const distance = Math.sqrt(
        Math.pow(position.x - endpointCenter.x, 2) +
        Math.pow(position.y - endpointCenter.y, 2)
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
onUnmounted(cleanup);
</script>
