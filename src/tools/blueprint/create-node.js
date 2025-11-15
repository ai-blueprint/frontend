import { blueprintStore } from "@/stores/blueprint";
import { nodeStore } from "@/stores/nodes";
// 添加节点到蓝图数据
// 在蓝图对应位置创建节点
export function createNode(
  name,
  opcode,
  position,
  nodeProps = null,
  id = null
) {
  // 如果提供了节点属性，则使用它，否则从nodeStore获取
  // 注意：不使用传入的id，确保始终生成新id
  const nodeInfo = nodeProps
    ? { ...nodeProps, id: undefined } // 清除id，让addNode生成新id
    : nodeStore.getNode(opcode);
  blueprintStore.addNode(name, opcode, position, nodeInfo,id);
}
