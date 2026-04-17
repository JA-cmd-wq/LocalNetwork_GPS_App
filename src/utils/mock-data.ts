import type { DeviceInfo } from '../types/device';

const BASE_LAT = 34.234889;
const BASE_LON = 108.902600;

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

export function createMockDevices(): DeviceInfo[] {
  const now = Date.now();
  return [
    {
      eui: '00000000',
      role: 'concentrator',
      label: '集中器',
      color: '#FF6B6B',
      avatar: 'C',
      latitude: BASE_LAT,
      longitude: BASE_LON,
      valid: true,
      lastUpdate: now,
      track: [{ lat: BASE_LAT, lon: BASE_LON, timestamp: now }],
    },
    {
      eui: 'A1B2C3D4',
      role: 'sensor',
      label: '传感器 1',
      color: '#4ECDC4',
      avatar: '1',
      latitude: jitter(BASE_LAT, 0.004),
      longitude: jitter(BASE_LON, 0.004),
      valid: true,
      rssi: -65,
      snr: 8,
      lastUpdate: now - 1000,
      track: [],
    },
    {
      eui: 'E5F6A7B8',
      role: 'sensor',
      label: '传感器 2',
      color: '#45B7D1',
      avatar: '2',
      latitude: jitter(BASE_LAT, 0.006),
      longitude: jitter(BASE_LON, 0.006),
      valid: true,
      rssi: -78,
      snr: 5,
      lastUpdate: now - 2000,
      track: [],
    },
  ];
}

export function simulateMovement(devices: DeviceInfo[]): DeviceInfo[] {
  const now = Date.now();
  return devices.map(d => {
    if (!d.valid) return d;
    const angle = now / 10000 + (d.eui === '00000000' ? 0 : d.eui === 'A1B2C3D4' ? 2 : 4);
    const speed = d.role === 'concentrator' ? 0.00002 : 0.00005;
    const newLat = d.latitude + Math.sin(angle) * speed;
    const newLon = d.longitude + Math.cos(angle) * speed;
    const newPoint = { lat: newLat, lon: newLon, timestamp: now };
    const track = [...d.track, newPoint].slice(-500);
    return {
      ...d,
      latitude: newLat,
      longitude: newLon,
      lastUpdate: now,
      rssi: d.rssi ? d.rssi + Math.round((Math.random() - 0.5) * 4) : undefined,
      track,
    };
  });
}
