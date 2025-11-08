// 根据连接对象数据删除对应数据
// 删除蓝图中的连接线对象
import {blueprintStore} from '../../stores/blueprintStore.js'
export function deleteLink(ID) {
blueprintStore.deleteLink(ID)
}