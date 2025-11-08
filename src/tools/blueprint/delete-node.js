// 从蓝图数据里删除节点数据
// 从蓝图中删除节点对象
// 删除关联连接线
import {blueprintStore} from '../../stores/blueprintStore.js'
export function deleteNode(ID) {
    blueprintStore.deleteNode(ID)
    // 搜索连接线ID中包含该节点的，删除
    const linksToDelete = blueprintStore.state.links.filter(v => v.fromId === ID || v.toId === ID)
    linksToDelete.forEach(v => blueprintStore.deleteLink(v.id))
    console.log("删除节点：" + ID);
    
}