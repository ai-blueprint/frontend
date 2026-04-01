import { watch } from "vue"; // 引入Vue的watch
import store from "@/store.js"; // 引入全局状态
import { updateFloatingPosition } from "@/utils/floatingPosition.js"; // 引入位置更新工具

let hasStarted = false; // 标记是否已完成初始化，这个主要是防止被多次import时重复监听导致的性能问题

// --- 初始化数据维护监听 ---
const initWatchers = () => {
	if (hasStarted) return; // 已初始化直接返回

	// --- 监听节点数量变化，清理失效的菜单和面板，防止节点被删除后节点菜单和节点面板还存在 ---
	watch(
		() => store.blueprint.nodes.length, // 监听节点数组长度
		() => {
			if (store.nodeContext.visible && store.nodeContext.nodeId) {
				// 菜单正在显示
				const node = store.blueprint.nodes.find((n) => n.id === store.nodeContext.nodeId); // 查找菜单绑定的节点
				if (!node) {
					// 节点已被删除
					store.nodeContext.visible = false; // 隐藏菜单
					store.nodeContext.nodeId = null; // 清空绑定
				}
			}
		},
	);

	// --- 监听菜单绑定节点的位置变化，更新菜单位置 ---
	watch(
		() => {
			if (!store.nodeContext.visible || !store.nodeContext.nodeId) return null; // 菜单不可见就不监听
			const node = store.blueprint.nodes.find((n) => n.id === store.nodeContext.nodeId); // 找到绑定节点
			if (!node) return null; // 节点不存在返回null
			return {
				// 返回需要监听的数据
				x: node.position.x, // 节点X坐标
				y: node.position.y, // 节点Y坐标
				width: node.dimensions?.width, // 节点宽度
				height: node.dimensions?.height, // 节点高度
				viewportX: store.viewport.x, // 视口X
				viewportY: store.viewport.y, // 视口Y
				viewportZoom: store.viewport.zoom, // 视口缩放
			};
		},
		(newVal) => {
			if (!newVal) return; // 无数据不处理
			updateFloatingPosition(store.nodeContext.nodeId); // 更新菜单位置
		},
		{ deep: true }, // 深度监听
	);
	hasStarted = true; // 标记为已初始化
};

initWatchers(); // 导入模块后立即启动

export { initWatchers }; // 导出初始化函数
