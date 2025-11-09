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
  ], // { id, opcode, position, selected }
  links: [
    {
      id: generateId(),
      from: "a_a",
      to: "b_a",
    },
  ], // { fromId, toId}
  scale: 1, // 蓝图缩放比例
  translate: { x: 0, y: 0 }, // 蓝图偏移量
  size: { width: 0, height: 0 }, // 蓝图长宽
  tempLink: null, // 临时连接线 { from, to, isTemp: true }
});

export const blueprintStore = {
  state: readonly(state),

  // ===== 节点 =====
  addNode(name, opcode, position, nodeInfo, id = null) {
    state.nodes.push({
      ...nodeInfo,
      id: id || generateId(),
      name: name,
      opcode: opcode,
      position: position,
      selected: false,
    });
  },

  setNodePos(id, position) {
    const n = state.nodes.find((v) => v.id === id);
    if (n) {
      n.position = position;
    }
  },

  toggleSelectNode(id) {
    const n = state.nodes.find((v) => v.id === id);
    if (n) n.selected = !n.selected;
  },
  clearSelectNode() {
    state.nodes.forEach((v) => (v.selected = false));
  },
  // 删除节点
  deleteNode(id) {
    const idx = state.nodes.findIndex((v) => v.id === id);
    if (idx !== -1) state.nodes.splice(idx, 1);
    // 同时删除与该节点相关的所有连接
    state.links = state.links.filter(
      (link) => !link.from.includes(id) && !link.to.includes(id)
    );
  },

  // 删除所有选中的节点
  deleteSelectedNodes() {
    // 获取所有选中的节点ID
    const selectedNodeIds = state.nodes
      .filter((node) => node.selected)
      .map((node) => node.id);

    // 删除每个选中的节点及其相关连接
    selectedNodeIds.forEach((id) => {
      this.deleteNode(id);
    });
  },
  // 获取所有选中的节点
  getSelectedNodes() {
    return state.nodes.filter((node) => node.selected);
  },
  // 移动节点位置
  moveNode(id, position) {
    const node = state.nodes.find((v) => v.id === id);
    if (node) {
      node.position = position;
    }
  },

  // ===== 连接线 =====
  addLink(from, to) {
    state.links.push({ id: generateId(), from: from, to: to });
  },
  // 删除连接线数据
  deleteLink(id) {
    const idx = state.links.findIndex((v) => v.id === id);
    if (idx !== -1) state.links.splice(idx, 1);
  },

  // 设置临时连接线
  setTempLink(from, to = null) {
    state.tempLink = from ? { from, to, isTemp: true } : null;
  },

  // 清除临时连接线
  clearTempLink() {
    state.tempLink = null;
  },

  // ===== 序列化（给历史记录用）=====
  serialize() {
    return JSON.stringify({ nodes: state.nodes, links: state.links });
  },

  restore(snapshot) {
    const { nodes, links } = JSON.parse(snapshot);
    state.nodes = nodes;
    state.links = links;
  },

  // ===== 缩放 =====
  updateScale(newScale) {
    state.scale = newScale;
  },

  // ===== 偏移 =====
  updateTranslate(x, y) {
    state.translate.x = x;
    state.translate.y = y;
  },
  // ===== 长宽 =====
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
