import { reactive, readonly } from 'vue'
import { blueprintStore } from './blueprint'

// 历史记录配置常量
const MAX_HISTORY_SIZE = 50

// 历史记录状态
const state = reactive({
  historyStack: [], // 历史记录栈
  currentPosition: -1, // 当前位置索引
  maxHistorySize: MAX_HISTORY_SIZE, // 最大历史记录数
})

export const historyStore = {
  state: readonly(state),

  // 初始化时推一个空蓝图
  init() {
    this.recordState()
  },

  // 记录当前状态到历史记录
  recordState() {
    // 清除当前位置之后的历史（如果存在）
    if (state.currentPosition < state.historyStack.length - 1) {
      state.historyStack = state.historyStack.slice(0, state.currentPosition + 1)
    }

    // 序列化并保存当前蓝图状态
    const currentState = blueprintStore.serialize()
    state.historyStack.push(currentState)
    state.currentPosition = state.historyStack.length - 1

    // 限制历史记录大小
    if (state.historyStack.length > state.maxHistorySize) {
      state.historyStack.shift()
      state.currentPosition--
    }
  },

  // 检查是否可以撤销
  canUndo() {
    return state.currentPosition > 0
  },

  // 检查是否可以重做
  canRedo() {
    return state.currentPosition < state.historyStack.length - 1
  },

  // 撤销到上一个状态
  undo() {
    if (this.canUndo()) {
      state.currentPosition--
      blueprintStore.restore(state.historyStack[state.currentPosition])
    }
  },

  // 重做下一个状态
  redo() {
    if (this.canRedo()) {
      state.currentPosition++
      blueprintStore.restore(state.historyStack[state.currentPosition])
    }
  },
  
  // 清空历史记录
  clearHistory() {
    state.historyStack = []
    state.currentPosition = -1
    this.recordState() // 记录当前状态作为新的历史起点
  }
}

// 自动初始化历史记录
historyStore.init()