# 炼丹蓝图前端

这是炼丹蓝图的 Vue 前端。它负责画布、节点列表、连线、参数面板、Tensor 显示和训练面板。

前端和后端是两个独立项目：

- `frontend`：Vue + Vite 编辑器
- `backend`：Python + PyTorch WebSocket 服务

## 开始使用

需要先安装：

- Node.js `20.19+` 或 `22.12+`
- pnpm `10+`
- Python `3.12+`
- uv

安装前端依赖：

```sh
pnpm install
```

启动前端：

```sh
pnpm dev --host 127.0.0.1 --port 5173
```

再启动后端：

```sh
cd ../backend
uv run python main.py
```

打开：<http://127.0.0.1:5173>

前端通过以下地址连接后端：

```text
ws://127.0.0.1:8765
```

## 使用流程

1. 从左侧节点列表把节点拖入画布。
2. 从输出端口拖到输入端口，组成数据流。
3. 点击节点并修改属性。
4. 点击顶部“运行一次”查看一次 Tensor 传播。
5. 点击“持续运行”反复生成随机输入。
6. 把目标分支连接到 `Output` 的目标端口后，可使用训练面板训练。
7. 在训练面板中查看 Loss 曲线和各节点梯度。

## 节点规则

节点由后端注册表统一提供。前端的
`src/constants/registry.json` 是后端不可用时的离线副本。

新增或修改后端节点后，在 `backend` 目录运行：

```sh
uv run python export_registry.py
```

所有节点都通过统一的 `@node` 注册，并使用输入端口、输出端口、参数和 `compute(input)` 执行。

## 验证

运行前端测试：

```sh
pnpm test
```

生成生产文件：

```sh
pnpm build
```
