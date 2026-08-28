/* 全局数据存储位置，便于数据的传递，注意：该文件只负责做数据存储定义，数据修改逻辑禁止写到该文件中 */
import { reactive } from "vue"; // 引入Vue的响应式API

// --- 全局状态仓库 ---
const store = reactive({
	blueprint: {
		// 蓝图基础数据
		name: "我的架构", // 蓝图名称
		variables: [], // 蓝图变量列表，每项{id, name, value}，节点参数可用名称引用
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

	experiment: {
		// 实时传播开关独立于蓝图数据，不进入保存文件和撤销历史
		running: false, // 是否持续生成随机输入并逐节点传播
		feedback: null, // 最近一次导入导出或远端操作反馈
	},

	transport: {
		// WebSocket传输状态，连接错误会直接显示在界面中
		status: "connecting", // connecting、connected或disconnected
		error: null, // 最近一次可见的连接或协议错误
	},

	runtime: {
		// 只保存教学实验需要的逐节点传播结果
		execution: {
			requestId: null, // 当前运行请求ID，用于拒绝过期消息
			status: "idle", // idle、running、succeeded、failed或sendFailed
			durationMs: null, // 整张蓝图运行耗时
			outputNodeIds: [], // 后端确认的输出节点ID
			errorCount: 0, // 本次运行错误节点数量
			nodeResults: {}, // 按节点ID保存结构化输出
			nodeErrors: {}, // 按节点ID保存结构化错误
		},
		scan: {
			// 保存Block可堆叠静态扫描结论
			requestId: null, // 当前扫描请求ID，用于拒绝过期响应
			status: "idle", // idle、scanning、stackable、notStackable或unknown
			issues: [], // 影响结论的结构化问题
			inputShapes: {}, // 输入节点探测形状
			outputShapes: {}, // 输出节点接收形状
		},
		training: {
			// 保存单步训练结果和曲线，不进入蓝图文件或撤销历史
			requestId: null, // 当前训练请求ID
			status: "idle", // idle、training、succeeded或failed
			step: 0, // 已完成训练步数
			loss: null, // 最近一次损失值
			curve: [], // 按训练步保存损失曲线
			nodes: {}, // 按节点保存最近一次权重、梯度和变化量
			error: null, // 最近一次训练错误
			continuous: false, // 是否自动连续训练
			optimizer: "sgd", // 当前优化器名称
			learningRate: 0.01, // 当前学习率
			gradientClip: 0, // 梯度裁剪阈值，0表示关闭
		},
	},
	mousePosition: { x: 0, y: 0 }, // 鼠标位置，方便直接被获取
});

export default store; // 导出全局状态仓库
