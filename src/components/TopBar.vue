<script setup>
import { ref } from 'vue'                         // 引入Vue响应式引用
import store from '@/store.js'                     // 引入全局状态
import BlueprintCmd from '@/commands/Blueprint.js'  // 引入蓝图命令
import ws from '@/ws.js'                            // 引入WebSocket模块

import textLogo from '@/assets/TopBar/text-logo.svg' // LOGO图标
import settingIcon from '@/assets/TopBar/setting.svg' // 设置图标
import pluginIcon from '@/assets/TopBar/plugin.svg'   // 插件图标

const showSettingMenu = ref(false)                  // 设置下拉菜单是否显示
const fileInput = ref(null)                         // 文件输入框引用

// --- 蓝图名称变化时更新store ---
const onNameChange = (event) => {
    BlueprintCmd.setName(event.target.value)          // 更新蓝图名称
}

// --- 切换设置下拉菜单 ---
const toggleSettingMenu = () => {
    showSettingMenu.value = !showSettingMenu.value     // 切换显示状态
}

// --- 关闭设置菜单（点击其他地方时）---
const closeSettingMenu = () => {
    showSettingMenu.value = false                     // 关闭下拉菜单
}

// --- 导入蓝图 ---
const onImport = () => {
    showSettingMenu.value = false                     // 关闭菜单
    fileInput.value.click()                           // 触发文件选择
}

// --- 处理文件选择 ---
const onFileSelected = (event) => {
    const file = event.target.files[0]                // 获取选中的文件
    if (!file) return                                 // 没有文件直接返回

    const reader = new FileReader()                   // 创建文件读取器
    reader.onload = (e) => {
        BlueprintCmd.importBlueprint(e.target.result)   // 读取完成后导入蓝图
    }
    reader.readAsText(file)                           // 以文本格式读取文件
    event.target.value = ''                           // 清空文件选择（允许重复选同一文件）
}

// --- 导出蓝图 ---
const onExport = () => {
    showSettingMenu.value = false                     // 关闭菜单
    BlueprintCmd.exportBlueprint()                    // 执行导出
}

// --- 运行蓝图 ---
const onRun = () => {
    ws.sendRun()                                      // 发送蓝图到后端运行
}

// --- 跑分 ---
const onScore = () => {
    ws.sendScore()                                    // 发送蓝图到后端跑分
}
</script>

<template>
    <div class="topbar"> <!-- 顶部栏容器 -->

        <!-- 左侧区域 -->
        <div class="topbar-left"> <!-- 左侧区域 -->
            <img :src="textLogo" alt="logo" class="text-logo" /> <!-- 文字LOGO -->

            <div class="function-group"> <!-- 功能组 -->
                <div class="icon-wrapper" @click="toggleSettingMenu"> <!-- 设置图标 -->
                    <img :src="settingIcon" alt="setting" class="function-icon" />

                    <!-- 设置下拉菜单 -->
                    <div v-if="showSettingMenu" class="dropdown-menu" @click.stop> <!-- 阻止冒泡 -->
                        <div class="dropdown-item" @click="onImport">导入</div> <!-- 导入选项 -->
                        <div class="dropdown-item" @click="onExport">导出</div> <!-- 导出选项 -->
                    </div>
                </div>

                <div class="icon-wrapper"> <!-- 插件图标 -->
                    <img :src="pluginIcon" alt="plugin" class="function-icon" />
                </div>
            </div>
        </div>

        <!-- 中部区域 -->
        <div class="topbar-center"> <!-- 中部区域 -->
            <input class="name-input" :value="store.blueprint.name" @input="onNameChange" placeholder="我的架构" /> <!-- 蓝图命名输入框 -->
        </div>

        <!-- 右侧区域 -->
        <div class="topbar-right"> <!-- 右侧区域 -->
            <button class="action-button run-button" @click="onRun">运行</button> <!-- 运行按钮 -->
            <button class="action-button score-button" @click="onScore">跑分</button> <!-- 跑分按钮 -->
        </div>

        <!-- 隐藏的文件输入框（用于导入）-->
        <input ref="fileInput" type="file" accept=".json" style="display: none" @change="onFileSelected" /> <!-- 隐藏的文件选择器 -->
    </div>

    <!-- 点击背景关闭设置菜单 -->
    <div v-if="showSettingMenu" class="menu-backdrop" @click="closeSettingMenu"></div> <!-- 透明遮罩层 -->
</template>

<style scoped>
.topbar {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    justify-content: space-between;
    /* 三区域分布 */
    height: 48px;
    /* 顶部栏高度 */
    background: #ffffff;
    /* 白色背景 */
    border-bottom: 1px solid #e0e0e0;
    /* 底部分隔线 */
    padding: 0 16px;
    /* 左右内边距 */
    z-index: 100;
    /* 层级 */
    position: relative;
    /* 相对定位 */
}

.topbar-left {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 16px;
    /* 元素间距 */
}

.text-logo {
    height: 24px;
    /* LOGO高度 */
}

.function-group {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 4px;
    /* 图标间距 */
}

.icon-wrapper {
    position: relative;
    /* 相对定位（用于下拉菜单）*/
    display: flex;
    /* 居中对齐 */
    align-items: center;
    /* 垂直居中 */
    justify-content: center;
    /* 水平居中 */
    width: 32px;
    /* 图标区域宽度 */
    height: 32px;
    /* 图标区域高度 */
    border-radius: 6px;
    /* 圆角 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: background 0.15s;
    /* 过渡动画 */
}

.icon-wrapper:hover {
    background: #f0f0f0;
    /* 悬停浅灰背景 */
}

.function-icon {
    width: 18px;
    /* 图标宽度 */
    height: 18px;
    /* 图标高度 */
    opacity: 0.6;
    /* 默认透明度 */
}

.dropdown-menu {
    position: absolute;
    /* 绝对定位 */
    top: 100%;
    /* 紧贴图标下方 */
    left: 0;
    /* 左对齐 */
    background: #ffffff;
    /* 白色背景 */
    border: 1px solid #e0e0e0;
    /* 浅色边框 */
    border-radius: 6px;
    /* 圆角 */
    padding: 4px;
    /* 内边距 */
    min-width: 100px;
    /* 最小宽度 */
    z-index: 200;
    /* 层级 */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    /* 阴影 */
}

.dropdown-item {
    padding: 6px 12px;
    /* 内边距 */
    border-radius: 4px;
    /* 圆角 */
    font-size: 13px;
    /* 字号 */
    color: #333333;
    /* 深色文字 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: background 0.15s;
    /* 过渡动画 */
}

.dropdown-item:hover {
    background: #f0f0f0;
    /* 悬停浅灰背景 */
}

.topbar-center {
    flex: 1;
    /* 中部占据剩余空间 */
    display: flex;
    /* 居中对齐 */
    justify-content: center;
    /* 水平居中 */
}

.name-input {
    width: 200px;
    /* 输入框宽度 */
    padding: 6px 12px;
    /* 内边距 */
    background: #f5f5f5;
    /* 浅灰背景 */
    border: 1px solid #d0d0d0;
    /* 浅色边框 */
    border-radius: 6px;
    /* 圆角 */
    color: #333333;
    /* 深色文字 */
    font-size: 14px;
    /* 字号 */
    text-align: center;
    /* 文字居中 */
    outline: none;
    /* 去除聚焦边框 */
}

.name-input:focus {
    border-color: #4a90d9;
    /* 聚焦时蓝色边框 */
}

.topbar-right {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 8px;
    /* 按钮间距 */
}

.action-button {
    padding: 6px 16px;
    /* 内边距 */
    border: none;
    /* 无边框 */
    border-radius: 6px;
    /* 圆角 */
    font-size: 13px;
    /* 字号 */
    font-weight: 500;
    /* 字重 */
    cursor: pointer;
    /* 鼠标指针 */
    transition: all 0.15s;
    /* 过渡动画 */
}

.run-button {
    background: #4a90d9;
    /* 运行按钮蓝色背景 */
    color: #ffffff;
    /* 白色文字 */
}

.run-button:hover {
    background: #357abd;
    /* 悬停时颜色加深 */
}

.score-button {
    background: #5cb85c;
    /* 跑分按钮绿色背景 */
    color: #ffffff;
    /* 白色文字 */
}

.score-button:hover {
    background: #4cae4c;
    /* 悬停时颜色加深 */
}

.menu-backdrop {
    position: fixed;
    /* 固定定位 */
    top: 0;
    /* 铺满整个页面 */
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    /* 在菜单下方 */
}
</style>
