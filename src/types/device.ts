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
}
