import { generateId } from "@/tools/data/generate-id";
import { historyStore } from "@/stores/history";

/**
 * 克隆节点工具函数
 * @param {string} id - 要克隆的节点ID
 * @param {Object} state - 蓝图状态对象
 */
export function cloneNode(id, state) {
  // 查找目标节点
  const node = state.nodes.find(node => node.id === id);
  if (!node) {
    console.debug(`未找到要克隆的节点: ${id}`);
    return;
  }
  
  // 创建新节点，复制原节点的所有属性并生成新ID
  const newNode = { ...node, id: generateId() };
  
  // 设置新节点层级为当前最大层级+1
  const maxLayer = state.nodes.reduce((max, n) => Math.max(max, n.layer), 0);
  newNode.layer = maxLayer + 1;
  
  // 添加新节点到状态中
  state.nodes.push(newNode);
  
  // 记录操作到历史记录
  historyStore.recordState();
  
  console.debug(`克隆节点 “${node.name}”（${node.opcode}）`);
}
