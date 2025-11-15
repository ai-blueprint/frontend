// 新增蓝图数据的连接线数据
import { blueprintStore } from "../../stores/blueprint.js";
export function createLink(from, to) {
    blueprintStore.addLink(from, to)
}