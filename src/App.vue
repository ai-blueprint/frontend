<script setup>
import TopBar from "@/components/TopBar.vue"; // 引入顶部栏组件
import WorkSpace from "@/components/WorkSpace.vue"; // 引入工作区组件
import store from "@/store.js"; // 引入全局状态
// 更新鼠标位置，用于给其他地方直接获取鼠标位置
function updateMousePosition(e) {
	const { x, y } = e;
	store.mousePosition.x = x;
	store.mousePosition.y = y;
}
</script>

<template>
	<div class="app" @mousemove="updateMousePosition">
		<TopBar />
		<WorkSpace />
	</div>
</template>

<style scoped>
.app {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	user-select: none;
}
</style>
