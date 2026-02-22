<script setup>
import store from '@/store.js'                     // 引入全局状态
import Node from '@/commands/Node.js'            // 引入节点命令
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

    const node = Node.getById(nodeId)              // 获取节点对象
    if (!node) return                                 // 节点不存在直接返回

    store.renaming.nodeId = nodeId                    // 设置重命名目标
    store.renaming.original = node.data.label         // 记录原始名称
    store.nodeMenu.visible = false                    // 关闭菜单
}

// --- 删除节点 ---
const onDelete = () => {
    const nodeId = store.nodeMenu.nodeId              // 获取菜单绑定的节点ID
    if (!nodeId) return                               // 无节点ID直接返回

    Node.remove(nodeId)                            // 删除节点
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
    /* 居中并向上偏移 */
    z-index: 1000;
    /* 高层级 */
    border-radius: 14px;
    /* 大圆角 */
    display: flex;
    /* 横向排列菜单项 */
    flex-direction: row;
    /* 水平布局 */
    padding: 12px;
    /* 内边距 */
    gap: 12px;
    /* 菜单项间距 */
    background: #F6F9FE;
    /* 浅蓝灰背景 */
    box-shadow: 0px 2px 20px rgba(111, 125, 176, 0.1);
    /* 柔和阴影 */
    font-size: 12px;
    /* 文字字号 */
    font-weight: 600;
    /* 加粗文字 */
    letter-spacing: 0.5px;
    /* 字间距 */
    white-space: nowrap;
    /* 不换行 */
    color: rgb(111, 125, 176);
    /* 蓝灰色文字 */
}

.menu-item {
    display: flex;
    /* 纵向排列图标和文字 */
    flex-direction: column;
    /* 垂直布局 */
    align-items: center;
    /* 水平居中 */
    flex-wrap: nowrap;
    /* 不换行 */
    gap: 5px;
    /* 图标与文字间距 */
    cursor: pointer;
    /* 鼠标指针 */
}

.icon-container {
    border-radius: 10px;
    /* 图标容器圆角 */
    background: #EAEFFC;
    /* 图标容器背景 */
    display: flex;
    /* 居中图标 */
    transition: all 0.1s ease-in-out;
    /* 过渡动画 */
}

.icon-container:hover {
    filter: brightness(1.05);
    /* 悬停提亮 */
}

.icon-container:active {
    filter: brightness(0.98);
    /* 点击变暗 */
}

.menu-icon {
    width: 60px;
    /* 图标宽度 */
    height: 40px;
    /* 图标高度 */
    margin: 5px;
    /* 图标内边距 */
    scale: 1.4;
    /* 图标放大 */
}

.menu-text {
    font-size: 12px;
    /* 文字字号 */
    color: rgb(111, 125, 176);
    /* 蓝灰色文字 */
    white-space: nowrap;
    /* 不换行 */
}

.danger .menu-text {
    color: #e74c3c;
    /* 删除选项红色文字 */
}
</style>
