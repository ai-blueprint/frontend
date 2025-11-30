import { reactive, readonly } from 'vue'
import { blueprintStore } from './blueprint'

/**
 * History Store
 * 管理蓝图操作的撤销/重做功能
 */

// 调试日志开关
const DEBUG = false;
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

/**
 * 历史记录配置常量
 * 设置最大历史记录条数，防止内存占用过大
 */
const MAX_HISTORY_SIZE = 50;

/**
 * 历史记录状态
 */
const state = reactive({
  historyStack: [], // 历史记录栈，存储序列化的蓝图状态
  currentPosition: -1, // 当前位置索引，初始为-1表示无历史
  maxHistorySize: MAX_HISTORY_SIZE, // 最大历史记录数
});

/**
 * 历史记录管理对象
 */
export const historyStore = {
  // 只读状态导出
  state: readonly(state),

  /**
   * 初始化历史记录
   * 创建初始历史状态点
   */
  init() {
    debugLog('初始化历史记录');
    this.recordState();
  },

  /**
   * 记录当前状态到历史记录
   * 这是历史记录功能的核心方法，在每次蓝图修改后调用
   */
  recordState() {
    try {
      // 清除当前位置之后的历史（如果存在）
      // 这确保在执行新操作后分支的历史被截断
      if (state.currentPosition < state.historyStack.length - 1) {
        const oldLength = state.historyStack.length;
        state.historyStack = state.historyStack.slice(0, state.currentPosition + 1);
        debugLog(`清除未来历史记录，从 ${oldLength} 缩减到 ${state.historyStack.length}`);
      }

      // 序列化并保存当前蓝图状态
      const currentState = blueprintStore.serialize();
      state.historyStack.push(currentState);
      state.currentPosition = state.historyStack.length - 1;
      
      // 限制历史记录大小，确保不会占用过多内存
      if (state.historyStack.length > state.maxHistorySize) {
        state.historyStack.shift(); // 移除最旧的记录
        state.currentPosition--;
        debugLog(`历史记录超过限制，已移除最旧记录`);
      }
      
      debugLog(`记录新状态，当前位置: ${state.currentPosition}/${state.historyStack.length - 1}`);
    } catch (error) {
      console.error('记录历史状态失败:', error);
    }
  },

  /**
   * 检查是否可以撤销
   * @returns {boolean} - 是否可以执行撤销操作
   */
  canUndo() {
    return state.currentPosition > 0;
  },

  /**
   * 检查是否可以重做
   * @returns {boolean} - 是否可以执行重做操作
   */
  canRedo() {
    return state.currentPosition < state.historyStack.length - 1;
  },

  /**
   * 撤销到上一个状态
   */
  undo() {
    if (!this.canUndo()) {
      debugLog('没有可撤销的历史记录');
      return;
    }
    
    try {
      state.currentPosition--;
      const previousState = state.historyStack[state.currentPosition];
      blueprintStore.restore(previousState);
      debugLog(`撤销操作成功，当前位置: ${state.currentPosition}`);
    } catch (error) {
      console.error('撤销操作失败:', error);
      // 尝试恢复到操作前的位置
      state.currentPosition++;
    }
  },

  /**
   * 重做下一个状态
   */
  redo() {
    if (!this.canRedo()) {
      debugLog('没有可重做的历史记录');
      return;
    }
    
    try {
      state.currentPosition++;
      const nextState = state.historyStack[state.currentPosition];
      blueprintStore.restore(nextState);
      debugLog(`重做操作成功，当前位置: ${state.currentPosition}`);
    } catch (error) {
      console.error('重做操作失败:', error);
      // 尝试恢复到操作前的位置
      state.currentPosition--;
    }
  },
  
  /**
   * 清空历史记录
   * 重置历史状态并创建新的起点
   */
  clearHistory() {
    state.historyStack = [];
    state.currentPosition = -1;
    this.recordState(); // 记录当前状态作为新的历史起点
    debugLog('历史记录已清空');
  },
  
  /**
   * 获取当前历史记录信息
   * @returns {Object} - 包含历史记录状态的对象
   */
  getHistoryInfo() {
    return {
      current: state.currentPosition,
      total: state.historyStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
};

// 注释掉自动初始化，改为在 main.js 中手动初始化
// historyStore.init();