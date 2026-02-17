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
    justify-content: space-between;
    /* 三区域分布 */
    align-items: center;
    /* 垂直居中 */
    padding: 8px 20px;
    /* 内边距 */
    height: fit-content;
    /* 自适应高度 */
    background-color: #5f38df;
    /* 紫色主题背景 */
    color: #ffffff;
    /* 白色文字 */
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
    gap: 30px;
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
    transition: all 0.1s ease-in-out;
    /* 过渡动画 */
}

.icon-wrapper:hover {
    scale: 1.05;
    /* 悬停放大效果 */
}

.icon-wrapper:active {
    scale: 0.95;
    /* 点击缩小效果 */
}

.function-icon {
    width: 18px;
    /* 图标宽度 */
    height: 18px;
    /* 图标高度 */
    opacity: 0.8;
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
    max-width: 170px;
    /* 限制最大宽度 */
    margin: 0 10px;
    /* 左右外边距 */
}

.name-input {
    width: 100%;
    /* 铺满容器 */
    padding: 8px 16px;
    /* 内边距 */
    border: 0px;
    /* 无边框 */
    border-radius: 999px;
    /* 药丸形圆角 */
    font-size: 14px;
    /* 字号 */
    font-weight: 500;
    /* 中等字重 */
    text-align: center;
    /* 文字居中 */
    background-color: #7f60e5;
    /* 紫色输入框背景 */
    color: #ffffff;
    /* 白色文字 */
    outline: none;
    /* 去除聚焦边框 */
}

.name-input::placeholder {
    color: #ffffff;
    /* 占位符白色 */
    opacity: 0.5;
    /* 占位符半透明 */
}

.topbar-right {
    display: flex;
    /* 横向排列 */
    align-items: center;
    /* 垂直居中 */
    gap: 20px;
    /* 按钮间距 */
}

.action-button {
    padding: 6px 16px;
    /* 内边距 */
    border: none;
    /* 无边框 */
    border-radius: 6px;
    /* 圆角 */
    font-size: 14px;
    /* 字号 */
    font-weight: 500;
    /* 字重 */
    color: #ffffff;
    /* 白色文字 */
    cursor: pointer;
    /* 鼠标指针 */
    letter-spacing: -1px;
    /* 紧凑字距 */
    transition: all 0.1s ease-in-out;
    /* 过渡动画 */
}

.action-button:hover {
    scale: 1.05;
    /* 悬停放大效果 */
}

.action-button:active {
    scale: 0.95;
    /* 点击缩小效果 */
}

.run-button {
    background-color: #7DC7F5;
    /* 运行按钮天蓝色背景 */
}

.score-button {
    background-color: #E1B86B;
    /* 跑分按钮金色背景 */
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
