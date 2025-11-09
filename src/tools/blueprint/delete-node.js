import { blueprintStore } from "@/stores/blueprintStore.js";
export function deleteNode(ID) {
  // 获取需要删除的关联连接线
  const linksToDelete = blueprintStore.state.links.filter((link) =>
    [link.from, link.to].some((endpoint) => endpoint.split("_")[0] === ID)
  );

  // 执行删除操作
  blueprintStore.deleteNode(ID);
  linksToDelete.forEach((link) => blueprintStore.deleteLink(link.id));

  // 日志记录
  console.log("删除节点：", ID);
  linksToDelete.length &&
    console.log(`同时删除附带连接线${linksToDelete.length}条`);
}
