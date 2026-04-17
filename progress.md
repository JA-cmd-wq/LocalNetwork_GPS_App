# LocalNetwork GPS Web App - 项目进度

## 项目概述
基于 STM32 LoRa 局域网的 GPS 位置追踪 PWA 应用，使用高德地图显示三台设备的实时位置和距离。

## 技术栈
- **前端框架**: Vite + React 18 + TypeScript
- **样式**: TailwindCSS v4
- **动画**: framer-motion (Apple 风格过渡)
- **地图**: 高德地图 JS API v2.0 (macaron 风格)
- **通信**: Web Bluetooth API + Web Serial API (已预埋 hooks)
- **存储**: IndexedDB (轨迹存储 + JSON/CSV 导出)

## 硬件架构 (STM32 端)
| 设备 | 芯片 | 通信方式 | GPS | 串口分配 |
|------|------|---------|-----|---------|
| 集中器 | STM32WL55 | LoRa SubGHz | USART1 (PB6/PB7, 9600) | LPUART1 (PA2/PA3, 9600) 调试 |
| 传感器 1 | STM32WL55 | LoRa SubGHz | USART GPS | 类似 |
| 传感器 2 | STM32WL55 | LoRa SubGHz | USART GPS | 类似 |

**GPS 数据格式**: `DEMO_data_gps_t` — `{int32 latitude, int32 longitude, uint8 valid}`，坐标 = 度 × 1,000,000
**坐标系**: LoRa 传输使用 WGS-84 原始坐标；显示前转 GCJ-02 (高德) 或 BD-09 (百度)

## 已完成功能 ✅

### Phase 1: 项目骨架
- [x] Vite + React + TS 初始化
- [x] TailwindCSS v4 + framer-motion 安装配置
- [x] TypeScript 类型定义 (`device.ts`, `web-serial.d.ts`)
- [x] 坐标转换工具 (`coord-transform.ts` — WGS84→GCJ02)
- [x] Haversine 距离计算 + 中文格式化 (米/公里)
- [x] IndexedDB 存储 + JSON/CSV 导出

### Phase 2: UI 组件 (全中文 + Apple 风格)
- [x] **MapView** — 高德地图 macaron 风格，WeChat 共享位置风格头像标记 + 脉冲动画 + 虚线距离线
- [x] **DevicePanel** — 设备卡片列表，显示坐标 + POI 店名 + 信号 + 距离 + 时间
- [x] **ConnectionPanel** — 蓝牙/串口连接弹窗
- [x] **Toolbar** — 轨迹/模拟/导出按钮
- [x] **AlertPanel** — 信号丢失 + 电子围栏告警管理
- [x] **App.tsx** — 主框架，侧边栏 + 地图 + 弹窗，全动画

### Phase 3: 核心功能
- [x] 三设备模拟运动 (集中器C + 传感器1 + 传感器2)
- [x] 实时距离线 + 中点距离标签 (始终显示)
- [x] 反向地理编码 — 每个设备下方显示最近的店名/地标
- [x] **主机/从机模式切换** (Header segmented control)
  - 主机模式: 显示全部 3 台设备 + 所有距离线
  - 从机模式: 隐藏集中器，仅显示 2 传感器 + 传感器间距离
- [x] 高德地图 Key 管理 (首次输入 + 设置弹窗修改)

### Phase 4: 通信 hooks (已预埋，待对接)
- [x] `useBluetooth.ts` — Web Bluetooth BLE 连接/断开/数据接收
- [x] `useSerial.ts` — Web Serial 串口连接/断开/数据接收
- [x] `parseGPSPacket()` — 解析 9 字节 GPS 数据包 (lat_i32 + lon_i32 + valid_u8)

---

## 待完成 🔲

### Phase 5: BLE 真机对接
**需要用户提供的信息**:
1. **蓝牙模块型号** — HM-10? HC-08? 还是其他 BLE 模块?
2. **BLE Service UUID** — 蓝牙模块的服务 UUID
3. **BLE Characteristic UUID** — 读写数据的特征值 UUID
4. **数据协议** — STM32 通过 UART 发给蓝牙模块的数据格式是什么?
   - 方案 A: 直接发 `DEMO_data_gps_t` 二进制 (9 字节: lat_i32 + lon_i32 + valid_u8)
   - 方案 B: 发 JSON 字符串如 `{"lat":34215100,"lon":108900700,"v":1}\n`
   - 方案 C: 自定义帧格式 (帧头 + 设备ID + GPS数据 + 校验)
5. **STM32 端蓝牙相关代码** — 初始化、发送函数等

**对接步骤** (拿到以上信息后):
1. STM32 集中器端: 在主循环中定时通过 LPUART1 输出所有设备 GPS 汇总数据给 BLE 模块
2. Web 端: `useBluetooth.ts` 配置正确的 UUID，解析接收到的数据
3. 替换模拟数据为真实数据流

### Phase 6: PWA + 移动端 ✅ (已完成)
- [x] PWA manifest + Service Worker (手动配置，兼容 Vite 8)
- [x] 添加到主屏幕支持 (Android Chrome + iOS Safari)
- [x] Netlify 部署: **https://lora-gps-tracker.netlify.app**
- [x] Project ID: `33a666a0-6dfe-41de-b654-d795435551a9`
- [ ] 移动端响应式适配 (待优化)
- [ ] 触摸手势优化 (待优化)

**重新部署命令**:
```bash
cd "E:\XAIU\MY_AIGC word\LocalNetwork_GPS_App"
npm run build && netlify deploy --prod --dir=dist
```

---

## 文件结构
```
LocalNetwork_GPS_App/
├── index.html                    # 入口 (lang=zh-CN)
├── vite.config.ts                # Vite 配置
├── tailwind.config.js
├── tsconfig.app.json
├── package.json
├── src/
│   ├── main.tsx                  # React 入口
│   ├── index.css                 # TailwindCSS 导入
│   ├── App.tsx                   # 主应用 (含模式切换、POI、地图Key管理)
│   ├── types/
│   │   ├── device.ts             # 设备/GPS/告警类型定义
│   │   └── web-serial.d.ts       # Web Serial API 类型声明
│   ├── components/
│   │   ├── MapView.tsx           # 高德地图 + 头像标记 + 距离线
│   │   ├── DevicePanel.tsx       # 设备列表 (含 ViewMode 导出)
│   │   ├── ConnectionPanel.tsx   # 蓝牙/串口连接
│   │   ├── Toolbar.tsx           # 工具栏
│   │   └── AlertPanel.tsx        # 告警管理
│   ├── hooks/
│   │   ├── useBluetooth.ts       # Web Bluetooth hook
│   │   ├── useSerial.ts          # Web Serial hook
│   │   └── useReverseGeocode.ts  # 高德逆地理编码
│   └── utils/
│       ├── coord-transform.ts    # WGS84→GCJ02
│       ├── haversine.ts          # 距离计算
│       ├── mock-data.ts          # 模拟数据 (3设备)
│       └── storage.ts            # IndexedDB + 导出
└── progress.md                   # ← 本文件
```

## 运行方式
```bash
cd "E:\XAIU\MY_AIGC word\LocalNetwork_GPS_App"
npm run dev
# 浏览器打开 http://localhost:5173
# 首次使用需输入高德地图 JS API Key
```

## 高德地图 Key
- 控制台: https://console.amap.com
- 应用名: LocalNetworkGPS
- 服务平台: Web端(JS API)
- Key: (已保存在 localStorage `amap_key`)
