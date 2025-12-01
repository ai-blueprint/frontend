import { changeBlueprintSize } from "@/tools/blueprint/change-blueprint-size.js";
import { historyStore } from "@/stores/history";

/**
 * 删除节点工具函数
 * @param {string} id - 要删除的节点ID
 * @param {Object} state - 蓝图状态对象
 */
export function deleteNode(id, state) {
  // 查找节点索引
  const index = state.nodes.findIndex(node => node.id === id);
  if (index === -1) {
    console.debug(`未找到要删除的节点: ${id}`);
    return;
  }
  
  // 移除节点
  state.nodes.splice(index, 1);
  
  // 查找并删除与该节点相关的所有连接
  const linksToDelete = state.links.filter(link => 
    [link.from, link.to].some(port => port.split("_")[0] === id)
  );
  
  linksToDelete.forEach(link => {
    const linkIndex = state.links.findIndex(l => l.id === link.id);
    if (linkIndex !== -1) {
      state.links.splice(linkIndex, 1);
    }
  });
  
  // 删除节点后重新计算蓝图大小
  changeBlueprintSize();
  
  // 记录操作到历史记录
  historyStore.recordState();
  
  console.debug(`成功删除节点“${id}”及其所有连接`);
}
