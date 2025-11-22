<template>
    <div id="panel">
        <div id="panel-header">
            <h2>属性</h2>
        </div>
        <div id="panel-content">
            <!-- 遍历生成，如果有多个节点就显示多个属性，如果属性名相同，就合并显示，输入框显示“多值”，可以一同修改。如果没有节点就显示“选择一个节点以修改属性” -->
            <div v-if="selectedNodes.length > 0" class="param-container">
                <div v-for="(node, index) in selectedNodes" :key="index" class="param-item-container">
                    <div v-for="(param, paramIndex) in node.params" :key="paramIndex" class="param-item">
                        <div v-if="paramIndex === 0" class="param-item">
                            <label>{{ param.label }}</label>
                            <input v-model="param.default" type="text" />
                        </div>
                        <div v-else class="param-item">
                            <label>{{ param.label }}</label>
                            <input v-model="param.default" type="text" />
                        </div>
                    </div>
                </div>
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

input {
    height: 30px;
}
</style>

<script setup>
import { blueprintStore } from '@/stores/blueprint';
import { ref, watch } from 'vue';

const selectedNodes = ref([]);

watch(() => blueprintStore.getSelectedNodes(), (newSelectedNodes) => {
    selectedNodes.value = newSelectedNodes;
});
</script>
