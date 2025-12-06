import { reactive, readonly } from "vue";

/**
 * @typedef {Object} Position
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * Mouse Store - 管理鼠标位置和拖拽状态
 */

const state = reactive({
  position: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  lastPosition: { x: 0, y: 0 },
  isDragging: false,
});

const isValidMouseEvent = (e) => {
  return e && typeof e.clientX === "number" && typeof e.clientY === "number";
};

const createPosition = (x, y) => ({ x, y });

const clonePosition = (pos) => ({ x: pos.x, y: pos.y });

export const mouseStore = {
  state: readonly(state),

  // 更新鼠标位置
  move(e) {
    if (!isValidMouseEvent(e)) {
      console.warn("Invalid mouse event:", e);
      return;
    }

    state.lastPosition = clonePosition(state.position);
    state.position = createPosition(e.clientX, e.clientY);
    state.offset = createPosition(
      state.position.x - state.lastPosition.x,
      state.position.y - state.lastPosition.y
    );
  },

  // 重置偏移量
  resetOffset() {
    state.offset = createPosition(0, 0);
  },

  // 设置拖拽状态
  setDraggingState(isDragging) {
    state.isDragging = Boolean(isDragging);
  },

  // 重置所有鼠标状态
  resetMouseState() {
    state.position = createPosition(0, 0);
    state.lastPosition = createPosition(0, 0);
    state.offset = createPosition(0, 0);
    state.isDragging = false;
  },

  // 获取鼠标状态快照
  getMouseInfo() {
    return {
      position: clonePosition(state.position),
      offset: clonePosition(state.offset),
      isDragging: state.isDragging,
    };
  },

  // 获取鼠标移动距离
  getMovementDistance() {
    const dx = state.offset.x;
    const dy = state.offset.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 判断鼠标是否静止
  isStationary(threshold = 0.5) {
    return this.getMovementDistance() <= threshold;
  },
};