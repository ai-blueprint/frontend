import { reactive, readonly } from "vue";
import { generateId } from "@/tools/data/generate-id";

const state = reactive({
  nodes: [
    {
      id: "a",
      name: "节点1",
      opcode: "input",
      position: { x: 100, y: 100 },
      selected: false,
      endpoints: {
        out: ["a"],
      },
    },
    {
      id: "b",
      name: "节点2",
      opcode: "add",
      position: { x: 400, y: 100 },
      selected: false,
      endpoints: {
        in: ["a", "b"],
        out: ["c"],
      },
    },
  ],
  links: [
    {
      id: generateId(),
      from: "a_a",
      to: "b_a",
    },
  ],
  scale: 1,
  translate: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  tempLink: null,
});

// 内部辅助函数：查找节点
function findNode(id) {
  return state.nodes.find(node => node.id === id);
}

// 内部辅助函数：查找节点索引
function findNodeIndex(id) {
  return state.nodes.findIndex(node => node.id === id);
}

export const blueprintStore = {
  state: readonly(state),

  // ===== 节点操作 =====
  addNode(name, opcode, position, nodeInfo, id = null) {
    state.nodes.push({
      ...nodeInfo,
      id: id || generateId(),
      name,
      opcode,
      position,
      selected: false,
    });
    console.log(`新增节点 “${name}”（${opcode}） 在 ${position.x}, ${position.y}`);
  },

  updateNodePosition(id, position) {
    const node = findNode(id);
    if (node) {
      node.position = position;
    }
    console.log(`更新节点 “${node.name}”（${node.opcode}） 位置到 ${position.x}, ${position.y}`); 
  },

  toggleSelectNode(id) {
    const node = findNode(id);
    if (node) node.selected = !node.selected;
  },
  
  clearSelectNode() {
    state.nodes.forEach(node => { node.selected = false; });
  },
  
  deleteNode(id) {
    const index = findNodeIndex(id);
    if (index !== -1) state.nodes.splice(index, 1);
    
    // 同时删除与该节点相关的所有连接
    state.links = state.links.filter(
      link => !link.from.includes(id) && !link.to.includes(id)
    );
  },

  deleteSelectedNodes() {
    // 获取所有选中的节点ID并删除
    const selectedNodeIds = state.nodes
      .filter(node => node.selected)
      .map(node => node.id);

    selectedNodeIds.forEach(id => this.deleteNode(id));
  },
  
  getSelectedNodes() {
    return state.nodes.filter(node => node.selected);
  },

  // ===== 连接线操作 =====
  addLink(from, to) {
    state.links.push({ id: generateId(), from, to });
    console.log(`新增连接: ${from} -> ${to}`);
    
  },
  
  deleteLink(id) {
    const index = state.links.findIndex(link => link.id === id);
    if (index !== -1) state.links.splice(index, 1);
  },

  // ===== 临时连接线 =====
  setTempLink(from, to = null) {
    state.tempLink = from ? { from, to, isTemp: true } : null;
  },
  
  clearTempLink() {
    state.tempLink = null;
  },

  // ===== 序列化与反序列化 =====
  serialize() {
    return JSON.stringify({ nodes: state.nodes, links: state.links });
  },

  restore(snapshot) {
    const { nodes, links } = JSON.parse(snapshot);
    state.nodes = nodes;
    state.links = links;
  },

  // ===== 视图变换 =====
  updateScale(newScale) {
    state.scale = newScale;
  },
  
  updateTranslate(x, y) {
    state.translate.x = x;
    state.translate.y = y;
  },
  
  updateSize(width, height) {
    state.size.width = width;
    state.size.height = height;
  },
  
  updateTransform(scale, translateX, translateY) {
    state.scale = scale;
    state.translate.x = translateX;
    state.translate.y = translateY;
  },
};
