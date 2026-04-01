import store from "@/store.js"; // 引入全局状态
import { toScreen } from "@/utils/position.js"; // 引入坐标转换
// --- 更新节点菜单和面板的屏幕位置 ---
const updateFloatingPosition = (nodeId) => {
	if (!nodeId) return; // 没有节点ID直接返回

	const node = store.blueprint.nodes.find((n) => n.id === nodeId); // 找到目标节点
	if (!node) return; // 节点不存在直接返回

	const width = node.dimensions?.width || 200; // 获取节点宽度
	const height = node.dimensions?.height || 60; // 获取节点高度
	const centerX = node.position.x + width / 2; // 计算节点中心X
	const centerY = node.position.y + height / 2; // 计算节点中心Y
	const screenPosition = toScreen(centerX, centerY); // 转换为屏幕坐标

	store.nodeContext.x = screenPosition.x; // 菜单X设为节点中心
	store.nodeContext.y = screenPosition.y; // 菜单Y设在节点顶部上方（减去半高偏移）
	store.nodeContext.gap = (height / 2) * store.viewport.zoom + 24; // 菜单与节点的间距设为节点高度一半，需要考虑viewport缩放
};

export { updateFloatingPosition }; // 导出位置更新函数
