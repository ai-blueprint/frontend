<template>
  <header class="header">
    <!-- 左侧区域 -->
    <div class="left-area">
      <h1 class="logo">炼丹蓝图</h1>
    </div>

    <!-- 中部区域 -->
    <div class="middle-area">
      <input
        type="text"
        class="architecture-name-input"
        value="我的架构"
        placeholder="输入架构名称"
      />
    </div>

    <!-- 右侧区域 -->
    <div class="right-area">
      <div class="user-avatar">
        <img
          src="../assets/用户头像.svg"
          alt="用户头像"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
// 顶部导航栏组件，显示应用标题、架构名称输入和用户信息
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  height: fit-content;
  background-color: #5f38df;
  color: #fff;
}

.left-area {
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
}

.middle-area {
  max-width: 170px;
}

.architecture-name-input {
  width: 100%;
  padding: 8px 16px;
  border: 0px;
  border-radius: 999px;
  font-size: 14px;
  text-align: center;
  background-color: #7f60e5;
  color: #fff;
}
.architecture-name-input::placeholder {
  color: #fff;
  opacity: 0.5;
}

.right-area {
  display: flex;
  align-items: center;
  gap: 50px;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
</style>