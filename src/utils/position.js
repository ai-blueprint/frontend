import store from "@/store.js"; // 引入全局状态
const getContainerRect = () => {
	const container = document.querySelector(".vue-flow__container");
	return container?.getBoundingClientRect() || { left: 0, top: 0 };
};
// --- 画布坐标转屏幕坐标 ---
const toScreen = (canvasX, canvasY) => {
	const { x, y, zoom } = store.viewport; // 获取视口参数
	const { left: containerLeft, top: containerTop } = getContainerRect();
	const screenX = canvasX * zoom + x + containerLeft; // 画布X乘缩放加偏移得屏幕X
	const screenY = canvasY * zoom + y + containerTop; // 画布Y乘缩放加偏移得屏幕Y
	return { x: screenX, y: screenY }; // 返回屏幕坐标
};

// --- 屏幕坐标转画布坐标 ---
const toCanvas = (screenX, screenY) => {
	const { x, y, zoom } = store.viewport; // 获取视口参数
	const { left: containerLeft, top: containerTop } = getContainerRect();
	const canvasX = (screenX - x - containerLeft) / zoom; // 屏幕X减偏移除缩放得画布X
	const canvasY = (screenY - y - containerTop) / zoom; // 屏幕Y减偏移除缩放得画布Y
	return { x: canvasX, y: canvasY }; // 返回画布坐标
};

export { toScreen, toCanvas }; // 导出坐标转换函数
