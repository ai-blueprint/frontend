<template>
  <span class="endpoint" ref="endpoint"></span>
</template>
<style scoped>
.endpoint {
  display: flex;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
}
</style>
<script setup>
import { ref } from "vue";
// 获取端点元素对象
const endpoint = ref(null);
// 当被按下时，创建连接线，todo：实现相互之间的连接
</script>
