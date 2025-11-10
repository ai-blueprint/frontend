import { reactive, readonly } from "vue";

const state = reactive({
  基础: [
    {
      name: "输入",
      opcode: "input",
      endpoints: {
        out: ["test1"],
      },
    },
    {
      name: "输出",
      opcode: "output",
      endpoints: {
        in: ["test2"],
      },
    },
  ],
  数学: [
    {
      name: "+",
      opcode: "add",
      endpoints: {
        in: ["test11", "test21"],
        out: ["test111"],
      },
    },
    {
      name: "-",
      opcode: "sub",
      endpoints: {
        in: ["test1", "test2"],
        out: ["test3"],
      },
    },
    {
      name: "*",
      opcode: "mul",
      endpoints: {
        in: ["test1", "test2"],
        out: ["test3"],
      },
    },
  ],
});

export const nodeStore = {
  state: readonly(state),

  // ===== 节点 =====
  getNode(opcode) {
    let node = null;
    for (let category in state) {
      for (let n of state[category]) {
        if (n.opcode === opcode) {
          node = n;
          break;
        }
      }
    }
    return node;
  },
  getNodeName(opcode) {
    let name = "未搜索到节点名称";
    for (let category in state) {
      for (let node of state[category]) {
        if (node.opcode === opcode) {
          name = node.name;
          break;
        }
      }
    }
    return name;
  },
};
