import { createApp } from 'vue'
import App from './App.vue'
import { historyStore } from './stores/history'

const app = createApp(App)
app.mount('#app')

// 手动初始化历史记录，确保所有依赖都已加载完成
historyStore.init()
