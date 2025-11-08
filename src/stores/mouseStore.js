import { reactive, readonly } from 'vue'

const state = reactive({
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,        // 先前位置
  offsetX: 0,
  offsetY: 0,       // 偏移 = 当前 - 先前
})

export const mouseStore = {
  state: readonly(state),

  move(e) {
    state.lastX = state.x
    state.lastY = state.y
    state.x = e.clientX
    state.y = e.clientY
    state.offsetX = state.x - state.lastX
    state.offsetY = state.y - state.lastY
  },

  resetOffset() {
    state.offsetX = 0
    state.offsetY = 0
  }
}