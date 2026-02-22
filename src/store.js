import { reactive } from 'vue' // 引入Vue的响应式API

// --- 全局状态仓库 ---
const store = reactive({
    blueprint: {                              // 蓝图基础数据
        name: '我的架构',                        // 蓝图名称
        nodes: [],                              // 节点数组
        edges: [],                              // 连接线数组
    },

    selected: {                               // 选择状态
        category: '',                           // 当前选中的分类标识，初始化时设为第一个分类
    },

    renaming: {                               // 内联编辑状态
        nodeId: null,                           // 当前正在重命名的节点ID，null表示没在重命名
        original: '',                           // 重命名前的原始名称，ESC取消时恢复用
    },

    viewport: {                               // 视口状态
        x: 0,                                   // 视口X偏移
        y: 0,                                   // 视口Y偏移
        zoom: 1,                                // 缩放比例
    },

    nodeContext: {                                // 节点上下文菜单状态，这个直接包含节点菜单和节点面板
        visible: false,                         // 是否显示菜单
        nodeId: null,                           // 绑定的节点ID
        x: 0,                                   // 菜单在屏幕上的X坐标
        y: 0,                                   // 菜单在屏幕上的Y坐标
    },

    nodeMenu: {                               // 节点右键菜单状态
        visible: false,                         // 是否显示菜单
        nodeId: null,                           // 绑定的节点ID
        x: 0,                                   // 菜单在屏幕上的X坐标
        y: 0,                                   // 菜单在屏幕上的Y坐标
    },

    nodePanel: {                              // 节点参数面板状态
        visible: false,                         // 是否显示面板
        nodeId: null,                           // 绑定的节点ID
        x: 0,                                   // 面板在屏幕上的X坐标
        y: 0,                                   // 面板在屏幕上的Y坐标
    },

    history: {                                // 历史记录
        snapshots: [],                          // 快照数组，每项是nodes和edges的深拷贝
        currentIndex: 0,                        // 当前快照索引
        maxCount: 50,                           // 最大快照数量
        paused: false,                          // 撤销/重做时暂停自动记录
    },

    clipboard: {                              // 剪贴板
        nodes: [],                              // 复制的节点数据
        edges: [],                              // 复制的连接线数据
    },

    registry: {                               // 节点注册表
        categories: {},                         // 分类表
        nodes: {},                              // 节点表
    },

    scoring: {},                              // 跑分状态数据（占位，格式待定）
})

export default store                        // 导出全局状态仓库
