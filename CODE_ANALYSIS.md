# 代码分析与改进建议

## 项目概述
本文档记录了对"炼丹蓝图"项目的代码审查结果，包括未实现的功能、发现的代码错误以及改进建议。

---

## 一、未实现的功能

### 1. 节点菜单和节点面板位置更新功能
**问题描述：**
- 架构设计要求节点菜单应显示在节点正上方，节点面板应显示在节点正下方
- 当前代码中 `watchers.js` 调用了 `updateFloatingPosition` 函数
- 需要验证 `utils/floatingPosition.js` 的实现是否完整

**影响范围：**
- 菜单和面板可能不会跟随节点位置正确显示

**建议方案：**
1. 检查 `utils/floatingPosition.js` 的实现
2. 确保位置计算考虑了视口缩放和偏移
3. 验证节点尺寸信息是否完整

### 2. 节点尺寸信息
**问题描述：**
- 架构设计要求节点对象应包含 `dimensions` 字段（width和height）
- `Node.js` 的 `add` 方法创建节点时没有设置 `dimensions` 字段

**影响范围：**
- 菜单和面板的位置计算可能不准确

**建议方案：**
1. 在 `Node.js` 的 `add` 方法中添加 `dimensions` 字段的初始化
2. 考虑添加节点尺寸的动态计算逻辑

### 3. 节点面板与节点菜单的分离
**问题描述：**
- 架构设计文档第233-243行中，`store` 应分别有 `nodeMenu` 和 `nodePanel` 两个状态对象
- 当前 `store.js` 中只有一个 `nodeContext` 对象

**影响范围：**
- 无法独立控制菜单和面板的显示状态

**建议方案：**
1. 将 `store.nodeContext` 拆分为 `store.nodeMenu` 和 `store.nodePanel`
2. 更新相关组件以使用新的状态结构

---

## 二、发现的代码错误

### 1. WebSocket消息类型不匹配
**位置：** `src/ws.js` 第154行

**问题描述：**
```javascript
const messageHandlerMap = {
    getRegistry: onRegistryMessage,
    runBlueprint: onRunMessage,  // ← 这里使用的是 "runBlueprint"
    score: onScoreMessage,
}
```

**架构设计要求：**
根据架构设计文档第189-192行，消息类型应该是 `"run"`：
```
发送：{ type: "run", data: { blueprint: store.blueprint } }
接收：{ type: "run", data: 运行结果 }
```

**影响范围：**
- 运行结果消息可能无法正确处理

**建议方案：**
将 `runBlueprint` 改为 `run`，确保前后端消息类型一致

### 2. 架构设计文档重复定义
**位置：** `项目架构设计.txt` 第233-243行

**问题描述：**
`nodeContext` 被定义了两次，这可能是文档编写时的复制错误。

**影响范围：**
- 可能导致理解上的混淆
- 实际代码中只实现了一次，不影响运行

**建议方案：**
更新架构设计文档，明确区分 `nodeMenu` 和 `nodePanel`

---

## 三、代码改进建议

### 1. Node.js 改进
**建议内容：**
- 在 `add` 方法中添加 `dimensions` 字段的初始化
- 考虑添加节点尺寸的动态计算逻辑

**示例代码：**
```javascript
const newNode = {
    id: nodeId,
    type: 'baseNode',
    position: { x: x || 0, y: y || 0 },
    dimensions: { width: 0, height: 0 },  // 添加尺寸字段
    data: { /* ... */ },
    selected: false,
    tensorImage: null,
    error: null,
}
```

### 2. store.js 改进
**建议内容：**
- 将 `nodeContext` 拆分为 `nodeMenu` 和 `nodePanel` 两个独立对象
- 确保两个对象都有完整的 visible、nodeId、x、y 字段

**示例代码：**
```javascript
nodeMenu: {
    visible: false,
    nodeId: null,
    x: 0,
    y: 0,
},
nodePanel: {
    visible: false,
    nodeId: null,
    x: 0,
    y: 0,
},
```

### 3. ws.js 改进
**建议内容：**
- 修正消息类型映射，将 `runBlueprint` 改为 `run`
- 确保前后端消息类型一致

**示例代码：**
```javascript
const messageHandlerMap = {
    getRegistry: onRegistryMessage,
    run: onRunMessage,  // 修改为 "run"
    score: onScoreMessage,
}
```

### 4. watchers.js 改进
**建议内容：**
- 验证 `updateFloatingPosition` 函数的实现是否完整
- 确保菜单位置计算考虑了视口缩放和偏移

### 5. NodeMenu.vue 和 NodePanel.vue 改进
**建议内容：**
- 更新组件以使用分离后的 `nodeMenu` 和 `nodePanel` 状态
- 确保菜单位置计算正确

---

## 四、实施优先级建议

### 高优先级（建议优先处理）
1. 修复 WebSocket 消息类型不匹配问题（ws.js）
2. 实现节点尺寸信息的初始化（Node.js）

### 中优先级
3. 验证并完善菜单和面板的位置更新逻辑
4. 拆分 nodeContext 为 nodeMenu 和 nodePanel

### 低优先级
5. 更新架构设计文档中的重复定义

---

## 五、风险评估

所有建议的改进都不会破坏现有功能，但建议：
1. 在实施前创建备份或使用版本控制
2. 逐步实施并测试每个改动
3. 保留原始代码的注释以便回溯

---

## 六、后续步骤

1. 审查本文档中的所有建议
2. 确定要实施的改进项
3. 按优先级逐步实施
4. 每次改动后进行充分测试
