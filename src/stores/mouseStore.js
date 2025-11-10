import { reactive, readonly } from "vue";

// 鼠标状态管理
const state = reactive({
  position: { x: 0, y: 0 }, // 鼠标在蓝图中的位置
  offset: { x: 0, y: 0 }, // 鼠标相对于选中元素的偏移
  lastPosition: { x: 0, y: 0 }, // 先前位置
  isDragging: false, // 是否正在拖拽
});

// 导出鼠标状态管理器
export const mouseStore = {
  // 提供只读的状态访问
  state: readonly(state),

  // 更新鼠标位置
  move(e) {
    state.lastPosition = { ...state.position };
    state.position = { x: e.clientX, y: e.clientY };
    state.offset = {
      x: state.position.x - state.lastPosition.x,
      y: state.position.y - state.lastPosition.y
    };
  },

  // 重置偏移量
  resetOffset() {
    state.offset = { x: 0, y: 0 };
  },
  
  // 设置拖拽状态
  setDraggingState(isDragging) {
    state.isDragging = isDragging;
  },
  
  // 重置鼠标状态
  resetMouseState() {
    state.position = { x: 0, y: 0 };
    state.lastPosition = { x: 0, y: 0 };
    state.offset = { x: 0, y: 0 };
    state.isDragging = false;
  }
};