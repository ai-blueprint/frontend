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

	workspace: {
		// 运行工作台只保存界面开关，不混入蓝图业务数据
		visible: false, // 是否显示右侧工作台
		activeTab: "execution", // 当前查看的工作台页签
		feedback: null, // 最近一次导入导出或远端操作反馈
	},

	transport: {
		// WebSocket传输状态，连接错误会直接显示在界面中
		status: "connecting", // connecting、connected或disconnected
		error: null, // 最近一次可见的连接或协议错误
	},

	runtime: {
		// 蓝图执行结果独立保存，避免污染蓝图和撤销历史
		execution: {
			requestId: null, // 当前运行请求ID，用于拒绝过期消息
			status: "idle", // idle、running、succeeded、failed或sendFailed
			durationMs: null, // 整张蓝图运行耗时
			outputNodeIds: [], // 后端确认的输出节点ID
			errorCount: 0, // 本次运行错误节点数量
			nodeResults: {}, // 按节点ID保存结构化输出
			nodeErrors: {}, // 按节点ID保存结构化错误
		},
		scoring: {
			requestId: null, // 当前跑分请求ID
			status: "idle", // idle、loading、succeeded、failed或sendFailed
			result: null, // 延迟、吞吐量、参数量、设备和节点耗时
			error: null, // 跑分错误
		},
		training: {
			requestId: null, // 当前训练请求ID
			cancelRequestId: null, // 当前取消请求ID
			status: "idle", // idle、running、succeeded、failed或sendFailed
			config: { epochs: 10, batchSize: 32, sampleCount: 1024, optimizer: "adam", learningRate: 0.001, lossNodeId: "" }, // 安全合成数据训练配置
			progress: null, // 最近一个训练进度快照
			result: null, // 训练完成数据
			error: null, // 训练错误
		},
		artifacts: {
			artifactName: "model", // 仅允许使用产物名称，不接收任意路径
			status: "idle", // idle、loading、succeeded、failed或sendFailed
			action: null, // save、load或export
			requestId: null, // 当前产物请求ID
			result: null, // 后端返回的保存、加载或导出结果
			error: null, // 产物操作错误
		},
		plugins: {
			requestId: null, // 当前插件请求ID
			status: "idle", // idle、loading、succeeded、failed或sendFailed
			items: [], // 后端返回的插件状态列表
			error: null, // 获取、重载或热更新错误
		},
	},
	mousePosition: { x: 0, y: 0 }, // 鼠标位置，方便直接被获取
});

export default store; // 导出全局状态仓库
