export type DeviceRole = 'concentrator' | 'sensor';

export interface GPSPoint {
  lat: number;
  lon: number;
  timestamp: number;
}

export interface DeviceInfo {
  eui: string;
  role: DeviceRole;
  label: string;
  color: string;
  avatar: string;
  latitude: number;
  longitude: number;
  valid: boolean;
  rssi?: number;
  snr?: number;
  lastUpdate: number;
  track: GPSPoint[];
}

export interface AlertConfig {
  id: string;
  type: 'geofence' | 'signal_lost';
  enabled: boolean;
  deviceEui?: string;
  center?: { lat: number; lon: number };
  radius?: number;
  timeoutMs?: number;
}

export interface ConnectionState {
  type: 'none' | 'bluetooth' | 'serial';
  status: 'disconnected' | 'connecting' | 'connected';
  deviceName?: string;
  /** 蓝牙已连接但超时未收到任何 $LGPS 帧 —— 用于提示用户主机可能没在发数据 */
  dataStale?: boolean;
}
