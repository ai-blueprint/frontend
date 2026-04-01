/* 全局数据存储位置，便于数据的传递，注意：该文件只负责做数据存储定义，数据修改逻辑禁止写到该文件中 */
import { reactive } from "vue"; // 引入Vue的响应式API

// --- 全局状态仓库 ---
const store = reactive({
	blueprint: {
		// 蓝图基础数据
		name: "我的架构", // 蓝图名称
		nodes: [], // 节点数组
		edges: [], // 连接线数组
	},

	selected: {
		// 选择状态
		category: "", // 当前选中的分类标识，初始化时设为第一个分类
	},

	renaming: {
		// 内联编辑状态
		nodeId: null, // 当前正在重命名的节点ID，null表示没在重命名
		original: "", // 重命名前的原始名称，ESC取消时恢复用
	},

	viewport: {
		// 视口状态
		x: 0, // 视口X偏移
		y: 0, // 视口Y偏移
		zoom: 1, // 缩放比例
	},

	nodeContext: {
		// 节点上下文菜单状态，这个直接包含节点菜单和节点面板
		visible: false,
		nodeId: null,
		gap: 0,
		x: 0,
		y: 0,
	},

	history: {
		// 历史记录
		snapshots: [], // 快照数组，每项是nodes和edges的深拷贝
		currentIndex: 0, // 当前快照索引
		maxCount: 50, // 最大快照数量
		paused: false, // 撤销/重做时暂停自动记录
	},

	clipboard: {
		// 剪贴板（仅作为本地兜底缓存）
		nodes: [], // 复制的节点数据
		edges: [], // 复制的连接线数据
	},

	registry: {
		// 节点注册表
		categories: {}, // 分类表
		nodes: {}, // 节点表
	},

	scoring: {}, // 跑分状态数据（占位，格式待定）
	mousePosition: { x: 0, y: 0 }, // 鼠标位置，方便直接被获取
});

export default store; // 导出全局状态仓库
