import { reactive, readonly } from "vue";
import { generateId } from "@/tools/data/generate-id";
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import { nodeStore } from "@/stores/nodes";
import { arrangeBlueprint as arrangeBlueprintNodes } from "@/tools/blueprint/arrange-blueprint.js";

/**
 * Blueprint Store
 * 管理蓝图画布上的所有节点、连接和视图状态
 */

// 调试日志开关
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

/**
 * 应用状态
 * 包含节点、连接、视图变换等数据
 */
const state = reactive({
  // 节点列表
  nodes: [
    {
      id: "a",
      name: "节点1",
      opcode: "input",
      position: { x: 100, y: 100 },
      selected: false,
      layer: 0,
      ports: { out: ["a"] },
      params: [
        { label: "输入维度", type: "number", default: "1" },
        { label: "输入类型", type: "string", default: "float32" }
      ]
    },
    {
      id: "b",
      name: "节点2",
      opcode: "add",
      position: { x: 400, y: 100 },
      selected: false,
      layer: 1,
      ports: { in: ["a", "b"], out: ["c"] },
      params: [
        { label: "输入维度", type: "number", default: "2" },
        { label: "输出维度", type: "number", default: "1" }
      ]
    }
  ],
  
  // 连接线列表
  links: [
    { id: generateId(), from: "a_a", to: "b_a" }
  ],
  
  // 视图变换状态
  scale: 1,
  translate: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  
  // 临时连接线
  tempLink: null
});

/**
 * 内部辅助函数：查找节点
 * @param {string} id - 节点ID
 * @returns {Object|null} - 找到的节点或null
 */
function findNode(id) {
  return state.nodes.find(node => node.id === id);
}

/**
 * 内部辅助函数：查找节点索引
 * @param {string} id - 节点ID
 * @returns {number} - 节点在数组中的索引，未找到返回-1
 */
function findNodeIndex(id) {
  return state.nodes.findIndex(node => node.id === id);
}

/**
 * 内部辅助函数：获取当前最大层级
 * @returns {number} - 最大层级值
 */
function getMaxLayer() {
  return state.nodes.reduce((max, node) => Math.max(max, node.layer), 0);
}

/**
 * 蓝图状态管理对象
 */
export const blueprintStore = {
  // 只读状态导出
  state: readonly(state),
  
  /**
   * 获取节点列表（便捷访问属性）
   */
  get nodes() {
    return state.nodes;
  },

  /**
   * ===== 节点操作 =====
   */
  
  /**
   * 添加新节点
   * @param {string} name - 节点名称
   * @param {string} opcode - 节点操作码
   * @param {Object} position - 节点位置 {x, y}
   * @param {Object|null} nodeProps - 可选的节点属性对象
   * @param {string|null} id - 可选的节点ID，不提供则自动生成
   */
  addNode(name, opcode, position, nodeProps = null, id = null) {
    // 获取节点信息，优先使用传入的属性，其次从节点库获取
    const nodeInfo = nodeProps 
      ? { ...nodeProps, id: undefined } 
      : nodeStore.getNode(opcode);
    
    // 设置新节点层级为当前最大层级+1
    const maxLayer = getMaxLayer();
    
    // 创建并添加节点
    const newNode = {
      ...nodeInfo,
      id: id || generateId(),
      name,
      opcode,
      position,
      selected: false,
      layer: maxLayer + 1
    };
    
    state.nodes.push(newNode);
    debugLog(`新增节点 “${name}”（${opcode}）在 ${Math.floor(position.x)}, ${Math.floor(position.y)}`);
  },
  
  /**
   * 克隆节点
   * @param {string} id - 要克隆的节点ID
   */
  cloneNode(id) {
    const node = findNode(id);
    if (!node) {
      debugLog(`未找到要克隆的节点: ${id}`);
      return;
    }
    
    // 创建新节点，复制原节点的所有属性并生成新ID
    const newNode = { ...node, id: generateId() };
    this.addNode(newNode.name, newNode.opcode, newNode.position, newNode);
  },
  
  /**
   * 更新节点位置
   * @param {string} id - 节点ID
   * @param {Object} position - 新位置 {x, y}
   */
  updateNodePosition(id, position) {
    const node = findNode(id);
    if (!node) {
      debugLog(`未找到要更新位置的节点: ${id}`);
      return;
    }
    
    node.position = position;
    this.nodeToFront(id); // 更新位置后将节点置顶
    debugLog(`更新节点 “${node.name}”（${node.opcode}）位置到 ${Math.floor(position.x)}, ${Math.floor(position.y)}`);
  },

  /**
   * 切换节点选中状态
   * @param {string} id - 节点ID
   */
  toggleSelectNode(id) {
    const node = findNode(id);
    if (!node) {
      debugLog(`未找到要切换选中状态的节点: ${id}`);
      return;
    }
    
    node.selected = !node.selected;
    this.nodeToFront(id); // 选中节点时将其置顶
    debugLog(`切换节点 “${node.name}”（${node.opcode}）选中状态为: ${node.selected}`);
  },

  /**
   * 清除所有节点选中状态
   */
  clearSelectNode() {
    state.nodes.forEach(node => {
      node.selected = false;
    });
    debugLog(`清除所有节点选中状态`);
  },

  /**
   * 删除节点及其相关连接
   * @param {string} id - 要删除的节点ID
   */
  deleteNode(id) {
    const index = findNodeIndex(id);
    if (index === -1) {
      debugLog(`未找到要删除的节点: ${id}`);
      return;
    }
    
    // 移除节点
    state.nodes.splice(index, 1);
    
    // 查找并删除与该节点相关的所有连接
    const linksToDelete = state.links.filter(link => 
      [link.from, link.to].some(port => port.split("_")[0] === id)
    );
    
    linksToDelete.forEach(link => this.deleteLink(link.id));
    
    // 删除节点后重新计算蓝图大小
    changeBlueprintSize();
    debugLog(`成功删除节点“${id}”及其所有连接`);
  },

  /**
   * 删除所有选中的节点
   */
  deleteSelectedNodes() {
    // 获取所有选中的节点ID
    const selectedNodeIds = state.nodes
      .filter(node => node.selected)
      .map(node => node.id);

    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach(id => this.deleteNode(id));
      debugLog(`删除选中节点: ${selectedNodeIds.join(", ")}`);
    }
  },

  /**
   * 获取所有选中的节点
   * @returns {Array} - 选中节点数组
   */
  getSelectedNodes() {
    return state.nodes.filter(node => node.selected);
  },
  
  /**
   * 将节点置顶（视觉层级）
   * @param {string} id - 要置顶的节点ID
   */
  nodeToFront(id) {
    const node = findNode(id);
    if (!node) return;
    
    // 计算最大层级并设置当前节点为最大层级+1
    const maxLayer = getMaxLayer();
    const oldLayer = node.layer;
    node.layer = maxLayer + 1;
    
    // 规范化层级，保持连续性
    state.nodes.forEach(n => {
      if (n.layer > oldLayer && n.id !== id) {
        n.layer--;
      }
    });
  },

  /**
   * ===== 连接线操作 =====
   */
  
  /**
   * 添加新连接
   * @param {string} from - 源端口ID
   * @param {string} to - 目标端口ID
   */
  addLink(from, to) {
    const newLink = { id: generateId(), from, to };
    state.links.push(newLink);
    debugLog(`新增连接: ${from} -> ${to}`);
  },

  /**
   * 删除连接
   * @param {string} id - 连接ID
   */
  deleteLink(id) {
    const index = state.links.findIndex(link => link.id === id);
    if (index === -1) {
      debugLog(`未找到要删除的连接: ${id}`);
      return;
    }
    
    state.links.splice(index, 1);
    debugLog(`删除连接: ${id}`);
  },

  /**
   * ===== 临时连接线 =====
   */
  
  /**
   * 设置临时连接线
   * @param {string|null} from - 源端口ID，为null时清除临时连接
   * @param {string|null} to - 目标端口ID，可选
   */
  setTempLink(from, to = null) {
    state.tempLink = from ? { from, to, isTemp: true } : null;
  },

  /**
   * 清除临时连接线
   */
  clearTempLink() {
    state.tempLink = null;
  },

  /**
   * ===== 序列化与反序列化 =====
   */
  
  /**
   * 序列化蓝图数据
   * @returns {string} - JSON字符串
   */
  serialize() {
    return JSON.stringify({ nodes: state.nodes, links: state.links });
  },

  /**
   * 从序列化数据恢复蓝图
   * @param {string} snapshot - JSON字符串
   */
  restore(snapshot) {
    try {
      const { nodes, links } = JSON.parse(snapshot);
      state.nodes = nodes;
      state.links = links;
      debugLog(`蓝图数据已恢复，包含 ${nodes.length} 个节点和 ${links.length} 个连接`);
    } catch (error) {
      console.error('恢复蓝图数据失败:', error);
    }
  },

  /**
   * ===== 视图变换 =====
   */
  
  /**
   * 更新缩放比例
   * @param {number} newScale - 新的缩放比例
   */
  updateScale(newScale) {
    state.scale = newScale;
  },

  /**
   * 更新平移位置
   * @param {number} x - X轴平移
   * @param {number} y - Y轴平移
   */
  updateTranslate(x, y) {
    state.translate.x = x;
    state.translate.y = y;
  },

  /**
   * 更新画布大小
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  updateSize(width, height) {
    state.size.width = width;
    state.size.height = height;
  },

  /**
   * 同时更新缩放和平移
   * @param {number} scale - 缩放比例
   * @param {number} translateX - X轴平移
   * @param {number} translateY - Y轴平移
   */
  updateTransform(scale, translateX, translateY) {
    state.scale = scale;
    state.translate.x = translateX;
    state.translate.y = translateY;
  },

  /**
   * 自动排列蓝图中的节点
   */
  arrangeBlueprint() {
    arrangeBlueprintNodes(state);
  }
};
