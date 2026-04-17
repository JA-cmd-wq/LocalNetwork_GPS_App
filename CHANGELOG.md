# LoRa GPS 更新日志

## v1.9.1 — 2026-04-17 (hotfix)

### 修复 Splash 卡死
- **根因**：v1.9 新加的 App 1s header tick 导致父组件持续 re-render，SplashScreen 的 `useEffect([onFinish])` 依赖每次拿到新函数引用 → timer 被无限重置 → 3200ms 永远跑不完
- **修复**：`SplashScreen.tsx` 用 `useRef` 稳定化 `onFinish`，effect 依赖改空数组 `[]`

---

## v1.9 — 2026-04-17

### 配合固件 v2.9 BT 守卫：离线状态完整可视化

随着固件 v2.9 加入 `g_lora_busy` 守卫后，BT 软串口会在 LoRa 收发时段主动跳过 `$LGPS` 帧，
导致 App 侧偶发丢帧（设计行为）。本版本让 App 对"短暂丢帧"与"设备真的掉线"有明确区分和清晰 UI 反馈。

### 新增
- **设备离线判定** — 超过 **10 秒**未收到任何更新 → 判定为离线（`isDeviceOffline` 常量 `DEVICE_OFFLINE_THRESHOLD_MS = 10000`）
- **设备面板离线样式** — 离线设备头像半透明、红色 `离线` 徽章、`最后位置` 标注、最后更新时间变红警示
- **地图离线标记** — 离线设备保留 marker 在最后已知位置，但变灰 + 停止 pulse 动画 + 标签加 `· 离线` 红字（**以前是直接消失**）
- **距离连线智能过滤** — 只在当前在线的设备之间画距离连线（离线设备数据已过期）
- **顶部在线/总数** — 标题栏计数从 `valid/total` 改为 `online/total`（N/M 每秒刷新）
- **连接状态"无数据"提示** — 蓝牙已连接但 10 秒无 `$LGPS` 帧 → ConnectionPanel 按钮变橙色 `无数据` + 展开面板红色警告条，指导用户检查主机/蓝牙
- **轨迹时间窗淘汰** — 轨迹点保留 **30 分钟**后自动剔除（`TRACK_RETENTION_MS`），配合原有 500 点数量上限

### 改动文件
| 文件 | 改动 |
|------|------|
| `src/utils/device-status.ts` | **新建** — `isDeviceOffline` / `filterTrackByTime` + 阈值常量 |
| `src/types/device.ts` | `ConnectionState` 新增 `dataStale?: boolean` |
| `src/utils/lgps-parser.ts` | `mergeDeviceUpdates` 追加轨迹点时先按时间窗过滤 |
| `src/hooks/useConnectionManager.ts` | 加 `lastFrameTsRef`，每秒检测数据停滞并刷新 `connection.dataStale` |
| `src/components/DevicePanel.tsx` | 离线灰化头像、红色徽章、`最后位置` 文案 |
| `src/components/MapView.tsx` | `createAvatarMarker` 接受 `offline` 参数；离线 marker 保留但灰化 + 无 pulse；距离线只连在线设备；加 1s tick |
| `src/components/ConnectionPanel.tsx` | `无数据` 状态的橙色按钮样式 + 展开面板警告条 |
| `src/App.tsx` | 顶部 N/M 改为在线/总数，加 1s tick 驱动 |
| `package.json` | `version` 1.8.0 → 1.9.0 |
| `android/app/build.gradle` | `versionCode` 8→9, `versionName` "1.8"→"1.9" |

### 与固件 v2.9 的关系
- 固件 v2.9 `g_lora_busy` 守卫降低了 BT UART 对 LoRa 时序的干扰，代价是 BT 丢帧率略升
- App v1.9 通过"10 秒才判离线"吸收了这部分丢帧，单次 BT 守卫（最多 2 秒）不会触发离线
- 只有真正断电/超出 LoRa 范围/蓝牙断连这类长时间失联才会触发离线指示

---

## v1.8 — 2026-04-15

### Apple 风格 UI 全面改版
- **设计系统** — 从 Linear-Inspired 切换为 Apple-Inspired（SF Pro 字体、Apple Blue #007AFF、纯黑背景）
- **毛玻璃材质** — Header / Sidebar 采用 `#1C1C1E` 基底 + `backdrop-saturate(180%)` 模拟 Apple 磨砂玻璃
- **系统语义色** — 全部组件统一使用 Apple 系统色：Green `#30D158`、Red `#FF453A`、Yellow `#FFD60A`
- **安全密钥** — 高德地图 `securityJsCode` 支持，首次输入后自动保存、自动配置 `_AMapSecurityConfig`
- **地图标注** — 字体改为 SF Pro 系统栈，标签背景改为 Apple glass 材质

### 改动文件
| 文件 | 改动 |
|------|------|
| `DESIGN.md` | 完整重写为 Apple 设计规范 |
| `src/index.css` | 字体 Inter → SF Pro 系统栈 |
| `src/App.tsx` | 配色、毛玻璃参数、安全密钥输入 |
| `src/components/SplashScreen.tsx` | Indigo → Apple Blue |
| `src/components/DevicePanel.tsx` | 状态色 Apple 化 |
| `src/components/ConnectionPanel.tsx` | 按钮色 Apple 化 |
| `src/components/AlertPanel.tsx` | 告警色 Apple 化 |
| `src/components/MapView.tsx` | 字体 + 标签背景 + securityConfig |
| `index.html` | theme-color → #000000 |

---

## v2.0 — 2026-03-24

### 新增
- **默认 API Key** — 内置高德地图 Key，新用户无需手动输入即可使用
- **手机端响应式** — 侧边栏改为抽屉覆盖模式，Header 紧凑布局，汉堡菜单
- **移动端触摸优化** — 禁止页面缩放、消除点击高亮、刘海屏安全区适配
- **选中自动收起** — 手机端点击设备后侧边栏自动关闭，回到地图

### 改动文件
| 文件 | 改动 |
|------|------|
| `src/App.tsx` | 默认 Key、isMobile 检测、侧边栏抽屉模式、Header 响应式 |
| `src/index.css` | touch-action、safe-area-inset |
| `index.html` | viewport 禁止缩放 |

---

## v1.0 — 2026-03-24

### 功能
- 高德地图实时显示集中器 + 传感器位置
- WGS-84 → GCJ-02 坐标自动转换
- 设备间距离计算与连线标注
- 反地理编码 POI 显示
- BLE / USB 串口连接（Web Bluetooth + Web Serial）
- $LGPS 协议解析（H/S/P 三种模式）
- 轨迹记录与显示
- 告警系统（信号丢失 + 电子围栏）
- 数据导出 JSON / CSV
- PWA 支持（离线缓存、添加到主屏幕）
- 模拟数据演示模式

### 技术栈
- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 + Framer Motion
- 高德地图 JS API 2.0

### 部署
- **线上地址**: https://lora-gps-tracker.netlify.app
