import { reactive, readonly } from "vue";

const state = reactive([
  {
    name: "基础",
    color: "#8B92E5",
    nodes: [
      {
        name: "输入",
        opcode: "input",
        ports: {
          out: ["out1"],
        },
        params: [
          {
            label: "输入维度",
            type: "number",
            default: "1",
          },
          {
            label: "输入类型",
            type: "string",
            default: "float32",
          },
        ],
      },
      {
        name: "输出",
        opcode: "output",
        ports: {
          in: ["in1"],
        },
      },
    ],
  },
  {
    name: "数学",
    color: "#7DC7F5",
    nodes: [
      {
        name: "+",
        opcode: "add",
        ports: {
          in: ["in1", "in2"],
          out: ["out1"],
        },
      },
      {
        name: "-",
        opcode: "sub",
        ports: {
          in: ["in1", "in2"],
          out: ["out1"],
        },
      },
    ],
  },
  {
    name: "逻辑",
    color: "#E8B495",
    nodes: [
      {
        name: "与",
        opcode: "and",
        ports: {
          in: ["in1", "in2"],
          out: ["out1"],
        },
      },
      {
        name: "或",
        opcode: "or",
        ports: {
          in: ["in1", "in2"],
          out: ["out1"],
        },
      },
    ],
  },
]);

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
  // 颜色
  getNodeColor(opcode) {
    let color = "#8B92E5";
    state.forEach((category) => {
      category.nodes.forEach((node) => {
        if (node.opcode === opcode) {
          color = category.color;
        }
      });
    });
    return color;
  },
};
