# 蓝牙模块信息 - JDY-31

## 模块型号
**JDY-31** — 蓝牙 3.0 SPP 透传模块（兼容 HC-05/06 从机）

## 产品参数
| 参数 | 值 |
|------|------|
| 蓝牙版本 | Bluetooth 3.0 SPP (经典蓝牙) |
| 通信接口 | UART (TTL 电平) |
| 默认波特率 | 9600 |
| 工作电压 | 1.8-3.6V (建议3.3V) |
| 工作频率 | 2.4GHz |
| 调制方式 | GFSK |
| 发射功率 | 8dBm |
| 接收灵敏度 | -97dBm |
| 传输距离 | 30米 |
| SPP吞吐量 | 16K bytes/s (Android/Windows) |
| 工作温度 | -40°C ~ 80°C |
| 天线 | 内置PCB天线 |
| 主从支持 | 仅从机 |
| 默认名称 | JDY-31-SPP |
| 默认PIN | 1234 |

## 引脚定义
### 4针版本
| 引脚 | 功能 |
|------|------|
| VCC | 电源 (3.6-6V) |
| GND | 电源地 |
| TXD | 串口输出 (TTL) |
| RXD | 串口输入 (TTL) |

### 6针版本
| 引脚 | 功能 |
|------|------|
| EN | 空 (未使用) |
| VCC | 电源 (3.6-6V) |
| GND | 电源地 |
| TXD | 串口输出 (TTL) |
| RXD | 串口输入 (TTL) |
| STATE | 连接状态 (未连接=低电平) |

## AT指令 (需加 \r\n)
| 指令 | 功能 | 默认值 |
|------|------|--------|
| AT+VERSION | 版本号 | JDY-31-V.2 |
| AT+RESET | 软复位 | — |
| AT+DISC | 断开连接 | — |
| AT+LADDR | 查询MAC地址 | — |
| AT+PIN | 连接密码 | 1234 |
| AT+BAUD | 波特率设置 | 9600 |
| AT+NAME | 广播名设置 | JDY-31-SPP |
| AT+DEFAULT | 恢复出厂设置 | — |

## ⚠️ 重要兼容性问题

**JDY-31 是经典蓝牙 3.0 SPP，不是 BLE (Bluetooth Low Energy)！**

### 影响
- ❌ **Web Bluetooth API 不支持经典蓝牙 SPP**，只支持 BLE 4.0+
- ❌ 浏览器 PWA 无法直接连接 JDY-31
- ✅ Android 原生 APP 可以通过 `BluetoothSocket` + SPP 连接
- ✅ Windows 可以通过虚拟 COM 口连接 (Web Serial API 可用)

### 可行方案
| 方案 | 描述 | 改动量 |
|------|------|--------|
| **A: 换BLE模块** | 换 HM-10 / JDY-23 (BLE 4.0)，Web Bluetooth 直连 | STM32无需改，Web端小改 |
| **B: 电脑中转** | JDY-31→电脑虚拟COM口→Web Serial API | 需要电脑在旁边 |
| **C: 安卓原生APP** | 用 Kotlin/Flutter 写原生蓝牙SPP连接 | 开发量大 |
| **D: 保留JDY-31+加ESP32** | ESP32做WiFi桥接，JDY-31接ESP32串口→WebSocket | 需额外硬件 |

**推荐方案 A**: 花10块钱换一个 BLE 模块（如 JDY-23），接线和波特率完全一样，Web端直接可用。
