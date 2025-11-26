<template>
    <div id="panel">
        <div id="panel-header">
            <h2>属性</h2>
        </div>
        <div id="panel-content">
            <!-- 遍历生成，如果有多个节点就显示多个属性，如果属性名相同，就合并显示，输入框显示“多值”，可以一同修改。如果没有节点就显示“选择一个节点以修改属性” -->
            <div v-if="selectedNodes.length > 0" class="param-container">
                <!-- 显示选中节点数量 -->
                <div class="selected-count">
                    已选择 {{ selectedNodes.length }} 个节点
                </div>
                
                <!-- 如果只有一个节点，显示节点名称 -->
                <h3 v-if="selectedNodes.length === 1" class="node-name">{{ selectedNodes[0].name }}</h3>
                
                <!-- 使用NConfigProvider应用主题 -->
                <n-config-provider :theme-overrides="themeOverrides">
                    <!-- 遍历合并后的参数 -->
                    <div v-for="(param, paramIndex) in mergedParams" :key="paramIndex" class="param-item">
                            <label>{{ param.label }}</label>
                            <!-- 根据参数类型渲染不同的输入组件 -->
                            <div class="input-wrapper">
                                <!-- 布尔类型使用开关组件 -->
                                <n-switch
                                    v-if="param.type === 'boolean'"
                                    v-model:value="param.default"
                                    @update:value="handleParamChange(param, $event)"
                                    :class="{ 'multi-value': param.isMultiValue }"
                                />
                                <!-- 数字类型使用数字输入框 -->
                                <n-input-number
                                    v-else-if="param.type === 'number'"
                                    v-model:value="param.default"
                                    @update:value="handleParamChange(param, $event)"
                                    :step="'any'"
                                    :class="{ 'multi-value': param.isMultiValue }"
                                />
                                <!-- 字符串类型使用文本输入框 -->
                                <n-input
                                    v-else-if="param.type === 'string'"
                                    v-model:value="param.default"
                                    @update:value="handleParamChange(param, $event)"
                                    :class="{ 'multi-value': param.isMultiValue }"
                                />
                                <!-- 未知类型使用文本输入框 -->
                                <n-input
                                    v-else
                                    v-model:value="param.default"
                                    @update:value="handleParamChange(param, $event)"
                                    placeholder="未知类型"
                                    :class="{ 'multi-value': param.isMultiValue }"
                                />
                                <span v-if="param.isMultiValue" class="multi-value-indicator">多值</span>
                            </div>
                        </div>
                </n-config-provider>
            </div>
            <div v-else id="no-node-selected">
                <p>选择节点<br>修改属性</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
#panel {
    top: 0;
    right: 0;
    min-width: 200px;
    max-width: 300px;
    width: 40%;
    height: 100%;
    background-color: #F6F9FE;
    padding: 16px;
}

#panel-header {
    margin-bottom: 20px;
    font-size: 24px;
}

#panel-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 24px;
    font-weight: bold;
    color: #4C4C4C;
    flex-wrap: nowrap;
    align-items: flex-start;
    align-content: space-between;
}

.param-container {
    height: 100%;
    overflow-y: auto;
    width: 100%;
}

#no-node-selected {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    color: #888;
}

.param-item-container {
    margin-bottom: 20px;
    width: 100%;
}

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
}

input {
    background-color: #EAEFFC;
    color: #636363;
    font-weight: 600;
    margin-left: 10px;
    width: 100px;
    height: 30px;
    border: none;
    border-radius: 8px;
}

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

.selected-count {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin-bottom: 15px;
    padding: 5px 0;
    border-bottom: 1px solid #EAEFFC;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}



.multi-value-indicator {
    position: absolute;
    left: 20px;
    color: #636363;
    font-weight: bold;
    pointer-events: none;
}

input {
    height: 30px;
}
</style>

<script setup>
import { blueprintStore } from '@/stores/blueprint';
import { ref, watch, computed } from 'vue';
import { NSwitch, NInputNumber, NInput, NConfigProvider } from 'naive-ui';

// 自定义主题配置
const themeOverrides = {
  common: {
    primaryColor: '#8C92DF',
    borderRadius: '4px' // 中圆角
  },
  Input: {
    borderRadius: '4px', // 输入框中圆角
    border: '1px solid #8C92DF', // 输入框边框颜色
    hoverBorder: '1px solid #8C92DF', // 输入框 hover 边框颜色
    focusBorder: '1px solid #8C92DF' // 输入框 focus 边框颜色
  },
  InputNumber: {
    borderRadius: '4px', // 数字输入框中圆角
    border: '1px solid #8C92DF', // 数字输入框边框颜色
    hoverBorder: '1px solid #8C92DF', // 数字输入框 hover 边框颜色
    focusBorder: '1px solid #8C92DF' // 数字输入框 focus 边框颜色
  },
  Switch: {
    railColorActive: '#8C92DF' // 开关激活状态轨道颜色
  }
};

const selectedNodes = ref([]);

watch(() => blueprintStore.getSelectedNodes(), (newSelectedNodes) => {
    selectedNodes.value = newSelectedNodes;
});

// 转换参数值为正确的类型
const convertParamValue = (param, value) => {
    // 如果是多值状态，直接返回
    if (value === '多值') return value;
    
    // 根据参数类型转换值
    if (param.type === 'number') {
        // 转换为数字类型
        return parseFloat(value);
    } else if (param.type === 'boolean') {
        // 转换为布尔类型
        return value === true || value === 'true';
    }
    // 其他类型保持不变
    return value;
};

// 计算属性：合并相同参数名的参数
const mergedParams = computed(() => {
    if (selectedNodes.value.length === 0) return [];
    
    // 如果只有一个节点，直接返回该节点的参数
    if (selectedNodes.value.length === 1) {
        // 检查节点是否有params属性，如果没有则返回空数组
        const node = selectedNodes.value[0];
        if (!node.params) return [];
        
        return node.params.map(param => {
            const convertedDefault = convertParamValue(param, param.default);
            return {
                ...param,
                nodes: [node],
                isMultiValue: false,
                params: [param], // 添加params属性，确保handleParamChange函数能正常工作
                default: convertedDefault,
                originalValue: convertedDefault // 存储原始值，用于恢复
            };
        });
    }
    
    // 提取所有参数，按参数名分组
    const paramGroups = {};
    
    selectedNodes.value.forEach(node => {
        // 检查节点是否有params属性，如果没有则跳过
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
    
    // 转换为数组，并检查是否为多值
    return Object.values(paramGroups).map(group => {
        // 检查所有值是否相同
        const allValuesSame = group.values.every(val => val === group.values[0]);
        
        const defaultValue = allValuesSame ? group.values[0] : '多值';
        const convertedDefault = convertParamValue(group, defaultValue);
        const convertedOriginal = convertParamValue(group, allValuesSame ? group.values[0] : '多值');
        
        return {
            label: group.label,
            type: group.type,
            default: convertedDefault,
            isMultiValue: !allValuesSame,
            nodes: group.nodes,
            params: group.params,
            originalValue: convertedOriginal // 存储原始值，用于恢复
        };
    });
});

// 验证输入值是否有效
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
    
    // 根据参数类型进行验证
    if (param.type === 'number') {
        // 验证是否为有效的数字
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    // 对于字符串类型，只要不为空就有效
    if (param.type === 'string') {
        return true;
    }
    
    // 其他类型默认有效
    return true;
};

// 处理参数修改
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
