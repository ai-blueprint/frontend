import { reactive, readonly } from "vue";

/**
 * Mouse Store
 * 管理鼠标位置和拖拽状态，为画布交互提供支持
 */

// 调试日志开关
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

/**
 * 鼠标状态
 */
const state = reactive({
  position: { x: 0, y: 0 }, // 鼠标当前位置 (clientX, clientY)
  offset: { x: 0, y: 0 }, // 鼠标移动的偏移量（当前位置 - 上一位置）
  lastPosition: { x: 0, y: 0 }, // 鼠标上一帧的位置
  isDragging: false, // 是否处于拖拽状态
});

/**
 * 鼠标状态管理对象
 */
export const mouseStore = {
  // 提供只读的状态访问
  state: readonly(state),

  /**
   * 更新鼠标位置
   * 计算偏移量并更新历史位置
   * @param {MouseEvent} e - 鼠标事件对象
   */
  move(e) {
    if (!e || typeof e.clientX === 'undefined') {
      debugLog('无效的鼠标事件对象');
      return;
    }
    
    // 保存当前位置为上一位置
    state.lastPosition = { ...state.position };
    
    // 更新当前位置
    state.position = { x: e.clientX, y: e.clientY };
    
    // 计算偏移量
    state.offset = {
      x: state.position.x - state.lastPosition.x,
      y: state.position.y - state.lastPosition.y
    };
    
    debugLog(`鼠标移动: (${state.position.x}, ${state.position.y}) 偏移: (${state.offset.x}, ${state.offset.y})`);
  },

  /**
   * 重置偏移量
   * 在某些交互结束时使用，避免错误的偏移计算
   */
  resetOffset() {
    state.offset = { x: 0, y: 0 };
    debugLog('偏移量已重置');
  },
  
  /**
   * 设置拖拽状态
   * @param {boolean} isDragging - 是否正在拖拽
   */
  setDraggingState(isDragging) {
    state.isDragging = Boolean(isDragging);
    debugLog(`拖拽状态设置为: ${state.isDragging}`);
  },
  
  /**
   * 重置所有鼠标状态
   * 在需要完全重置鼠标交互时使用
   */
  resetMouseState() {
    state.position = { x: 0, y: 0 };
    state.lastPosition = { x: 0, y: 0 };
    state.offset = { x: 0, y: 0 };
    state.isDragging = false;
    debugLog('鼠标状态已完全重置');
  },
  
  /**
   * 获取当前鼠标信息摘要
   * @returns {Object} - 包含位置和状态的摘要对象
   */
  getMouseInfo() {
    return {
      position: { ...state.position },
      offset: { ...state.offset },
      isDragging: state.isDragging
    };
  }
};
