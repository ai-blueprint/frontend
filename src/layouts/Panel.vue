<template>
  <!-- 属性面板组件 -->
  <div id="panel" class="panel-container">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h2>属性</h2>
    </div>

    <!-- 面板内容区域 -->
    <div class="panel-content">
      <!-- 未选择节点时的空状态提示 -->
      <div v-if="!hasSelectedNodes" class="empty-state">
        <p>选择节点<br />修改属性</p>
      </div>

      <!-- 参数编辑器（选择节点后显示） -->
      <div v-else class="param-editor">
        <!-- 多选状态提示 -->
        <div v-if="isMultipleSelection" class="selection-info">
          已选择 {{ selectedNodes.length }} 个节点
        </div>

        <!-- 节点无参数时的空状态提示 -->
        <div v-if="!hasParams" class="empty-state">
          <p>该节点没有属性</p>
        </div>

        <!-- 参数列表（使用Ant Design主题配置） -->
        <a-config-provider v-else :theme="themeConfig">
          <!-- 遍历渲染每个参数项 -->
          <div
            v-for="param in mergedParams"
            :key="param.key"
            class="param-item"
          >
            <!-- 参数标签 -->
            <label class="param-label">{{ param.label }}</label>
            
            <!-- 动态输入组件（根据参数类型渲染不同组件） -->
            <component
              :is="getInputComponent(param.type)"
              v-model:value="param.default"
              :checked="param.default"
              :class="{ 'multi-value': param.isMultiValue }"
              class="param-input"
              @change="(value) => handleParamChange(param, value)"
              @update:value="(value) => handleParamChange(param, value)"
            />
          </div>
        </a-config-provider>
      </div>
    </div>
  </div>
</template>

<script setup lang="js">
// 导入蓝图存储
import { blueprintStore } from "@/stores/blueprint";
// 导入Vue响应式API
import { computed, ref, watchEffect } from "vue";
// 导入Ant Design组件
import {
  ConfigProvider as AConfigProvider,
  Switch as ASwitch,
  InputNumber as AInputNumber,
  Input as AInput,
} from "ant-design-vue";

// 常量：多值标识符
const MULTI_VALUE_INDICATOR = "多值";

// Ant Design主题配置
const themeConfig = {
  token: {
    colorPrimary: "#8C92DFFF",
    borderRadius: 4,
    borderRadiusLG: 8,
  },
  components: {
    Input: {
      borderRadius: 8,
    },
    InputNumber: {
      borderRadius: 8,
    },
    Switch: {
      colorPrimary: "#8C92DFFF",
    },
  },
};

// 响应式数据：当前选中的节点列表
const selectedNodes = ref([]);

// 监听选中节点变化，同步蓝图存储中的选中状态
watchEffect(() => {
  selectedNodes.value = blueprintStore.getSelectedNodes();
});

// 计算属性：是否有选中节点
const hasSelectedNodes = computed(() => selectedNodes.value.length > 0);

// 计算属性：是否多选
const isMultipleSelection = computed(() => selectedNodes.value.length > 1);

// 计算属性：是否有参数
const hasParams = computed(() => mergedParams.value.length > 0);

// 计算属性：合并参数（处理单节点和多节点情况）
const mergedParams = computed(() => {
  if (!hasSelectedNodes.value) return [];

  const nodes = selectedNodes.value;
  if (nodes.length === 1) {
    return processSingleNodeParams(nodes[0]);
  }
  return processMultipleNodesParams(nodes);
});

// 转换参数值为正确类型
function convertParamValue(type, value) {
  if (value === MULTI_VALUE_INDICATOR) return value;

  switch (type) {
    case "number":
      return parseFloat(value);
    case "boolean":
      return value === true || value === "true";
    default:
      return value;
  }
}

// 检查数组中所有值是否相同
function areAllValuesSame(values) {
  if (!values.length) return true;
  return values.every((val) => val === values[0]);
}

// 处理单节点参数
function processSingleNodeParams(node) {
  if (!node.params?.length) return [];

  return node.params.map((param, index) => {
    const convertedDefault = convertParamValue(param.type, param.default);
    return {
      ...param,
      nodes: [node],
      isMultiValue: false,
      params: [param],
      default: convertedDefault,
      originalValue: convertedDefault,
      key: `${param.label}-${node.id}-${index}`,
    };
  });
}

// 处理多节点参数合并
function processMultipleNodesParams(nodes) {
  const paramGroups = new Map();

  nodes.forEach((node) => {
    if (!node.params?.length) return;

    node.params.forEach((param) => {
      const group = paramGroups.get(param.label);
      if (!group) {
        // 创建新参数分组
        paramGroups.set(param.label, {
          label: param.label,
          type: param.type,
          values: [param.default],
          nodes: [node],
          params: [param],
        });
      } else {
        // 添加到现有分组
        group.values.push(param.default);
        group.nodes.push(node);
        group.params.push(param);
      }
    });
  });

  // 转换分组为参数列表，处理多值情况
  return Array.from(paramGroups.values()).map((group, index) => {
    const allValuesSame = areAllValuesSame(group.values);
    const defaultValue = allValuesSame
      ? group.values[0]
      : MULTI_VALUE_INDICATOR;

    return {
      label: group.label,
      type: group.type,
      default: convertParamValue(group.type, defaultValue),
      isMultiValue: !allValuesSame,
      nodes: group.nodes,
      params: group.params,
      originalValue: convertParamValue(
        group.type,
        allValuesSame ? group.values[0] : MULTI_VALUE_INDICATOR
      ),
      key: `${group.label}-${index}`,
    };
  });
}

// 根据参数类型获取对应的输入组件
function getInputComponent(type) {
  switch (type) {
    case "boolean":
      return ASwitch;
    case "number":
      return AInputNumber;
    case "string":
    default:
      return AInput;
  }
}

// 验证输入值是否有效
function isValidInput(type, value) {
  if (type === "boolean") return true;
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (type === "number") return !isNaN(parseFloat(value)) && isFinite(value);
  return true;
}

// 处理参数值变更
function handleParamChange(param, newValue) {
  // 验证输入有效性
  if (!isValidInput(param.type, newValue)) {
    // 无效则恢复原始值
    param.params.forEach((p) => {
      p.default = param.originalValue;
    });
    return;
  }

  // 有效则更新所有相关节点
  param.params.forEach((p) => {
    p.default = newValue;
  });
  param.originalValue = newValue;
}
</script>

<style scoped>
/* 面板容器样式 */
.panel-container {
  min-width: 200px;
  max-width: 250px;
  width: 100%;
  height: 100%;
  background-color: #f6f9fe;
  padding: 16px;
  box-sizing: border-box;
}

/* 面板头部样式 */
.panel-header {
  margin-bottom: 20px;
  font-size: 24px;
}

/* 面板内容区域样式 */
.panel-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
  overflow: hidden;
}

/* 空状态提示样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #888;
  font-size: 24px;
  font-weight: bold;
}

/* 参数编辑器样式 */
.param-editor {
  height: 100%;
  overflow-y: auto;
  width: 100%;
  padding: 4px;
}

/* 多选提示信息样式 */
.selection-info {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 15px;
  padding: 5px 0;
  border-bottom: 1px solid #eaeffc;
}

/* 单个参数项样式 */
.param-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}

/* 参数标签样式 */
.param-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

/* 参数输入框样式 */
.param-input {
  width: auto;
  min-width: 50px;
  max-width: 100px;
  background-color: #eaeffc;
  font-weight: 600;
}

/* 多值状态样式 */
.multi-value {
  opacity: 0.5;
}
</style>
