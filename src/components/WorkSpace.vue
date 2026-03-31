<script setup>
import CategoryBar from "@/components/CategoryBar.vue"; // 引入分类栏组件
import NodeList from "@/components/NodeList.vue"; // 引入节点列表组件
import Blueprint from "@/components/Blueprint.vue"; // 引入蓝图组件
const handleWorkspaceRightClick = (event) => {
	if (!event) return; // 没有事件对象时直接返回，避免空引用报错
	event.preventDefault(); // 阻止浏览器默认右键菜单
};
</script>

<template>
	<div class="workspace" @contextmenu="handleWorkspaceRightClick">
		<CategoryBar />
		<NodeList />
		<Blueprint />
	</div>
</template>

<style scoped>
.workspace {
	position: relative;
	display: flex;
	flex: 1;
	overflow: hidden;
	background-color: #e2e9fa;
}
</style>
