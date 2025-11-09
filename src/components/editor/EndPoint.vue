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
import { ref, onUnmounted, defineProps } from "vue";
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
// 检查端点类型
function getEndpointType(endpointId) {
  const nodes = blueprintStore.state.nodes;
  for (const node of nodes) {
    const inputEndpoint = node.endpoints.in?.find(e => `${node.id}_${e}` === endpointId);
    const outputEndpoint = node.endpoints.out?.find(e => `${node.id}_${e}` === endpointId);
    if (inputEndpoint) return 'in';
    if (outputEndpoint) return 'out';
  }
  return null;
}
// 鼠标按下时开始创建连接
function onMouseDown(e) {
  // 先看
  // 阻止事件冒泡，避免节点拖动
  e.stopPropagation();
  // 阻止默认行为，避免文本选择等
  e.preventDefault();
  // 设置临时连接线起点
  blueprintStore.setTempLink(props.id);
  // 添加鼠标事件监听
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mouseleave', onMouseUp); // 处理鼠标离开窗口的情况
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mouseleave', onMouseUp);
})

// 鼠标移动时更新临时连接线终点
function onMouseMove(e) {
  e.preventDefault();
  const blueprintEl = document.getElementById('blueprint');
  if (!blueprintEl) return;

  const position = getMouseRelativeCoordinate(blueprintEl, e, true);
  const nearbyEndpoint = findNearbyEndpoint(position, 20);

  // 清除所有吸附样式
  document.querySelectorAll('.endpoint.snap').forEach(el => el.classList.remove('snap'));

  if (nearbyEndpoint && nearbyEndpoint !== blueprintStore.state.tempLink.from) {
    // 吸附到端点并添加视觉反馈
    document.getElementById(nearbyEndpoint)?.classList.add('snap');
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, nearbyEndpoint);
  } else {
    // 更新临时连接线终点为鼠标位置
    blueprintStore.setTempLink(blueprintStore.state.tempLink.from, { x: position.x, y: position.y });
  }
}


// 查找附近的端点
function findNearbyEndpoint(position, radius) {
  const blueprint = document.getElementById('blueprint');
  const scaleValue = getScale(blueprint);
  const blueprintRect = blueprint.getBoundingClientRect();
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


// 鼠标释放时完成或取消连接
function onMouseUp(e) {
  // 移除事件监听和清理样式
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mouseleave', onMouseUp);
  document.querySelectorAll('.endpoint.snap').forEach(el => el.classList.remove('snap'));

  const tempLink = blueprintStore.state.tempLink;
  if (!tempLink?.from) {
    console.log('连接取消：没有起始端点');
    blueprintStore.clearTempLink();
    return;
  }

  // 获取目标端点ID
  const targetId = typeof tempLink.to === 'string'
    ? tempLink.to
    : findEndpointElement(e.target)?.id;

  if (!targetId || targetId === tempLink.from) {
    console.log('连接失败：无效的目标端点');
    blueprintStore.clearTempLink();
    return;
  }

  // 获取端点类型并验证连接方向
  const [fromType, toType] = [getEndpointType(tempLink.from), getEndpointType(targetId)];
  console.log('端点类型判断:', tempLink.from, 'type:', fromType, targetId, 'type:', toType);

  const isValidConnection = (fromType === 'out' && toType === 'in') || (fromType === 'in' && toType === 'out');

  if (!isValidConnection) {
    console.log('连接失败：不允许的连接类型组合');
    blueprintStore.clearTempLink();
    return;
  }

  // 确保连接方向为 out→in
  const [finalFrom, finalTo] = fromType === 'out'
    ? [tempLink.from, targetId]
    : [targetId, tempLink.from];

  console.log('连接方向:', fromType === 'out' ? 'out→in' : 'in→out，已交换为out→in');

  // 检查是否已存在连接
  const existingLink = blueprintStore.state.links.find(link =>
    link.from === finalFrom && link.to === finalTo
  );

  if (!existingLink) {
    // 移除所有连接到目标in端点的现有连接
    const linksToRemove = blueprintStore.state.links.filter(link => link.to === finalTo);
    linksToRemove.forEach(link => blueprintStore.deleteLink(link.id));

    // 创建新连接
    blueprintStore.addLink(finalFrom, finalTo);
    console.log('成功创建连接:', finalFrom, '→', finalTo,
      linksToRemove.length ? `并移除了${linksToRemove.length}个旧连接` : '');
  } else {
    console.log('连接已存在，无需重复创建');
  }

  blueprintStore.clearTempLink();
}

// 辅助函数：查找最近的端点元素
function findEndpointElement(element) {
  while (element?.nodeType === 1) {
    if (element.classList.contains('endpoint')) return element;
    element = element.parentNode;
  }
  return null;
}

</script>
