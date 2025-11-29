import { reactive, readonly } from "vue";

/**
 * Nodes Store
 * 管理节点组的动态加载、注册和查询
 */

// 调试日志开关
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

/**
 * 节点组状态数组
 * 存储所有注册的节点组
 */
const state = reactive([]);

/**
 * 节点组加载状态
 * 标记是否已完成初始化加载
 */
const isLoaded = reactive({ value: false });

/**
 * 注册节点组
 * @param {Object} nodeGroup - 节点组对象，包含name、nodes、color等属性
 */
const registerNodeGroup = (nodeGroup) => {
  if (!nodeGroup || !nodeGroup.name) {
    console.error('注册节点组失败：无效的节点组对象');
    return;
  }
  
  // 检查是否已存在相同名称的节点组
  const existingIndex = state.findIndex(group => group.name === nodeGroup.name);
  
  if (existingIndex >= 0) {
    // 更新已存在的节点组
    state[existingIndex] = nodeGroup;
    debugLog(`更新节点组: ${nodeGroup.name}`);
  } else {
    // 添加新的节点组
    state.push(nodeGroup);
    debugLog(`新增节点组: ${nodeGroup.name}，包含 ${nodeGroup.nodes?.length || 0} 个节点`);
  }
};

/**
 * 加载所有节点组JSON文件
 * 使用require.context动态导入node-groups目录下的所有JSON文件
 */
const loadNodeGroups = () => {
  // 防止重复加载
  if (isLoaded.value) return;
  
  try {
    // 使用 require.context 动态导入所有节点组JSON文件
    // 第二个参数false表示不搜索子目录，第三个参数匹配所有.json文件
    const nodeGroupContext = require.context('@/assets/node-groups', false, /\.json$/);
    
    // 遍历并注册所有节点组
    nodeGroupContext.keys().forEach(key => {
      try {
        const nodeGroup = nodeGroupContext(key);
        registerNodeGroup(nodeGroup);
      } catch (err) {
        console.error(`加载节点组文件失败 (${key}):`, err);
      }
    });
    
    isLoaded.value = true;
    debugLog(`节点组加载完成，共加载 ${state.length} 个节点组`);
  } catch (error) {
    console.error('加载节点组目录失败:', error);
  }
};

/**
 * 内部辅助函数：查找节点及其所在的节点组
 * @param {string} opcode - 节点操作码
 * @returns {Object|null} - 包含node和category的对象，或null
 */
function findNodeAndCategory(opcode) {
  if (!opcode) return null;
  
  for (const category of state) {
    if (!category.nodes) continue;
    
    for (const node of category.nodes) {
      if (node && node.opcode === opcode) {
        return { node, category };
      }
    }
  }
  
  return null;
}

// 初始化加载节点组
loadNodeGroups();

/**
 * 节点存储管理对象
 */
export const nodeStore = {
  // 只读状态导出
  state: readonly(state),
  isLoaded: readonly(isLoaded),

  /**
   * ===== 节点组操作 =====
   */
  registerNodeGroup,
  loadNodeGroups,

  /**
   * ===== 节点查询操作 =====
   */
  
  /**
   * 根据操作码获取节点信息
   * @param {string} opcode - 节点操作码
   * @returns {Object|null} - 节点对象或null
   */
  getNode(opcode) {
    const result = findNodeAndCategory(opcode);
    return result?.node || null;
  },
  
  /**
   * 根据操作码获取节点名称
   * @param {string} opcode - 节点操作码
   * @returns {string} - 节点名称，如果未找到返回默认文本
   */
  getNodeName(opcode) {
    const result = findNodeAndCategory(opcode);
    return result?.node?.name || "未搜索到节点名称";
  },
  
  /**
   * 根据操作码获取节点颜色（来自节点组）
   * @param {string} opcode - 节点操作码
   * @returns {string} - 颜色值，默认返回#8B92E5
   */
  getNodeColor(opcode) {
    const result = findNodeAndCategory(opcode);
    return result?.category?.color || "#8B92E5";
  },
  
  /**
   * 获取所有节点
   * @returns {Array} - 所有节点的平面数组
   */
  getAllNodes() {
    return state.flatMap(category => 
      category?.nodes ? category.nodes : []
    );
  },
  
  /**
   * 根据节点组名称获取节点组
   * @param {string} groupName - 节点组名称
   * @returns {Object|null} - 节点组对象或null
   */
  getNodeGroup(groupName) {
    return state.find(group => group.name === groupName) || null;
  }
};

