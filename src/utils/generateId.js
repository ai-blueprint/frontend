// --- 随机ID生成器 ---
const generateId = () => {
	const timestamp = Date.now().toString(36); // 时间戳转36进制作为前缀
	const random = Math.random().toString(36).substring(2, 8); // 随机数转36进制取6位
	return `${timestamp}-${random}`; // 拼接成唯一ID
};

export default generateId; // 导出生成函数
