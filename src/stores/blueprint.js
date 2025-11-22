import { reactive, readonly } from "vue";
import { generateId } from "@/tools/data/generate-id";
import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import { nodeStore } from "@/stores/nodes";
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
  return state.nodes.find((node) => node.id === id);
}

// 内部辅助函数：查找节点索引
function findNodeIndex(id) {
  return state.nodes.findIndex((node) => node.id === id);
}

export const blueprintStore = {
  state: readonly(state),

  // ===== 节点操作 =====
  addNode(name, opcode, position, nodeProps = null, id = null) {
    const nodeInfo = nodeProps
      ? { ...nodeProps, id: undefined }
      : nodeStore.getNode(opcode);
    state.nodes.push({
      ...nodeInfo,
      id: id || generateId(),
      name,
      opcode,
      position,
      selected: false,
    });
    console.log(
      `新增节点 “${name}”（${opcode}）\n在 ${Math.floor(
        position.x
      )}, ${Math.floor(position.y)}`
    );
  },
  cloneNode(id) {
    const node = blueprintStore.nodes.find((node) => node.id === id);
    const newNode = { ...node, id: generateId() };
    this.addNode(newNode.name, newNode.opcode, newNode.position, newNode);
  },
  updateNodePosition(id, position) {
    const node = findNode(id);
    if (node) {
      node.position = position;
    }
    console.log(
      `更新节点 “${node.name}”（${node.opcode}） 位置\n到 ${Math.floor(
        position.x
      )}, ${Math.floor(position.y)}`
    );
  },

  toggleSelectNode(id) {
    const node = findNode(id);
    if (node) node.selected = !node.selected;
    console.log(`切换节点 “${node.name}”（${node.opcode}） 选中状态`);
  },

  clearSelectNode() {
    state.nodes.forEach((node) => {
      node.selected = false;
    });
    console.log(`清除所有节点选中状态`);
  },

  deleteNode(id) {
    const index = findNodeIndex(id);
    if (index !== -1) state.nodes.splice(index, 1);
    const linksToDelete = blueprintStore.state.links.filter((link) =>
      [link.from, link.to].some((endpoint) => endpoint.split("_")[0] === id)
    );
    linksToDelete.forEach((link) => this.deleteLink(link.id));

    // 删除节点后重新计算蓝图大小并调整节点位置
    changeBlueprintSize();
    console.log(`成功删除节点“${id}”及其所有连接`);
  },

  deleteSelectedNodes() {
    // 获取所有选中的节点ID并删除
    const selectedNodeIds = state.nodes
      .filter((node) => node.selected)
      .map((node) => node.id);

    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach((id) => this.deleteNode(id));
    }
    console.log(`删除选中节点 ${selectedNodeIds.join(", ")} 及其所有连接`);
  },

  getSelectedNodes() {
    return state.nodes.filter((node) => node.selected);
  },

  // ===== 连接线操作 =====
  addLink(from, to) {
    state.links.push({ id: generateId(), from, to });
    console.log(`新增连接: ${from} -> ${to}`);
  },

  deleteLink(id) {
    const index = state.links.findIndex((link) => link.id === id);
    if (index !== -1) state.links.splice(index, 1);
    console.log(`删除连接: ${id}`);
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
