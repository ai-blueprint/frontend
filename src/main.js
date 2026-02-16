import { createApp } from 'vue'                    // 引入Vue创建应用函数
import App from './App.vue'                         // 引入根组件
import Varlet from '@varlet/ui'                     // 引入Varlet UI库
import '@varlet/ui/es/style'                        // 引入Varlet样式
import '@vue-flow/core/dist/style.css'              // 引入VueFlow核心样式
import '@vue-flow/core/dist/theme-default.css'      // 引入VueFlow默认主题
import './style.css'                                // 引入全局自定义样式
import store from './store.js'                      // 引入全局状态
import ws from './ws.js'                            // 引入WebSocket模块
import AutoRecord from './commands/AutoRecord.js'   // 引入自动记录模块
import Shortcut from './commands/Shortcut.js'       // 引入快捷键模块
import History from './commands/History.js'          // 引入历史记录模块
import { initWatchers } from './watchers.js'        // 引入数据维护监听

// --- 应用初始化流程 ---
const initApp = async () => {
    const app = createApp(App)                        // 创建Vue应用实例
    app.use(Varlet)                                   // 注册Varlet UI库

    await ws.connect()                                // 连接后端WebSocket

    // --- 设置默认选中第一个分类 ---
    const categoryKeys = Object.keys(store.registry.categories || {}) // 获取所有分类标识
    if (categoryKeys.length) {
        store.selected.category = categoryKeys[0]       // 默认选中第一个分类
    }

    app.mount('#app')                                 // 挂载Vue应用到DOM

    initWatchers()                                    // 初始化数据维护监听
    AutoRecord.init()                                 // 初始化自动历史记录
    Shortcut.init()                                   // 初始化快捷键监听
    History.record()                                  // 记录初始空白状态
}

initApp()                                           // 执行初始化
