import { reactive, readonly } from "vue";
import { generateId } from "@/tools/data/generate-id";
import { nodeStore } from "@/stores/nodes";
import { historyStore } from "@/stores/history";
import { arrangeBlueprint as arrangeBlueprintNodes } from "@/tools/blueprint/arrange-blueprint.js";

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
        { label: "输入类型", type: "string", default: "float32" },
      ],
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
        { label: "输出维度", type: "number", default: "1" },
      ],
    },
  ],

  // 连接线列表
  links: [{ id: generateId(), from: "a_a", to: "b_a" }],

  // 视图变换状态
  scale: 1,
  translate: { x: 0, y: 0 },
  size: { width: 0, height: 0 },

  // 临时连接线
  tempLink: null,
});

function findNode(id) {
  return state.nodes.find((node) => node.id === id);
}

export const blueprintStore = {
  state: readonly(state),

  // ===== 节点操作 =====
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

    // 创建并添加节点
    const newNode = {
      ...nodeInfo,
      id: id || generateId(),
      name,
      opcode,
      position,
      selected: false,
    };

    state.nodes.push(newNode);
    historyStore.recordState();
    console.log(
      `新增节点 “${name}”（${opcode}）\n
      在 ${Math.floor(position.x)}, ${Math.floor(position.y)}`
    );
  },

  /**
   * 克隆节点
   * @param {string} id - 要克隆的节点ID
   */
  cloneNode(id) {
    // 查找目标节点
    const node = findNode(id);
    if (!node) return;
    // 在原来的节点的右下角创建新节点
    const newPosition = {
      x: node.position.x + 20,
      y: node.position.y + 100,
    };
    // 创建新节点，复制原节点的所有属性并生成新ID
    const newNode = { ...node, id: generateId(), position: newPosition };
    state.nodes.push(newNode); // 添加新节点到状态中
    this.nodeToFront(newNode.id); // 置顶新节点
    historyStore.recordState(); // 记录操作到历史记录
    console.log(`克隆节点 “${node.name}”（${node.opcode}）`);
  },
  // 克隆所有选中节点
  cloneSelectedNodes() {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length === 0) return;
    selectedNodes.forEach((node) => {
      this.cloneNode(node.id);
    });
  },

  /**
   * 更新节点位置
   * @param {string} id - 节点ID
   * @param {Object} position - 新位置 {x, y}
   */
  updateNodePosition(id, position) {
    const node = findNode(id);
    if (!node) return;

    node.position = position; // 更新位置
    this.nodeToFront(id); // 更新位置后将节点置顶
    console.log(
      `更新节点 “${node.name}”（${node.opcode}）位置\n
      到 ${Math.floor(position.x)}, ${Math.floor(position.y)}`
    );
    historyStore.recordState();
  },

  /**
   * 切换节点选中状态
   * @param {string} id - 节点ID
   */
  toggleSelectNode(id) {
    const node = findNode(id);
    if (!node) return;
    node.selected = !node.selected;
    this.nodeToFront(id); // 选中节点时将其置顶
    console.log(
      `切换节点 “${node.name}”（${node.opcode}）选中状态为: ${node.selected}`
    );
  },

  // 清除所有节点选中状态
  clearSelectNode() {
    state.nodes.forEach((node) => {
      node.selected = false;
    });
    console.log(`清除所有节点选中状态`);
  },

  /**
   * 删除节点及其相关连接
   * @param {string} id - 要删除的节点ID
   */
  deleteNode(id) {
    // 查找节点索引
    const index = state.nodes.findIndex((node) => node.id === id);
    if (index === -1) return;
    // 移除节点
    state.nodes.splice(index, 1);
    // 删除与该节点相关的所有连接
    this.deleteNodeLinks(id);
    // 记录操作到历史记录
    historyStore.recordState();

    console.log(`成功删除节点“${id}”及其所有连接`);
  },

  // 删除所有选中的节点
  deleteSelectedNodes() {
    const selectedNodeIds = this.getSelectedNodes().map((node) => node.id); // 获取所有选中的节点ID
    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach((id) => {
        this.deleteNode(id); //删除所有选中的节点
        this.deleteNodeLinks(id); // 删除相关连接
      });
      console.log(`成功删除所有选中的节点及其相关连接`);
    }
  },

  /**
   * 获取所有选中的节点
   * @returns {Array} - 选中节点数组
   */
  getSelectedNodes() {
    return state.nodes.filter((node) => node.selected);
  },

  /**
   * 重命名节点
   * @param {string} id - 要重命名的节点ID
   * @param {string} newName - 新的节点名称
   */
  renameNode(id, newName) {
    // 查找目标节点
    const node = findNode(id);
    if (!node) return;
    // 更新节点名称
    const oldName = node.name;
    node.name = newName.trim();
    // 记录操作到历史记录
    historyStore.recordState();
    console.log(`重命名节点 “${oldName}” 为 “${newName.trim()}”`);
  },

  // 批量重命名节点，传入新名称，自动遍历所有选中节点
  renameSelectedNodes(newName) {
    const selectedNodes = this.getSelectedNodes();
    selectedNodes.forEach((node) => {
      this.renameNode(node.id, newName);
    });
  },

  /**
   * 将节点置顶（视觉层级）
   * @param {string} id - 要置顶的节点ID
   */
  nodeToFront(id) {
    const node = findNode(id);
    if (!node) return;
    // 调整id所在的对象在数组中的位置，使其排在最后面
    const index = state.nodes.findIndex((node) => node.id === id);
    if (index !== -1) {
      const node = state.nodes.splice(index, 1)[0];
      state.nodes.push(node);
    }
  },

  // ===== 连接线操作 =====

  /**
   * 添加新连接
   * @param {string} from - 源端口ID
   * @param {string} to - 目标端口ID
   */
  addLink(from, to) {
    const newLink = { id: generateId(), from, to };
    state.links.push(newLink);
    console.log(`新增连接: ${from} -> ${to}`);
    historyStore.recordState();
  },

  /**
   * 删除连接
   * @param {string} id - 连接ID
   */
  deleteLink(id) {
    const index = state.links.findIndex((link) => link.id === id);
    if (index === -1) return;
    state.links.splice(index, 1);
    console.log(`删除连接: ${id}`);
    historyStore.recordState();
  },
  // 删除节点关联的所有连接
  deleteNodeLinks(nodeId) {
    state.links = state.links.filter(
      (link) =>
        ![link.from, link.to].some((port) => port.split("_")[0] === nodeId)
    );
    console.log(`删除节点 ${nodeId} 关联的所有连接`);
  },

  // ===== 临时连接线 =====

  /**
   * 设置临时连接线
   * @param {string|null} from - 源端口ID，为null时清除临时连接
   * @param {string|null} to - 目标端口ID，可选
   */
  setTempLink(from, to = null) {
    state.tempLink = from ? { from, to, isTemp: true } : null;
  },

  // 清除临时连接线
  clearTempLink() {
    state.tempLink = null;
  },

  // ===== 序列化与反序列化 =====

  // 序列化蓝图数据
  serialize() {
    return JSON.stringify({ nodes: state.nodes, links: state.links });
  },

  // 从序列化数据恢复蓝图
  restore(snapshot) {
    try {
      const { nodes, links } = JSON.parse(snapshot);
      state.nodes = nodes;
      state.links = links;
      console.log(
        `蓝图数据已恢复，包含 ${nodes.length} 个节点和 ${links.length} 个连接`
      );
    } catch (error) {
      console.error("恢复蓝图数据失败:", error);
    }
  },

  // ===== 视图变换 =====

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
  // 鼠标滚轮缩放蓝图
  zoomBlueprint(deltaY, mousePos) {
    // 计算缩放参数
    const currentScale = state.scale;
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    // 限制缩放范围在0.1到5之间
    const newScale = Math.max(0.1, Math.min(5, currentScale * zoomFactor));

    // 计算缩放后的位置偏移（围绕鼠标位置缩放）
    const currentTranslate = state.translate;
    const newTranslateX =
      currentTranslate.x + mousePos.x * (currentScale - newScale);
    const newTranslateY =
      currentTranslate.y + mousePos.y * (currentScale - newScale);

    // 更新蓝图变换
    this.updateTransform(newScale, newTranslateX, newTranslateY);
  },

  // 自动排列蓝图中的节点
  arrangeBlueprint() {
    arrangeBlueprintNodes(state);
  },
};
