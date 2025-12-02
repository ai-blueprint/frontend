import { reactive, readonly } from "vue";

const state = reactive({
  // 重命名弹窗可见性
  renameDialogVisible: false,
  //节点右键菜单可见性
  nodeContextMenuVisible: false,
  //节点右键菜单位置
  nodeContextMenuPosition: { x: 0, y: 0 },
  // 当前激活的分类索引
  activeCategoryIndex: 0,
});

export const editorStore = {
  state: readonly(state),
  // 打开重命名弹窗
  openRenameDialog() {
    state.renameDialogVisible = true;
  },
  // 关闭重命名弹窗
  closeRenameDialog() {
    state.renameDialogVisible = false;
  },
  // 显示节点右键菜单
  showNodeContextMenu(nodeRect) {
    // 获取菜单元素尺寸
    const menuElement = document.getElementById("context-menu");
    if (!menuElement) return;
    
    menuElement.style.display = "flex";
    const menuRect = menuElement.getBoundingClientRect();
    menuElement.style.display = "none";

    // 获取窗口尺寸
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const nodeCenterY = nodeRect.top + nodeRect.height / 2;
    const nodeCenterX = nodeRect.left + nodeRect.width / 2;

    // 计算菜单X坐标，使菜单中心对齐节点中心
    let menuX = nodeCenterX - menuRect.width / 2;

    // 节点在窗口中下部分，菜单显示在节点上方，反之
    let menuY;
    if (nodeCenterY > windowHeight / 2)
      menuY = nodeRect.top - menuRect.height - 10; // 10px间距
    else menuY = nodeRect.bottom + 10; // 10px间距

    // 确保菜单在窗口内
    menuX = Math.max(0, Math.min(menuX, windowWidth - menuRect.width));
    menuY = Math.max(0, Math.min(menuY, windowHeight - menuRect.height));

    // 设置菜单位置并显示
    state.nodeContextMenuPosition = { x: menuX, y: menuY };
    state.nodeContextMenuVisible = true;
  },
  // 隐藏节点右键菜单
  hideNodeContextMenu() {
    state.nodeContextMenuVisible = false;
  },
  // 设置激活的分类索引
  setActiveCategoryIndex(index) {
    state.activeCategoryIndex = index;
  },
  // 获取激活的分类索引
  getActiveCategoryIndex() {
    return state.activeCategoryIndex;
  },
};
