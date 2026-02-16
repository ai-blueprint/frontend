<script setup>
import store from '@/store.js'                     // 引入全局状态
import NodeCmd from '@/commands/Node.js'            // 引入节点命令
import Clipboard from '@/commands/Clipboard.js'     // 引入剪贴板命令

import copyPasteIcon from '@/assets/ContextMenu/copy-paste.svg' // 复制粘贴图标
import renameIcon from '@/assets/ContextMenu/rename.svg'        // 重命名图标
import deleteIcon from '@/assets/ContextMenu/delete.svg'        // 删除图标

// --- 复制并粘贴 ---
const onCopyPaste = () => {
    Clipboard.copyAndPaste()                          // 执行复制并粘贴
    store.nodeMenu.visible = false                    // 关闭菜单
}

// --- 重命名 ---
const onRename = () => {
    const nodeId = store.nodeMenu.nodeId              // 获取菜单绑定的节点ID
    if (!nodeId) return                               // 无节点ID直接返回

    const node = NodeCmd.getById(nodeId)              // 获取节点对象
    if (!node) return                                 // 节点不存在直接返回

    store.renaming.nodeId = nodeId                    // 设置重命名目标
    store.renaming.original = node.data.label         // 记录原始名称
    store.nodeMenu.visible = false                    // 关闭菜单
}

// --- 删除节点 ---
const onDelete = () => {
    const nodeId = store.nodeMenu.nodeId              // 获取菜单绑定的节点ID
    if (!nodeId) return                               // 无节点ID直接返回

    NodeCmd.remove(nodeId)                            // 删除节点
    store.nodeMenu.visible = false                    // 关闭菜单
    store.nodePanel.visible = false                   // 关闭面板
}
</script>

<template>
    <div v-if="store.nodeMenu.visible" class="node-menu" :style="{
        left: store.nodeMenu.x + 'px',
        top: store.nodeMenu.y + 'px',
    }"> <!-- 节点右键菜单 -->
        <div class="menu-item" @click="onCopyPaste"> <!-- 复制并粘贴选项 -->
            <img :src="copyPasteIcon" alt="copy" class="menu-icon" /> <!-- 图标 -->
            <span class="menu-text">复制并粘贴</span> <!-- 文字 -->
        </div>
        <div class="menu-item" @click="onRename"> <!-- 重命名选项 -->
            <img :src="renameIcon" alt="rename" class="menu-icon" /> <!-- 图标 -->
            <span class="menu-text">重命名</span> <!-- 文字 -->
        </div>
        <div class="menu-item danger" @click="onDelete"> <!-- 删除选项 -->
            <img :src="deleteIcon" alt="delete" class="menu-icon" /> <!-- 图标 -->
            <span class="menu-text">删除节点</span> <!-- 文字 -->
        </div>
    </div>
</template>

<style scoped>
.node-menu {
    position: fixed;
    /* 固定定位 */
    transform: translate(-50%, -100%);
    /* 居中并向上偏移，显示在节点正上方 */
    background: #ffffff;
    /* 白色背景 */
    border: 1px solid #e0e0e0;
    /* 浅色边框 */
    border-radius: 8px;
    /* 圆角 */
    padding: 4px;
    /* 内边距 */
    z-index: 1000;
    /* 高层级 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    /* 阴影 */
    min-width: 140px;
    /* 最小宽度 */
}

.menu-item {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 8px;
    /* 图标和文字间距 */
    padding: 6px 10px;
    /* 内边距 */
    border-radius: 4px;
    /* 圆角 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: background 0.15s;
    /* 过渡动画 */
}

.menu-item:hover {
    background: #f0f0f0;
    /* 悬停浅灰背景 */
}

.menu-item.danger:hover {
    background: rgba(231, 76, 60, 0.08);
    /* 删除选项悬停背景 */
}

.menu-icon {
    width: 16px;
    /* 图标宽度 */
    height: 16px;
    /* 图标高度 */
    opacity: 0.6;
    /* 默认透明度 */
}

.menu-text {
    font-size: 13px;
    /* 文字字号 */
    color: #333333;
    /* 深色文字 */
    white-space: nowrap;
    /* 不换行 */
}

.danger .menu-text {
    color: #e74c3c;
    /* 删除选项红色文字 */
}
</style>
