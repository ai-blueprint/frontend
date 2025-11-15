# 炼丹蓝图 - AI 模型可视化编辑器

## 项目简介

**炼丹蓝图**是一个基于 Vue 3 开发的 AI 模型可视化编辑器，让用户可以通过拖拽节点和连线的方式直观地构建 AI 模型架构。这个工具就像搭积木一样简单，让复杂的 AI 模型设计变得清晰可见。

## 功能特性

- **直观的可视化编辑**：通过拖拽节点和连线，轻松构建模型架构
- **丰富的节点库**：包含大部分pytorch库的API节点
- **实时连接线**：自动计算和绘制节点间的贝塞尔曲线连接
- **蓝图缩放平移**：支持蓝图的缩放和平移，方便查看大型模型
- **历史操作记录**：完整的撤销/重做功能，让操作更加灵活
- **节点管理**：支持选择、移动、删除多个节点
- **端点吸附**：智能识别可连接的端点，实现精确连接

## 核心架构设计

### 1. 状态管理系统

项目采用 Vue 3 的响应式系统实现状态管理，主要包含四个核心 Store：

#### blueprintStore - 蓝图核心数据管理

```javascript
// 蓝图状态管理的核心数据结构
const state = reactive({
  nodes: [],      // 节点数组
  links: [],      // 连接线数组
  scale: 1,       // 蓝图缩放比例
  translate: { x: 0, y: 0 },  // 蓝图偏移量
  size: { width: 0, height: 0 },  // 蓝图尺寸
  tempLink: null  // 临时连接线
});
```

**工作原理**：使用 Vue 3 的 `reactive` 创建响应式数据，`readonly` 确保外部只能通过提供的方法修改状态，保证数据的可控性和一致性。

#### nodeStore - 节点库管理

存储和管理所有可用的节点类型，按类别组织，方便用户选择和使用。

#### historyStore - 历史记录管理

```javascript
const state = reactive({
  stack: [],   // 快照字符串数组
  index: -1,   // 当前位置
  max: 50      // 最多存 50 步，防止内存爆炸
});
```

**实现原理**：每次操作后将当前蓝图状态序列化为 JSON 字符串存储在栈中，撤销/重做时通过反序列化恢复对应状态。

#### mouseStore - 鼠标位置管理

实时追踪鼠标位置，为拖拽、连线等操作提供坐标支持。

### 2. 组件结构

项目采用清晰的组件化设计，主要包含以下组件：

- **布局组件**：HeaderBar, CategoryBar, NodesBox, WorkSpace, Blueprint, ToolBar
- **编辑器组件**：Node, Line, Port

**组件关系**：App.vue 作为根组件，集成所有子组件，形成完整的编辑器界面。

## 核心算法与实现原理

### 1. 贝塞尔曲线连接线算法

```javascript
// 计算贝塞尔曲线路径的核心代码
function updatePaths() {
  // ...
  const midX = (from.x + to.x) / 2;
  const pathD = `M${from.x},${from.y} C${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`;
  // ...
}
```

**直接使用SVG路径来方便地绘制贝塞尔曲线**

### 2. 端点吸附算法

```javascript
// 计算鼠标与端点距离的核心代码
const distance = Math.sqrt(
  Math.pow(position.x - endpointCenter.x, 2) +
  Math.pow(position.y - endpointCenter.y, 2)
);
return distance <= radius;  // radius 是吸附半径
```

**工作原理**：计算鼠标位置与各个端点的欧几里得距离，当距离小于设定的吸附半径时，自动吸附到该端点。

### 3. 唯一ID生成算法

```javascript
// 生成唯一ID的核心代码
export function generateId() {
  const timestamp = performance.now().toString(36);
  const randomArray = new Uint8Array(8);
  crypto.getRandomValues(randomArray);
  const randomPart = Array.from(randomArray, byte => byte.toString(16).padStart(2, '0')).join('');
  return timestamp + randomPart;
}
```

**实现细节**：结合高精度时间戳和加密安全的随机数生成唯一标识符，确保在高并发场景下也不会产生冲突。

### 4. 缩放计算

```javascript
// 从元素样式中提取缩放比例
export function getScale(element) {
  // 尝试直接获取scale属性
  const scale = element.style.scale;
  if (scale) return parseFloat(scale);
  
  // 从transform中提取scale值
  const transform = element.style.transform;
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  // ...
}
```

**工作原理**：支持从现代CSS scale属性或传统transform属性中提取缩放比例，确保在不同浏览器环境下的兼容性。

## 数据流管理

### 1. 单向数据流

项目遵循单向数据流原则：

1. **用户操作** → **状态更新** → **UI渲染**
2. 组件不直接修改状态，而是通过调用store提供的方法
3. 状态变更后，Vue自动触发相关组件的重新渲染

### 2. 蓝图序列化与反序列化

**应用场景**：用于历史记录的撤销/重做功能，以及未来可能的保存/加载功能。

## 项目启动与开发

### 安装依赖
```
yarn install
```

### 开发环境运行
```
yarn serve
```

### 构建生产版本
```
yarn build
```

### 代码检查与修复
```
yarn lint
```

## 技术栈

- **前端框架**：Vue 3
- **构建工具**：Vue CLI
- **状态管理**：Vue 3 响应式 API
- **样式处理**：原生 CSS
- **矢量图形**：SVG

## 未来展望

- 支持更多类型的节点和复杂的计算操作
- 实现蓝图的保存、加载和共享功能
- 添加节点属性编辑面板
- 支持批量操作和快捷键
- 增强模型预览和执行功能

## 结语

**炼丹蓝图**通过直观的可视化界面，大大降低了AI模型设计的门槛。无论是初学者还是专业开发者，都可以使用这个工具快速构建和验证自己的模型架构。项目采用现代化的Vue 3框架开发，具有良好的扩展性和维护性，为后续功能迭代提供了坚实的基础。
