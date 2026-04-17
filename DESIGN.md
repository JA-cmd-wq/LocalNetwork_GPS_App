# LoRa GPS — Apple-Inspired Design System

## 1. Visual Theme & Atmosphere

Apple 深色模式的设计哲学：界面退隐为背景，内容本身即焦点。纯黑画布上，毛玻璃层级构建空间感，单一蓝色强调色赋予每个可交互元素清晰的视觉标识。这不是装饰性的暗色主题，而是以沉浸感和精确度为核心的工具界面。

GPS 追踪作为地图密集型应用，深色背景降低视觉干扰，让地图和坐标数据成为绝对主角。毛玻璃 Header 和 Sidebar 悬浮于地图之上，既保持信息可及，又不遮蔽空间感知。

**Key Characteristics:**
- 纯黑背景 (`#000000`) 配合 Apple 系统级毛玻璃材质
- 单一强调色: Apple Blue (`#007AFF`)，仅用于可交互元素
- SF Pro 字体系统，光学尺寸自动适配
- 紧凑的标题行高 (1.07-1.14)，高效的信息密度
- 圆角层级体系: 从 6px 微元素到 14px 面板
- 深度通过材质（毛玻璃）和透明度表达，而非阴影

## 2. Color Palette & Roles

### Primary Backgrounds
- `--bg-base`: `#000000` (纯黑，地图画布与主背景)
- `--bg-elevated`: `#1C1C1E` (Apple systemGray6-dark，卡片/面板)
- `--bg-secondary`: `#2C2C2E` (Apple systemGray5-dark，次级表面)
- `--bg-tertiary`: `#3A3A3C` (Apple systemGray4-dark，输入框)

### Glass Materials
- `--glass-thick`: `rgba(28, 28, 30, 0.80)` + `backdrop-filter: saturate(180%) blur(20px)` (Header, Navigation)
- `--glass-regular`: `rgba(28, 28, 30, 0.60)` + `backdrop-filter: blur(20px)` (Sidebar)
- `--glass-thin`: `rgba(28, 28, 30, 0.40)` + `backdrop-filter: blur(10px)` (Overlay, Toast)

### Interactive (Apple Blue)
- `--accent`: `#007AFF` (Apple systemBlue，主操作按钮、开关)
- `--accent-hover`: `#0A84FF` (悬停/高亮状态)
- `--accent-subtle`: `rgba(0, 122, 255, 0.15)` (选中行背景、激活态填充)
- `--accent-muted`: `rgba(0, 122, 255, 0.08)` (微弱提示)

### Text (Dark Mode)
- `--text-primary`: `#FFFFFF` (标题、强调文字)
- `--text-secondary`: `rgba(235, 235, 245, 0.60)` (Apple secondaryLabel-dark，正文)
- `--text-tertiary`: `rgba(235, 235, 245, 0.30)` (Apple tertiaryLabel-dark，占位/禁用)
- `--text-quaternary`: `rgba(235, 235, 245, 0.18)` (Apple quaternaryLabel-dark，装饰性)

### Semantic
- `--success`: `#30D158` (Apple systemGreen-dark，已连接/有效)
- `--warning`: `#FFD60A` (Apple systemYellow-dark，搜索中)
- `--danger`: `#FF453A` (Apple systemRed-dark，告警/断开)
- `--orange`: `#FF9F0A` (Apple systemOrange-dark，信号弱)

### Separators
- `--separator`: `rgba(84, 84, 88, 0.65)` (Apple separator-dark)
- `--separator-opaque`: `#38383A` (Apple opaqueSeparator-dark)

### Fills
- `--fill-primary`: `rgba(120, 120, 128, 0.36)` (Apple systemFill-dark，toggle 轨道)
- `--fill-secondary`: `rgba(120, 120, 128, 0.32)` (次级填充)
- `--fill-tertiary`: `rgba(120, 120, 128, 0.24)` (三级填充)

## 3. Typography Rules

### Font Family
- **Primary**: `SF Pro Display`, `-apple-system`, `BlinkMacSystemFont`, `Helvetica Neue`, `Arial`, `sans-serif`
- **Body**: `SF Pro Text` (19px 及以下自动切换)
- **Mono**: `SF Mono`, `ui-monospace`, `Menlo`, `monospace` (坐标、EUI、RSSI 数值)

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Page Title | 28px | 700 (Bold) | 1.14 | 0.196px | 闪屏标题 "LoRa GPS" |
| Section Header | 20px | 600 (Semibold) | 1.20 | 0.15px | 面板标题 "全部设备" |
| Card Title | 17px | 600 (Semibold) | 1.24 | -0.374px | 设备名称 |
| Body | 15px | 400 (Regular) | 1.47 | -0.234px | 坐标数据、描述文字 |
| Caption | 13px | 400 (Regular) | 1.38 | -0.078px | 次级信息、RSSI/SNR |
| Caption Bold | 13px | 600 (Semibold) | 1.38 | -0.078px | 强调标签 |
| Micro | 11px | 400 (Regular) | 1.27 | 0.066px | 时间戳、设备数量 |
| Micro Bold | 11px | 600 (Semibold) | 1.27 | 0.066px | 状态标签 "主机/从机" |
| Mono Data | 13px | 500 (Medium) | 1.33 | 0 | EUI 地址、坐标数字 |

### Principles
- **光学尺寸**: 20px 以上使用 SF Pro Display，19px 及以下使用 SF Pro Text，无需手动切换
- **负字间距**: 所有正文级别应用负 letter-spacing (Apple 标准)
- **权重克制**: 日常使用 400/600，700 仅用于页面级标题
- **Tabular Nums**: 所有数值使用 `font-variant-numeric: tabular-nums` 防止宽度跳动

## 4. Component Stylings

### Header Bar (毛玻璃导航)
- Background: `var(--glass-thick)` — `rgba(28,28,30,0.80)` + `saturate(180%) blur(20px)`
- Height: 48px (紧凑)
- Border-bottom: `0.5px solid var(--separator)`
- Logo: 28x28px 圆角图标 + App 名称 17px Semibold
- 模式切换 (主机/从机): Segmented Control 样式，`var(--fill-tertiary)` 背景，激活项 `var(--bg-elevated)` + 微阴影

### Sidebar (设备面板)
- Background: `var(--glass-regular)` — `rgba(28,28,30,0.60)` + `blur(20px)`
- Width: 300px (桌面) / 85vw max 320px (移动端)
- Border-right: `0.5px solid var(--separator)`
- Section header: 11px Semibold uppercase `var(--text-tertiary)` tracking-widest
- 移动端: 左侧滑入 + 半透明遮罩

### Device Card (设备卡片)
- Background: `var(--bg-elevated)` (`#1C1C1E`)
- Radius: 12px
- Padding: 14px 16px
- Border: none (Apple 风格不使用边框)
- 选中态: `var(--accent-subtle)` 背景 + 左侧 3px `var(--accent)` 指示条
- 悬停: background 过渡到 `var(--bg-secondary)`
- 状态指示灯: 8px 圆形，`var(--success)` 脉冲动画 (有效) / `var(--text-tertiary)` 静态 (无效)

### Dialog / Modal
- Overlay: `rgba(0, 0, 0, 0.50)` + `backdrop-filter: blur(8px)`
- Panel: `var(--bg-elevated)` + `backdrop-blur-xl`
- Radius: 14px
- Padding: 20px
- Shadow: `0 25px 50px rgba(0, 0, 0, 0.50)`
- 按钮组: 水平排列，间距 8px

### Buttons

**Primary (CTA)**
- Background: `var(--accent)` (`#007AFF`)
- Text: `#FFFFFF`, 15px, Semibold
- Padding: 10px 20px
- Radius: 10px
- Active: `scale(0.97)`, background `var(--accent-hover)`
- Disabled: `var(--fill-tertiary)` background, `var(--text-tertiary)` text

**Secondary**
- Background: `var(--fill-tertiary)` (`rgba(120,120,128, 0.24)`)
- Text: `var(--accent)`, 15px, Semibold
- Radius: 10px
- Active: `scale(0.97)`, background `var(--fill-secondary)`

**Tool Button (Toolbar)**
- Background: `var(--fill-tertiary)` / 激活态 `var(--accent-subtle)`
- Text: `var(--text-secondary)` / 激活态 `var(--accent)`
- Radius: 8px
- Padding: 6px 10px
- Active press: `scale(0.92)`

### Connection Indicator
- 已连接: `var(--success)` 圆点 + 脉冲动画 + "实时模式" pill
- 断开: `var(--text-tertiary)` 静态圆点
- Pill: `var(--success)` 背景 90% 不透明度, 12px 圆角, 白色文字

### Alert Panel
- 触发态: 左侧 `var(--danger)` 指示条
- 静默态: `var(--bg-elevated)` 标准卡片
- 图标: `var(--warning)` 或 `var(--danger)` 着色

## 5. Layout Principles

### Spacing System (8pt Grid)
- 2px: 边框间距、微调
- 4px: 图标与文字间距
- 6px: 紧凑元素内边距
- 8px: 按钮组间距、列表项间距
- 12px: 卡片内边距 (紧凑)
- 16px: 标准卡片内边距、面板边距
- 20px: Dialog 内边距
- 24px: Section 间距
- 32px: 大区块间距

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 6px | 标签、Badge、小按钮 |
| `--radius-md` | 8px | 工具按钮、输入框 |
| `--radius-lg` | 10px | CTA 按钮 |
| `--radius-xl` | 12px | 设备卡片、面板 |
| `--radius-2xl` | 14px | Dialog、模态框 |
| `--radius-full` | 50% | 状态指示灯、头像 |
| `--radius-pill` | 980px | 连接状态 Pill |

### Container Rules
- Header: 全宽固定顶部，`z-20`
- Sidebar: 固定左侧，`z-10` (桌面) / `z-40` (移动端浮层)
- Map: 填满剩余空间，`z-0`
- Dialog: `z-50`，视口居中
- Toast/Indicator: `z-30`，顶部居中

## 6. Depth & Elevation

| Level | Material | `backdrop-filter` | Background | Use |
|-------|----------|-------------------|------------|-----|
| 0 (Base) | None | None | `#000000` | 地图画布 |
| 1 (Elevated) | None | None | `#1C1C1E` | 设备卡片 |
| 2 (Glass Regular) | Regular | `blur(20px)` | `rgba(28,28,30, 0.60)` | Sidebar |
| 3 (Glass Thick) | Thick | `saturate(180%) blur(20px)` | `rgba(28,28,30, 0.80)` | Header |
| 4 (Overlay) | Ultrathin | `blur(8px)` | `rgba(0,0,0, 0.50)` | Modal backdrop |
| 5 (Dialog) | Thick | `blur(40px)` | `#1C1C1E` 95% | Modal panel |

**Shadow Philosophy**: Apple 在深色模式中极少使用阴影——黑色背景上阴影几乎不可见。深度通过材质层级（毛玻璃模糊度）和背景亮度差异传达。唯一使用明显阴影的是 Dialog: `0 25px 50px rgba(0,0,0,0.50)`。

## 7. Motion & Animation

### Spring System (framer-motion)

| Profile | Stiffness | Damping | Mass | Use |
|---------|-----------|---------|------|-----|
| **Snappy** | 400 | 30 | 1 | Dialog 弹入、Picker 出现 |
| **Default** | 300 | 30 | 1 | Sidebar 滑入/滑出、Header 入场 |
| **Gentle** | 250 | 25 | 1 | 首屏卡片入场、Key 输入框 |
| **Quick** | 500 | 35 | 1 | 按钮反馈、Toggle 切换 |

### Duration & Easing

| Type | Duration | Easing | Use |
|------|----------|--------|-----|
| **Press feedback** | 100ms | `ease-out` | `scale(0.97)` 按钮按下 |
| **Hover transition** | 150ms | `ease-in-out` | 背景色、文字色变化 |
| **State change** | 200ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 颜色切换、激活态 |
| **Panel slide** | 300-350ms | Spring (Default) | Sidebar 开关 |
| **Modal appear** | 250ms | Spring (Snappy) | Dialog 弹入 |
| **Modal dismiss** | 200ms | `ease-in` | Dialog 消失 (比出现更快) |
| **Page transition** | 350ms | Spring (Gentle) | 闪屏淡出、首屏入场 |

### Component Animations

**Sidebar**
- Enter: `width: 0 → sidebarWidth`, `opacity: 0 → 1`, Spring Default
- Exit: 反向，同参数
- Mobile backdrop: `opacity: 0 → 1`, 200ms ease

**Dialog / Modal**
- Backdrop: `opacity: 0 → 1`, 200ms ease
- Panel: `scale: 0.9 → 1`, `opacity: 0 → 1`, Spring Snappy
- Dismiss: `scale: 1 → 0.95`, `opacity: 1 → 0`, 200ms ease-in

**Button Press**
- `whileTap: { scale: 0.97 }` (CTA / 标准按钮)
- `whileTap: { scale: 0.92 }` (小型工具按钮)
- `whileTap: { scale: 0.90 }` (图标按钮)

**Connection Toast**
- Enter: `y: -20 → 0`, `opacity: 0 → 1`, Spring Default
- Exit: `y: 0 → -20`, `opacity: 1 → 0`, 200ms ease

**Status Pulse**
- `animate-pulse`: `opacity: 1 → 0.5 → 1`, 2s infinite
- 仅用于已连接状态指示灯

### Animation Principles
- **出现比消失慢**: 进入动画用 spring (250-350ms)，退出用 ease-in (150-200ms)
- **响应即时性**: 按钮 press 反馈 < 100ms，用户操作到视觉响应的延迟必须低于一帧
- **不弹跳**: Apple 风格的 spring 是 critically damped 或 over-damped，没有回弹 (damping ≥ 25)
- **层级一致**: 越底层的元素动画越慢 (sidebar 350ms)，越顶层越快 (toast 200ms)

## 8. Do's and Don'ts

### Do
- 使用 Apple Blue (`#007AFF`) 作为唯一强调色，所有可交互元素统一
- 使用毛玻璃材质 (`backdrop-filter: blur`) 表达浮层深度
- 使用 `0.5px` 分隔线而非粗边框
- 卡片无边框，通过背景色差异区分层级
- 数值文字使用 SF Mono + tabular-nums 保持对齐
- 深色模式使用 Apple 标准透明度层级 (60%/30%/18%)
- Spring 动画保持 critically damped，damping ≥ 25

### Don't
- 不要引入第二种强调色（无渐变、无 indigo/purple/teal 混用）
- 不要在深色背景上使用可见阴影（阴影仅用于 Dialog）
- 不要使用粗边框 (≥ 1px 的实线边框)
- 不要使用 bounce/elastic 弹跳动画
- 不要在 SF Pro 上应用正值 letter-spacing
- 不要使用 font-weight 800/900
- 不要用纯白文字做正文（正文用 60% 透明度）
- 不要让动画超过 400ms（除非是全屏过渡）

## 9. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 768px | 侧栏收起为浮层，Hamburger 菜单，Toolbar 移入侧栏 |
| Desktop | ≥ 768px | 侧栏常驻，Header 显示完整工具栏 |

### Touch Targets
- 所有可点击元素: 最小 44x44px 触摸区域 (Apple HIG 标准)
- 按钮内边距: 不小于 10px 垂直 / 16px 水平
- 列表项行高: 不小于 44px

### Mobile Adaptations
- Sidebar: 左侧滑入浮层，85vw 宽度，max 320px
- Backdrop: `rgba(0,0,0,0.50)` + `blur(8px)`，点击关闭
- Header: 隐藏 App 名称和工具栏，仅保留 Logo + 模式切换 + 连接按钮
- 设备选中后自动关闭侧栏

## Version Management
每次发布更新必须递增版本号，禁止复用同一版本号：

1. **package.json** `version` 字段：语义化版本 `X.Y.Z`
2. **build.gradle** `versionCode`：每次 +1（整数递增，不可回退）
3. **build.gradle** `versionName`：与 package.json 主版本保持一致（如 `1.8`）
4. **SplashScreen** 版本号：自动从 `package.json` 读取，无需手动改
5. **Changelog**：每次更新必须在 `GPS_STM32/changelogs/` 创建 `YYYY-MM-DD_vX.X.md`

### 版本递增规则
- **patch**（Z+1）：bug 修复、微调样式
- **minor**（Y+1）：新功能、UI 重设计
- **major**（X+1）：架构变更、不兼容改动
