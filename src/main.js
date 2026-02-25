import { createApp } from "vue"; // 引入Vue创建应用函数
import App from "./App.vue"; // 引入根组件
import Varlet, { Themes, StyleProvider } from "@varlet/ui"; // 引入Varlet UI库
import "@varlet/ui/es/style"; // 引入Varlet样式
import "./style.css"; // 引入全局自定义样式
import "./watchers.js"; // 导入即启动数据维护监听
import "./commands/AutoRecord.js"; // 导入即启动自动历史记录
import "./commands/Shortcut.js"; // 导入即启动快捷键监听
import "./commands/History.js"; // 导入即启动历史初始快照
import "./ws.js"; // 导入即启动WebSocket模块

const app = createApp(App); // 创建Vue应用实例
app.use(Varlet); // 注册Varlet UI库
StyleProvider(Themes.md3Light);
app.mount("#app"); // 挂载Vue应用到DOM
