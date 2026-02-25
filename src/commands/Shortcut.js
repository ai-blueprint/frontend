import History from '@/commands/History.js'         // 引入历史记录命令
import Node from '@/commands/Node.js'               // 引入节点命令
import Clipboard from '@/commands/Clipboard.js'     // 引入剪贴板命令

let keydownHandler = null                                       // 存储事件处理函数引用
let hasStarted = false                                          // 标记是否已完成初始化

// --- 初始化快捷键监听 ---
const init = () => {
    if (hasStarted) return                                      // 已初始化直接返回

    keydownHandler = (event) => {
        const activeTag = document.activeElement?.tagName?.toLowerCase() // 获取当前焦点元素标签
        if (activeTag === 'input' || activeTag === 'textarea') return   // 焦点在输入框时不响应

        const isCtrl = event.ctrlKey || event.metaKey                 // 检测是否按下Ctrl/Cmd
        const key = event.key.toLowerCase()                           // 统一按键为小写

        // --- Ctrl+Z 撤销 ---
        if (isCtrl && !event.shiftKey && key === 'z') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            History.undo()                                            // 执行撤销
            return
        }

        // --- Ctrl+Shift+Z 重做 ---
        if (isCtrl && event.shiftKey && key === 'z') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            History.redo()                                            // 执行重做
            return
        }

        // --- Ctrl+Y 重做 ---
        if (isCtrl && key === 'y') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            History.redo()                                            // 执行重做
            return
        }

        // --- Delete 删除选中节点 ---
        if (key === 'delete') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            Node.removeSelected()                                     // 删除选中节点
            return
        }

        // --- Ctrl+C 复制 ---
        if (isCtrl && key === 'c') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            Clipboard.copy()                                          // 复制选中节点
            return
        }

        // --- Ctrl+V 粘贴 ---
        if (isCtrl && key === 'v') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            Clipboard.paste()                                         // 粘贴节点
            return
        }

        // --- Ctrl+D 复制并粘贴 ---
        if (isCtrl && key === 'd') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            Clipboard.copyAndPaste()                                  // 复制并粘贴
            return
        }

        // --- Ctrl+A 全选 ---
        if (isCtrl && key === 'a') {
            event.preventDefault()                                    // 阻止浏览器默认行为
            Node.selectAll()                                          // 选中全部节点
            return
        }
    }

    document.addEventListener('keydown', keydownHandler)          // 注册键盘按下监听
    hasStarted = true                                             // 标记为已初始化
}

// --- 销毁快捷键监听 ---
const destroy = () => {
    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler)   // 移除键盘监听
        keydownHandler = null                                     // 清空引用
    }

    hasStarted = false                                            // 标记为未初始化
}

init()                                                            // 导入模块后立即启动

export default { init, destroy }                                 // 导出快捷键命令
