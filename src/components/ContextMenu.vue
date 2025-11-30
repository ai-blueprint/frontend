<template>
    <div id="context-menu">
        <!-- 复制并粘贴 -->
        <span class="context-menu-item">
            <span class="icon-container">
                <img src="@/assets/ContextMenu/复制并粘贴.svg" alt="复制并粘贴" class="icon">
            </span>
            复制并粘贴
        </span>
        <!-- 重命名 -->
        <span class="context-menu-item">
            <span class="icon-container">
                <img src="@/assets/ContextMenu/重命名.svg" alt="重命名" class="icon">
            </span>
            重命名
        </span>
        <!-- 删除节点 -->
        <span class="context-menu-item">
            <span class="icon-container">
                <img src="@/assets/ContextMenu/删除节点.svg" alt="删除节点" class="icon">
            </span>
            删除节点
        </span>
    </div>
</template>

<style scoped>
#context-menu {
    position: absolute;
    z-index: 1000;
    border-radius: 14px;

    display: flex;
    flex-direction: row;
    padding: 12px;
    gap: 12px;
    background: #F6F9FE;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.16);

    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    /* 文本超出不换行 */
    white-space: nowrap;
    color: #6F7DB0;

    /* 先隐藏，之后用到再显示 */
    display: none;
}

.context-menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-wrap: nowrap;
    gap: 5px;
}

.icon-container {
    border-radius: 10px;
    background: #EAEFFC;
    display: flex;
    transition: all 0.1s ease-in-out;
}

.icon-container:hover {
    filter: brightness(1.05);
}

.icon-container:active {
    filter: brightness(0.98);
}

.icon {
    width: 60px;
    height: 40px;
    margin: 5px;
    scale: 1.4;
}
</style>
