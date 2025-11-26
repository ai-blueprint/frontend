import { reactive, readonly } from "vue";

// 初始化空的节点组状态，用于动态加载
const state = reactive([]);

// 节点组加载状态
const isLoaded = reactive({ value: false });

// 注册节点组
const registerNodeGroup = (nodeGroup) => {
  // 检查是否已存在相同名称的节点组
  const existingIndex = state.findIndex(group => group.name === nodeGroup.name);
  if (existingIndex >= 0) {
    // 更新已存在的节点组
    state[existingIndex] = nodeGroup;
  } else {
    // 添加新的节点组
    state.push(nodeGroup);
  }
};

// 加载所有节点组JSON文件
const loadNodeGroups = () => {
  if (isLoaded.value) return;
  
  try {
    // 使用 require.context 动态导入所有节点组JSON文件
    const nodeGroupContext = require.context('../assets/node-groups', false, /\.json$/);
    
    // 遍历并注册所有节点组
    nodeGroupContext.keys().forEach(key => {
      const nodeGroup = nodeGroupContext(key);
      registerNodeGroup(nodeGroup);
    });
    
    isLoaded.value = true;
    console.log('节点组加载完成:', state.length);
  } catch (error) {
    console.error('加载节点组失败:', error);
  }
};

// 初始化加载节点组
loadNodeGroups();

export const nodeStore = {
  state: readonly(state),
  isLoaded: readonly(isLoaded),

  // ===== 节点组操作 =====
  registerNodeGroup,
  loadNodeGroups,

  // ===== 节点 =====
  getNode(opcode) {
    let node = null;
    state.forEach((category) => {
      category.nodes.forEach((n) => {
        if (n.opcode === opcode) {
          node = n;
        }
      });
    });
    return node;
  },
  getNodeName(opcode) {
    let name = "未搜索到节点名称";
    state.forEach((category) => {
      category.nodes.forEach((node) => {
        if (node.opcode === opcode) {
          name = node.name;
        }
      });
    });
    return name;
  },
  // 颜色
  getNodeColor(opcode) {
    let color = "#8B92E5";
    state.forEach((category) => {
      category.nodes.forEach((node) => {
        if (node.opcode === opcode) {
          color = category.color;
        }
      });
    });
    return color;
  },
};
