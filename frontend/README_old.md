# Odin DeFi 前端应用

## 项目概述

这是一个基于 React + TypeScript + Vite 构建的 DeFi 应用前端，专为 Massa 区块链设计。

## 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Styled Components** - CSS-in-JS 样式解决方案
- **Massa Wallet SDK** - 区块链钱包集成

## 项目结构

```
frontend/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   ├── types.ts             # TypeScript 类型定义
│   ├── utils/
│   │   └── massaWallet.ts   # Massa 钱包工具函数
│   └── assets/              # 静态资源文件
├── public/                  # 公共资源
└── dist/                    # 构建输出
```

## 核心功能

### 1. 钱包连接
- **Massa Station** - 浏览器扩展钱包连接
- **Massa Wallet** - 私钥连接（开发测试用）
- **Ledger** - 硬件钱包（即将推出）

### 2. 用户界面
- **登录页面** - 品牌展示和钱包选择
- **主页** - 钱包概览和功能入口
- **响应式设计** - 支持桌面和移动设备

### 3. 钱包管理
- 多账户选择
- 余额显示
- 地址复制
- 网络检测（Buildnet/Mainnet）

## 开发指南

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## 设计特点

### 视觉风格
- **深色主题** - 主色调 #0A1226
- **品牌色彩** - 青色 #00F5FF，金色 #FFD700
- **字体** - Inter 和 Liter 字体
- **动画效果** - 流畅的页面过渡和交互反馈

### 用户体验
- **简洁界面** - 最小化设计，专注功能
- **直观操作** - 清晰的导航和状态提示
- **错误处理** - 友好的错误信息和恢复机制

## 钱包集成

### Massa Station 连接
- 自动检测可用账户
- 实时网络状态监控
- 账户切换功能

### 私钥连接
- 支持Massa私钥连接到buildnet
- 仅用于开发测试
- 安全提示和验证

## 状态管理

应用使用 React Hooks 进行状态管理：
- 钱包连接状态
- 用户界面状态
- 错误处理状态

## 构建配置

- **TypeScript** - 严格类型检查
- **ESLint** - 代码质量检查
- **Vite** - 快速构建和热重载
- **项目引用** - 模块化 TypeScript 配置

## 部署

构建完成后，`dist` 目录包含可部署的静态文件：
- 压缩的 JavaScript 和 CSS
- 优化的静态资源
- 生产就绪的 HTML

## 注意事项

- 私钥连接仅用于开发环境
- 生产环境建议使用 Massa Station
- 定期更新依赖包
- 遵循 TypeScript 严格模式
