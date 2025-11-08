<template>
  <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
    <path :d="generateBezier(positionFrom, positionTo)" stroke="#fff" stroke-width="3" fill="none" />
  </svg>
</template>
<script setup>
import { ref, defineProps, onMounted } from "vue";
const props = defineProps({
  link: Object,
});
import { generateBezier } from "@/tools/data/generate-bezier";
import { mouseStore } from "@/stores/mouseStore";
// 定义一个根据传入的from和to的id，获取对应坐标的函数
function getPosition(id) {
  // 找到id所对应的元素的位置
  const element = document.getElementById(id);

  if (element) {
    console.log(`找到id为${id}的元素`);

    const rect = element.getBoundingClientRect();
    console.log({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  // 如果没有找到node元素或者endpoint元素，就返回鼠标的位置信息
  console.log(`没有找到id为${id}的元素，返回鼠标的位置信息`);
  return {
    x: mouseStore.state.x,
    y: mouseStore.state.y,
  };

}
// 将link.from, link.to转换为坐标
const positionFrom = ref({ x: 0, y: 0 });
const positionTo = ref({ x: 0, y: 0 });
function updatePosition() {
  positionFrom.value = getPosition(props.link.from);
  positionTo.value = getPosition(props.link.to);
}
onMounted(() => {
  window.addEventListener("mousemove", updatePosition);
});
</script>
