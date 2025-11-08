import { reactive, readonly } from 'vue'
import { blueprintStore } from './blueprintStore'

const state = reactive({
  stack: [],   // 快照字符串数组
  index: -1,   // 当前位置
  max: 50      // 最多存 50 步，防止内存爆炸
})

export const historyStore = {
  state: readonly(state),

  // 初始化时推一个空蓝图
  init() {
    this.push()
  },

  // 推一条新快照（每次操作完手动调）
  push() {
    // 如果不在栈顶，先丢掉后面的
    state.stack = state.stack.slice(0, state.index + 1)
    state.stack.push(blueprintStore.serialize())
    state.index = state.stack.length - 1
    // 超长截断
    if (state.stack.length > state.max) {
      state.stack.shift()
      state.index--
    }
  },

  // 撤销 / 重做
  canUndo: () => state.index > 0,
  canRedo: () => state.index < state.stack.length - 1,

  undo() {
    if (!this.canUndo()) return
    state.index--
    blueprintStore.restore(state.stack[state.index])
  },

  redo() {
    if (!this.canRedo()) return
    state.index++
    blueprintStore.restore(state.stack[state.index])
  }
}