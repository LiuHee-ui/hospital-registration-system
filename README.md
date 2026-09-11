# 医院门诊挂号管理系统 (Vue 3 SPA 重构版)

基于 Vue 3 + Vite + Pinia + Vue Router 构建的高效门诊挂号全流程管理系统。

## 重构亮点

- **架构升级**：原生 HTML/JS 多页应用全量重构为 Vue 3 单页面应用 (SPA)
- **状态管理**：引入 Pinia + localStorage 解决跨页面/刷新状态丢失问题
- **工程规范**：使用 Axios 统一拦截网络请求，分离 API 与视图逻辑
- **核心功能**：支持四步向导挂号、摄像头 OCR 身份识别、智能导诊及每日号源动态管控

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由管理 | Vue Router (Hash Mode) |
| 网络请求 | Axios |
| 图形识别 | Tesseract.js |

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 生产打包
npm run build

# 4. 预览打包产物
npm run preview
```

## 功能模块

- [x] 登录持久化：刷新页面不丢失登录凭证
- [x] 未登录拦截：直接访问内部 URL 自动重定向至 `/login`
- [x] 向导式挂号：四步完成患者登记、智能分诊、医生选择、确认提交
- [x] 号源管控：实时显示医生剩余号源，支持加急通道
- [x] 状态流转：完成就诊/取消挂号一键操作
- [x] 数据看板：首页展示挂号统计与实时动态

## 版本标签

- `v1.0.0` - 完成 Vue 3 SPA 架构全量重构

## 项目结构

```
hospital-frontend/
├── src/
│   ├── api/           # Axios 请求封装
│   ├── layouts/       # 页面布局组件
│   ├── router/        # Vue Router 配置
│   ├── stores/       # Pinia 状态管理
│   ├── views/        # 页面视图组件
│   └── main.js       # 应用入口
└── dist/             # 生产构建产物
```
