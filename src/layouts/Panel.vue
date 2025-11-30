<template>
  <!-- 属性面板容器 -->
  <div id="panel" class="panel-container">
    <!-- 面板标题 -->
    <div class="panel-header">
      <h2>属性</h2>
    </div>

    <!-- 面板内容区域 -->
    <div class="panel-content">
      <!-- 有节点被选中时显示属性编辑器 -->
      <div v-if="selectedNodes.length > 0" class="param-container">
        <!-- 当选中多个节点时显示选中节点数量 -->
        <div v-if="selectedNodes.length > 1" class="selected-count">
          已选择 {{ selectedNodes.length }} 个节点
        </div>

        <!-- 只有选择单个节点时显示节点名称 -->
        <!-- <h3 v-if="selectedNodes.length === 1" class="node-name">{{ selectedNodes[0].name }}</h3> -->
        <!-- 如果选择的所有节点都没有属性就提示没有属性 -->
        <div v-if="mergedParams.length === 0" class="no-params">
          <p>该节点没有属性</p>
        </div>
        <!-- 使用Ant Design的ConfigProvider应用主题 -->
        <a-config-provider :theme="themeConfig">
          <!-- 遍历合并后的参数列表 -->
          <div v-for="(param, paramIndex) in mergedParams" :key="paramIndex" class="param-item">
            <label>{{ param.label }}</label>
            <!-- 参数输入区域 -->
            <div class="input-wrapper">
              <!-- 根据参数类型渲染不同的输入组件 -->
              <!-- 布尔类型使用开关组件 -->
              <a-switch v-if="param.type === 'boolean'" :checked="param.default"
                @change="handleParamChange(param, $event)" :class="{ 'multi-value': param.isMultiValue }" />

              <!-- 数字类型使用数字输入框 -->
              <a-input-number v-else-if="param.type === 'number'" v-model:value="param.default"
                @change="handleParamChange(param, $event)" :step="1" :keyboard="true"
                :class="{ 'multi-value': param.isMultiValue }" />

              <!-- 字符串类型使用文本输入框 -->
              <a-input v-else-if="param.type === 'string'" :value="param.default"
                @change="e => handleParamChange(param, e.target.value)"
                :class="{ 'multi-value': param.isMultiValue }" />

              <!-- 未知类型使用文本输入框 -->
              <a-input v-else :value="param.default" @change="e => handleParamChange(param, e.target.value)"
                placeholder="未知类型" :class="{ 'multi-value': param.isMultiValue }" />
            </div>
          </div>
        </a-config-provider>
      </div>

      <!-- 无节点选中时的提示信息 -->
      <div v-else class="no-node-selected">
        <p>选择节点<br>修改属性</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 属性面板组件
 * 用于显示和编辑选中节点的属性参数
 */

// 导入依赖
import { blueprintStore } from '@/stores/blueprint';
import { ref, watch, computed } from 'vue';
import { ConfigProvider as AConfigProvider, Switch as ASwitch, InputNumber as AInputNumber, Input as AInput } from 'ant-design-vue';

// 自定义主题配置 - Ant Design 6.0
const themeConfig = {
  token: {
    colorPrimary: '#8C92DFFF',
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
      colorPrimary: '#8C92DFFF',
    },
  },
};

// 响应式数据
const selectedNodes = ref([]);

// 监听选中节点变化
watch(() => blueprintStore.getSelectedNodes(), (newSelectedNodes) => {
  selectedNodes.value = newSelectedNodes;
}, { immediate: true });

/**
 * 转换参数值为正确的类型
 * @param {Object} param - 参数对象
 * @param {*} value - 要转换的值
 * @returns {*} - 转换后的值
 */
const convertParamValue = (param, value) => {
  // 如果是多值状态，直接返回
  if (value === '多值') return value;

  // 根据参数类型转换值
  switch (param.type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === true || value === 'true';
    default:
      return value;
  }
};

/**
 * 检查所有值是否相同
 * @param {Array} values - 值数组
 * @returns {boolean} - 所有值是否相同
 */
const areAllValuesSame = (values) => {
  if (!values.length) return true;
  return values.every(val => val === values[0]);
};

/**
 * 合并相同参数名的参数，支持多节点属性编辑
 */
const mergedParams = computed(() => {
  // 无选中节点时返回空数组
  if (selectedNodes.value.length === 0) return [];

  // 单个节点处理逻辑
  if (selectedNodes.value.length === 1) {
    const node = selectedNodes.value[0];
    // 检查节点是否有params属性
    if (!node.params) return [];

    // 转换单个节点的参数
    return node.params.map(param => {
      const convertedDefault = convertParamValue(param, param.default);
      return {
        ...param,
        nodes: [node],
        isMultiValue: false,
        params: [param], // 确保handleParamChange函数能正常工作
        default: convertedDefault,
        originalValue: convertedDefault // 存储原始值，用于恢复
      };
    });
  }

  // 多个节点处理逻辑：按参数名分组
  const paramGroups = {};

  // 遍历所有选中节点，收集参数
  selectedNodes.value.forEach(node => {
    if (!node.params) return;

    node.params.forEach(param => {
      if (!paramGroups[param.label]) {
        paramGroups[param.label] = {
          label: param.label,
          type: param.type,
          values: [param.default],
          nodes: [node],
          params: [param]
        };
      } else {
        paramGroups[param.label].values.push(param.default);
        paramGroups[param.label].nodes.push(node);
        paramGroups[param.label].params.push(param);
      }
    });
  });

  // 转换为数组，并标记多值状态
  return Object.values(paramGroups).map(group => {
    const allValuesSame = areAllValuesSame(group.values);
    const defaultValue = allValuesSame ? group.values[0] : '多值';

    return {
      label: group.label,
      type: group.type,
      default: convertParamValue(group, defaultValue),
      isMultiValue: !allValuesSame,
      nodes: group.nodes,
      params: group.params,
      originalValue: convertParamValue(group, allValuesSame ? group.values[0] : '多值')
    };
  });
});

/**
 * 验证输入值是否有效
 * @param {Object} param - 参数对象
 * @param {*} value - 输入值
 * @returns {boolean} - 是否有效
 */
const isValidInput = (param, value) => {
  // 布尔类型总是有效
  if (param.type === 'boolean') {
    return true;
  }

  // 检查是否为空或只包含空格
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }

  // 数字类型验证
  if (param.type === 'number') {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  // 字符串类型只要不为空就有效
  if (param.type === 'string') {
    return true;
  }

  // 其他类型默认有效
  return true;
};

/**
 * 处理参数值变更
 * @param {Object} param - 参数对象
 * @param {*} newValue - 新值
 */
const handleParamChange = (param, newValue) => {
  // 验证输入值是否有效
  if (isValidInput(param, newValue)) {
    // 更新所有相关节点的参数值
    param.params.forEach(p => {
      p.default = newValue;
    });
    // 更新原始值
    param.originalValue = newValue;
  } else {
    // 输入无效，恢复原始值
    param.params.forEach(p => {
      p.default = param.originalValue;
    });
  }
};
</script>

<style scoped>
/* 面板容器样式 */
.panel-container {
  min-width: 200px;
  max-width: 250px;
  width: 100%;
  height: 100%;
  background-color: #F6F9FE;
  padding: 16px;
  box-sizing: border-box;
}

/* 面板标题样式 */
.panel-header {
  margin-bottom: 20px;
  font-size: 24px;
}

/* 面板内容区域样式 */
.panel-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
  /* 减去标题高度 */
  font-size: 24px;
  font-weight: bold;
  color: #4C4C4C;
  overflow: hidden;
}

/* 参数容器样式 */
.param-container {
  height: 100%;
  overflow-y: auto;
  width: 100%;
  padding: 4px;
}

/* 无节点选中提示样式 */
.no-node-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #888;
}

/* 参数项样式 */
.param-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  margin-bottom: 10px;
  width: 100%;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 20%;
}

/* 节点名称样式 */
.node-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid #EAEFFC;
  width: 100%;
  text-align: left;
}

/* 选中节点数量提示样式 */
.selected-count {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 15px;
  padding: 5px 0;
  border-bottom: 1px solid #EAEFFC;
}




/* 多值状态样式 */
.multi-value {
  opacity: 0.5;
}

/* 确保标签和输入组件正确对齐 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.ant-input,
.ant-input-number,
.ant-input-number-input,
.ant-input-number-input-wrap {
  width: auto;
  field-sizing: content;
  min-width: 50px;
  max-width: 100px;
  background-color: #EAEFFC;
  font-weight: 600;
}

.ant-input-number .ant-input-number-input {
  width: 20px;
}
</style>
