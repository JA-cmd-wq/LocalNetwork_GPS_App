# LoRa GPS 更新日志

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
