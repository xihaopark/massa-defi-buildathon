# Step1 DeFi System - Buildnet监控界面详细说明文档

**文档版本**: v2.0  
**创建时间**: 2025年1月20日  
**适用界面**: Step1 DeFi Buildnet Real-Time Monitor  
**数据来源**: 100% Massa Buildnet真实数据  

---

## 📋 目录

1. [系统概述](#系统概述)
2. [界面总体架构](#界面总体架构)
3. [账户状态模块](#账户状态模块)
4. [ASC执行状态模块](#asc执行状态模块)
5. [合约状态模块](#合约状态模块)
6. [DEX流动性模块](#dex流动性模块)
7. [ASC配置模块](#asc配置模块)
8. [系统健康模块](#系统健康模块)
9. [实时日志模块](#实时日志模块)
10. [数据刷新机制](#数据刷新机制)
11. [操作指南](#操作指南)
12. [故障排查](#故障排查)

---

## 系统概述

### 核心特性

**Step1 Buildnet监控界面**是一个专门设计用于监控Massa Buildnet上Step1 DeFi系统运行状态的实时监控工具。

### 关键区别

| 特性 | 旧版本 | 新版本 (当前) |
|------|--------|--------------|
| 数据来源 | 混合（真实+模拟） | 100% Buildnet真实数据 |
| 价格图表 | 模拟市场数据 | 已移除（无真实价格源） |
| 市场指标 | 随机生成 | 已移除（无真实市场数据） |
| 交易性能 | 部分模拟 | 基于真实执行周期计算 |
| 更新频率 | 实时模拟 | 30秒真实数据刷新 |

### 设计理念

- **真实性优先**: 只显示可验证的区块链数据
- **透明度**: 清晰显示所有数据的来源和更新时间
- **实用性**: 专注于系统运维和监控需求
- **简洁性**: 移除所有非必要的装饰性元素

---

## 界面总体架构

### 布局结构

```
┌─────────────────────────────────────────────────┐
│              Step1 DeFi System                  │
│         Buildnet Real-Time Monitor              │
│     [●] Connected to Massa Buildnet             │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Account     │ │ ASC Status  │ │ Contract    ││
│ │ Status      │ │             │ │ Status      ││
│ └─────────────┘ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ DEX         │ │ ASC Config  │ │ System      ││
│ │ Liquidity   │ │             │ │ Health      ││
│ └─────────────┘ └─────────────┘ └─────────────┘│
│ ┌───────────────────────────────────────────────┤
│ │          Real-Time Logs                       │
│ └───────────────────────────────────────────────┤
└─────────────────────────────────────────────────┘
```

### 颜色方案

- **主色调 (#3b82f6)**: 用于重要数值和按钮
- **成功色 (#10b981)**: 表示正常运行状态
- **警告色 (#f59e0b)**: 表示待处理或警告状态
- **错误色 (#ef4444)**: 表示错误或停止状态
- **背景色**: 深色主题，减少视觉疲劳

---

## 账户状态模块

### 位置：左上角第一个卡片

### 显示内容

#### 1. Address (账户地址)
- **显示值**: `AU12bZJtxqWUgNtJ66MrmWbSFRgn6UrezqJahr5b62vEgVioMsmJM`
- **数据来源**: 硬编码的部署账户地址
- **说明**: 这是部署Step1系统的主账户地址

#### 2. Balance (账户余额)
- **显示格式**: `XXX.XXXX MAS`
- **数据来源**: 通过`get_addresses` RPC调用获取
- **更新方式**: 
  ```javascript
  rpcCall('get_addresses', [['AU12bZJtxqWUgNtJ66MrmWbSFRgn6UrezqJahr5b62vEgVioMsmJM']])
  ```
- **重要性**: 监控账户资金变化，验证交易执行

#### 3. Last Updated (最后更新时间)
- **显示格式**: `HH:MM:SS`
- **数据来源**: JavaScript本地时间
- **说明**: 显示最后一次成功获取数据的时间

### 操作按钮

- **Refresh**: 立即刷新账户余额数据

---

## ASC执行状态模块

### 位置：中上角第二个卡片

### 显示内容

#### 1. Status (ASC状态)
- **可能值**:
  - `ACTIVE` (绿色): ASC正在运行，下次执行时间已设定
  - `PENDING` (黄色): 执行时间已过，等待执行
  - `ERROR` (红色): ASC遇到错误
- **判断逻辑**: 基于下次执行时间与当前时间的比较

#### 2. Execution Cycles (执行周期数)
- **数据来源**: 合约datastore中的`cycle_count`
- **获取方式**:
  ```javascript
  key: [99, 121, 99, 108, 101, 95, 99, 111, 117, 110, 116] // "cycle_count"
  ```
- **含义**: ASC自动执行的总次数

#### 3. Next Execution (下次执行时间)
- **数据来源**: 合约datastore中的`next_execution_time`
- **格式转换**: Unix时间戳转换为本地时间
- **重要性**: 判断ASC是否正常调度

#### 4. Time Until Next (距离下次执行)
- **计算方式**: `next_execution_time - current_time`
- **显示格式**: `Xm Ys` 或 `Overdue`
- **用途**: 快速判断ASC执行状态

### 操作按钮

- **Force Cycle**: 提示用户使用命令行工具
- **Emergency Stop**: 提示用户使用命令行工具

---

## 合约状态模块

### 位置：右上角第三个卡片

### 显示内容

#### 1. Main Controller (主控制器余额)
- **合约地址**: `AS12FWRKui3k2T8pi7pjF4KxUnueGWixnj85kn9j9EXADt6NvAXY1`
- **显示格式**: `X.XXXX MAS`
- **用途**: 监控合约运行成本

#### 2. DEX Contract (DEX合约余额)
- **合约地址**: `AS12Da1qWr1ndnTZrkr38DeWeoH5gFcRcqnripYhKy7UkPggX72ME`
- **用途**: 监控DEX操作费用

#### 3. Vault Contract (Vault合约余额)
- **合约地址**: `AS12shXJLaEJiv8da5Bc35b5xq9r9szkar9i3BtnMMKnd2fjJHGad`
- **用途**: 监控资金存储合约

#### 4. Total Deployed (总部署合约数)
- **固定值**: `5 contracts`
- **包含**: 主控制器 + 3个观察线程 + 1个共享合约

---

## DEX流动性模块

### 位置：左下角第四个卡片

### 显示内容

#### 1. Reserve A (储备金A)
- **数据来源**: DEX合约datastore中的`RA`
- **获取方式**:
  ```javascript
  key: [82, 65] // "RA"
  ```
- **数据类型**: 整数或字符串形式的数字

#### 2. Reserve B (储备金B)
- **数据来源**: DEX合约datastore中的`RB`
- **获取方式**:
  ```javascript
  key: [82, 66] // "RB"
  ```

#### 3. Price (价格比率)
- **计算公式**: `Reserve B / Reserve A`
- **显示格式**: 保留4位小数
- **特殊情况**: 无流动性时显示"No liquidity"

#### 4. Total Liquidity (总流动性)
- **计算公式**: `√(Reserve A × Reserve B)`
- **经济含义**: 几何平均数表示流动性深度

---

## ASC配置模块

### 位置：中下角第五个卡片

### 显示内容

#### 1. Execution Interval (执行间隔)
- **数据来源**: `asc_config`的第一个参数
- **默认值**: `120 seconds`
- **含义**: ASC自动执行的时间间隔

#### 2. Max Gas per Cycle (每周期最大Gas)
- **数据来源**: `asc_config`的第二个参数
- **用途**: 限制单次执行的Gas消耗

#### 3. Auto Execution (自动执行)
- **数据来源**: `asc_config`的第四个参数
- **可能值**: `Enabled` 或 `Disabled`
- **重要性**: 决定ASC是否自动运行

#### 4. Emergency Stopped (紧急停止)
- **数据来源**: `asc_config`的第五个参数
- **可能值**: `Yes` 或 `No`
- **用途**: 紧急情况下停止所有自动操作

### 配置格式

ASC配置存储格式：`interval|maxGas|maxFee|autoExec|emergencyStopped`
例如：`120|1000|0.01|true|false`

---

## 系统健康模块

### 位置：右下角第六个卡片

### 显示内容

#### 1-3. Thread #0/1/2 (观察线程状态)
- **线程地址**:
  - Thread #0: `AS12Pm77Wf5pVkhvXGcGeMKXdm5HssgkWvFRC1xPVDtrrygQgaeXw`
  - Thread #1: `AS1Xo9XY1kxQD8Mqxri82JNxk97PXPazLZnnnD4foBUjBVMwL2AW`
  - Thread #2: `AS124TYaaap2mH3ZgPyhkTATNhS9X4kHY8tqqxe2FLAJZ8awJFaMZ`
- **状态显示**:
  - `Active (X.XXXX MAS)`: 线程已部署并有余额
  - `Not deployed`: 线程未部署
- **颜色编码**: 绿色=活跃，红色=未部署

#### 4. Last Error (最后错误)
- **当前实现**: 固定显示"None"
- **未来扩展**: 可从错误日志datastore读取

#### 5. Auto-refresh timer (自动刷新计时器)
- **倒计时**: 30秒
- **用途**: 显示下次自动刷新的剩余时间

---

## 实时日志模块

### 位置：底部横跨整个宽度

### 日志格式
```
[HH:MM:SS] 日志内容
```

### 日志类型

#### 1. 系统日志
- `🚀 Initializing Buildnet Monitor...`
- `✅ Monitor initialized - displaying real blockchain data only`

#### 2. 数据更新日志
- `📊 Loading data from Massa Buildnet...`
- `✅ All data loaded successfully`

#### 3. 状态变更日志
- `💰 Account balance: XXX.XXXX MAS`
- `🤖 ASC Status: X cycles completed, next execution at HH:MM:SS`

#### 4. 错误日志
- `❌ Failed to load account balance: error message`
- `⚠️ DEX has no liquidity`

### 日志管理

- **容量限制**: 保留最新50条日志
- **自动滚动**: 新日志自动滚动到底部
- **操作按钮**:
  - **Clear**: 清空当前显示的日志
  - **Export**: 导出日志为文本文件

---

## 数据刷新机制

### 自动刷新

#### 刷新间隔
- **默认**: 30秒
- **原因**: 平衡数据实时性和网络负载

#### 刷新内容
每次刷新会并行加载所有模块数据：
```javascript
Promise.all([
    loadAccountData(),
    loadASCStatus(),
    loadContractBalances(),
    loadDEXData(),
    loadASCConfig(),
    loadThreadStatus()
])
```

### 手动刷新

- **账户余额**: 点击Refresh按钮立即更新
- **全局刷新**: 刷新页面重新加载所有数据

### 错误处理

- **网络错误**: 显示错误信息，保留上次有效数据
- **数据解析错误**: 记录到日志，显示默认值
- **超时处理**: 使用浏览器默认超时设置

---

## 操作指南

### 监控ASC执行

1. **检查ASC状态标签**
   - 绿色`ACTIVE`: 系统正常
   - 黄色`PENDING`: 需要关注，可能需要手动触发
   - 红色`ERROR`: 需要立即处理

2. **查看执行周期数**
   - 数字增长表示ASC正在执行
   - 长时间不变可能表示系统停止

3. **验证下次执行时间**
   - 应该在未来2分钟内（默认120秒间隔）
   - "Overdue"表示系统可能卡住

### 资金监控

1. **账户余额变化**
   - 每次执行会消耗少量Gas
   - 大幅下降可能表示异常

2. **合约余额检查**
   - 确保所有合约有足够余额运行
   - 低于0.1 MAS时需要充值

### 使用命令行工具

界面中的某些操作需要使用命令行：

```bash
# 强制执行一次周期
npm run force-cycle

# 紧急停止ASC
npm run emergency-stop

# 恢复ASC执行
npm run resume

# 重新初始化ASC
npm run init-asc
```

---

## 故障排查

### 常见问题

#### 1. ASC状态显示"PENDING"或"Overdue"

**可能原因**:
- ASC执行被阻塞
- Gas不足
- 配置错误

**解决方案**:
1. 运行 `npm run force-cycle` 手动触发
2. 检查账户和合约余额
3. 运行 `npm run init-asc` 重新初始化

#### 2. 所有数据显示"Error"或"Loading..."

**可能原因**:
- 网络连接问题
- RPC节点不可用
- 浏览器缓存问题

**解决方案**:
1. 检查网络连接
2. 刷新页面（Ctrl+F5强制刷新）
3. 检查浏览器控制台错误

#### 3. DEX显示"No liquidity"

**可能原因**:
- DEX合约未初始化
- 储备金为0

**解决方案**:
- 需要通过合约调用添加流动性
- 这不影响ASC主要功能

#### 4. Thread显示"Not deployed"

**可能原因**:
- 观察线程合约未部署
- 地址配置错误

**解决方案**:
- 运行完整的部署流程
- 检查addresses.json配置

### 日志分析

查看实时日志可以帮助诊断问题：

1. **查找错误标记**: 寻找❌开头的日志
2. **检查时间序列**: 确认操作按预期顺序执行
3. **导出详细日志**: 使用Export功能保存完整日志

---

## 技术细节

### RPC调用示例

#### 获取地址信息
```javascript
await rpcCall('get_addresses', [['ADDRESS_HERE']])
```

#### 获取Datastore条目
```javascript
await rpcCall('get_datastore_entries', [[{
    address: 'CONTRACT_ADDRESS',
    key: [ASCII码数组] // 键的ASCII编码
}]])
```

### 数据编码

- **字符串存储**: ASCII字节数组
- **数字存储**: 字符串形式或小端序字节
- **布尔值**: "true"/"false"字符串

### 浏览器兼容性

- **推荐**: Chrome/Edge最新版本
- **支持**: Firefox, Safari
- **要求**: JavaScript启用，支持ES6+

---

## 总结

Step1 Buildnet监控界面提供了一个**完全基于真实区块链数据**的监控解决方案。通过移除所有模拟数据，界面现在能够准确反映系统在Massa Buildnet上的实际运行状态。

### 核心价值

1. **真实性**: 每个数据点都可以在区块链上验证
2. **实时性**: 30秒自动刷新确保数据时效性
3. **实用性**: 专注于运维需要的关键指标
4. **可靠性**: 错误处理和日志记录便于故障排查

### 使用建议

- 定期检查ASC执行状态
- 监控账户余额变化
- 关注系统日志中的异常
- 配合命令行工具进行操作

---

**文档完成时间**: 2025年1月20日  
**版本**: v2.0  
**适用系统**: Step1 DeFi Buildnet Monitor  

*本文档详细描述了基于100%真实区块链数据的监控界面，为Step1 DeFi系统的运维提供完整指南。*