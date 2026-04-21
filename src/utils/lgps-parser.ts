import type { DeviceInfo } from '../types/device';
import { haversineDistance } from './haversine';
import { filterTrackByTime } from './device-status';

function parseCoord(latStr: string, lonStr: string): [number, number] | null {
  const latN = parseInt(latStr, 10);
  const lonN = parseInt(lonStr, 10);
  if (!Number.isFinite(latN) || !Number.isFinite(lonN)) return null;
  const lat = latN / 1000000;
  const lon = lonN / 1000000;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return [lat, lon];
}

function parseRssi(s: string): number | undefined {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * $LGPS 协议帧类型
 * H = Host (集中器): 包含自身 + 2个传感器
 * S = Sensor (从机): 包含自身 + 主机
 * P = P2P (传感器对传): 包含自身 + 对端传感器
 */
export type LGPSFrameType = 'H' | 'S' | 'P';

export interface LGPSDeviceUpdate {
  eui: string;
  role: 'concentrator' | 'sensor';
  lat: number;      // WGS-84 float degrees
  lon: number;      // WGS-84 float degrees
  valid: boolean;
  rssi?: number;
}

export interface LGPSFrame {
  type: LGPSFrameType;
  devices: LGPSDeviceUpdate[];
}

/**
 * 解析一行 $LGPS 文本帧
 *
 * 集中器帧 (H): $LGPS,H,selfEui,lat,lon,v,s1Eui,lat,lon,v,rssi,s2Eui,lat,lon,v,rssi
 * 传感器帧 (S): $LGPS,S,selfEui,lat,lon,v,hostEui,lat,lon,v,rssi
 * P2P帧   (P): $LGPS,P,selfEui,lat,lon,v,peerEui,lat,lon,v,rssi
 */
export function parseLGPSLine(line: string): LGPSFrame | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('$LGPS,')) return null;

  const parts = trimmed.split(',');
  if (parts.length < 6) return null;

  const frameType = parts[1] as LGPSFrameType;
  if (frameType !== 'H' && frameType !== 'S' && frameType !== 'P') return null;

  const devices: LGPSDeviceUpdate[] = [];

  if (frameType === 'H') {
    // 集中器帧: 16 fields
    // [0]=$LGPS [1]=H [2]=selfEui [3]=lat [4]=lon [5]=v
    // [6]=s1Eui [7]=lat [8]=lon [9]=v [10]=rssi
    // [11]=s2Eui [12]=lat [13]=lon [14]=v [15]=rssi
    if (parts.length < 16) return null;

    // 自身 (集中器)
    const selfCoord = parseCoord(parts[3], parts[4]);
    if (!selfCoord) return null;
    devices.push({
      eui: parts[2],
      role: 'concentrator',
      lat: selfCoord[0],
      lon: selfCoord[1],
      valid: parts[5] === '1',
    });

    // Sensor 1
    const s1Eui = parts[6];
    const s1Valid = parts[9] === '1';
    const s1Coord = parseCoord(parts[7], parts[8]);
    if ((s1Eui !== '00000000' || s1Valid) && s1Coord) {
      devices.push({
        eui: s1Eui,
        role: 'sensor',
        lat: s1Coord[0],
        lon: s1Coord[1],
        valid: s1Valid,
        rssi: parseRssi(parts[10]),
      });
    }

    // Sensor 2
    const s2Eui = parts[11];
    const s2Valid = parts[14] === '1';
    const s2Coord = parseCoord(parts[12], parts[13]);
    if ((s2Eui !== '00000000' || s2Valid) && s2Coord) {
      devices.push({
        eui: s2Eui,
        role: 'sensor',
        lat: s2Coord[0],
        lon: s2Coord[1],
        valid: s2Valid,
        rssi: parseRssi(parts[15]),
      });
    }
  } else {
    // S 或 P 帧: 至少 11 fields, S帧可能有 16 fields (含中继对端)
    // [0]=$LGPS [1]=S/P [2]=selfEui [3]=lat [4]=lon [5]=v
    // [6]=otherEui [7]=lat [8]=lon [9]=v [10]=rssi
    // S帧扩展 (≥16): [11]=relayEui [12]=lat [13]=lon [14]=v [15]=rssi
    if (parts.length < 11) return null;

    // 自身 (传感器)
    const selfCoord = parseCoord(parts[3], parts[4]);
    if (!selfCoord) return null;
    devices.push({
      eui: parts[2],
      role: 'sensor',
      lat: selfCoord[0],
      lon: selfCoord[1],
      valid: parts[5] === '1',
    });

    // 对端 (主机 or 另一传感器)
    const otherEui = parts[6];
    const otherValid = parts[9] === '1';
    const otherCoord = parseCoord(parts[7], parts[8]);
    const otherRole = frameType === 'S' ? 'concentrator' as const : 'sensor' as const;
    if ((otherEui !== '00000000' || otherValid) && otherCoord) {
      devices.push({
        eui: otherEui,
        role: otherRole,
        lat: otherCoord[0],
        lon: otherCoord[1],
        valid: otherValid,
        rssi: parseRssi(parts[10]),
      });
    }

    // S帧扩展: 中继对端传感器 (经主机转发的另一台从机)
    if (frameType === 'S' && parts.length >= 16) {
      const relayEui = parts[11];
      const relayValid = parts[14] === '1';
      const relayCoord = parseCoord(parts[12], parts[13]);
      if ((relayEui !== '00000000' || relayValid) && relayCoord) {
        devices.push({
          eui: relayEui,
          role: 'sensor',
          lat: relayCoord[0],
          lon: relayCoord[1],
          valid: relayValid,
          rssi: parseRssi(parts[15]),
        });
      }
    }
  }

  return { type: frameType, devices };
}

/** 设备颜色和标签预设 */
const DEVICE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

/** 将解析结果合并到现有设备列表 */
export function mergeDeviceUpdates(
  existing: DeviceInfo[],
  frame: LGPSFrame,
): DeviceInfo[] {
  const now = Date.now();
  const updated = [...existing];

  // H帧是集中器权威视图：不在帧内的从机标记为无效
  if (frame.type === 'H') {
    const frameEuis = new Set(frame.devices.map(d => d.eui));
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].role === 'sensor' && !frameEuis.has(updated[i].eui)) {
        updated[i] = { ...updated[i], valid: false, lastUpdate: now };
      }
    }
  }

  for (const dev of frame.devices) {
    const idx = updated.findIndex(d => d.eui === dev.eui);
    if (idx >= 0) {
      // 更新已有设备
      const d = { ...updated[idx] };
      d.latitude = dev.lat;
      d.longitude = dev.lon;
      d.valid = dev.valid;
      d.lastUpdate = now;
      if (dev.rssi !== undefined) d.rssi = dev.rssi;
      if (dev.valid) {
        const last = d.track[d.track.length - 1];
        if (!last || haversineDistance(last.lat, last.lon, dev.lat, dev.lon) >= 1) {
          // 先按时间窗淘汰老点（30 分钟），再限制数量 500 兜底
          d.track = filterTrackByTime(
            [...d.track, { lat: dev.lat, lon: dev.lon, timestamp: now }],
            now,
          ).slice(-500);
        }
      }
      updated[idx] = d;
    } else {
      // 新设备
      const sensorCount = updated.filter(d => d.role === 'sensor').length + 1;
      const colorIdx = dev.role === 'concentrator' ? 0 : sensorCount;
      updated.push({
        eui: dev.eui,
        role: dev.role,
        label: dev.role === 'concentrator' ? '集中器' : `传感器 ${sensorCount}`,
        color: DEVICE_COLORS[colorIdx % DEVICE_COLORS.length],
        avatar: dev.role === 'concentrator' ? 'C' : `${sensorCount}`,
        latitude: dev.lat,
        longitude: dev.lon,
        valid: dev.valid,
        rssi: dev.rssi,
        lastUpdate: now,
        track: dev.valid ? [{ lat: dev.lat, lon: dev.lon, timestamp: now }] : [],
      });
    }
  }

  return updated;
}
