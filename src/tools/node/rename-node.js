import { historyStore } from "@/stores/history";

/**
 * 重命名节点工具函数
 * @param {string} id - 要重命名的节点ID
 * @param {string} newName - 新的节点名称
 * @param {Object} state - 蓝图状态对象
 */
export function renameNode(id, newName, state) {
  // 查找目标节点
  const node = state.nodes.find(node => node.id === id);
  if (!node) {
    console.debug(`未找到要重命名的节点: ${id}`);
    return;
  }
  
  // 更新节点名称
  const oldName = node.name;
  node.name = newName.trim();
  
  // 记录操作到历史记录
  historyStore.recordState();
  
  console.debug(`重命名节点 “${oldName}” 为 “${newName.trim()}”`);
}
