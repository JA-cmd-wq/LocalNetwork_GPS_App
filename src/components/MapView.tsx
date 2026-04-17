import { useEffect, useRef, useCallback, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import type { DeviceInfo } from '../types/device';
import type { ViewMode } from './DevicePanel';
import { wgs84ToGcj02 } from '../utils/coord-transform';
import { haversineDistance, formatDistance } from '../utils/haversine';
import { isDeviceOffline } from '../utils/device-status';

interface MapViewProps {
  devices: DeviceInfo[];
  selectedEui: string | null;
  showTracks: boolean;
  amapKey: string;
  mode: ViewMode;
  onMapReady?: () => void;
}

function createAvatarMarker(device: DeviceInfo, selected: boolean, offline: boolean): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:relative;display:flex;flex-direction:column;align-items:center;${offline ? 'opacity:0.55;filter:grayscale(0.6);' : ''}`;

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    width:36px;height:36px;border-radius:50%;
    background:${device.color};color:white;
    font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;
    display:flex;align-items:center;justify-content:center;
    border:2px solid ${offline ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)'};
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
    transition:transform 0.15s ease;
    ${selected ? 'transform:scale(1.2);box-shadow:0 4px 16px rgba(0,0,0,0.4);' : ''}
  `;
  bubble.textContent = device.avatar;

  const label = document.createElement('div');
  label.style.cssText = `
    margin-top:3px;padding:2px 8px;border-radius:6px;
    background:rgba(28,28,30,0.80);color:rgba(255,255,255,0.9);
    font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;font-weight:500;
    white-space:nowrap;backdrop-filter:blur(8px);
    letter-spacing:-0.01em;
  `;
  label.textContent = offline ? `${device.label} · 离线` : device.label;
  if (offline) {
    label.style.color = 'rgba(255,69,58,0.9)';
  }

  // Only show pulse animation when device is online
  if (!offline) {
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:36px;height:36px;border-radius:50%;
      background:${device.color};opacity:0.25;
      animation:pulse-ring 2.5s ease-out infinite;
    `;
    wrapper.appendChild(pulse);
  }

  wrapper.appendChild(bubble);
  wrapper.appendChild(label);
  return wrapper;
}

function createDistanceLabel(text: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    background:rgba(28,28,30,0.85);color:rgba(255,255,255,0.85);
    padding:3px 10px;border-radius:6px;
    font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;font-weight:500;
    white-space:nowrap;backdrop-filter:blur(8px);
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
    letter-spacing:-0.01em;
    font-variant-numeric:tabular-nums;
  `;
  el.textContent = text;
  return el;
}

export default function MapView({ devices, selectedEui, showTracks, amapKey, mode, onMapReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const markerStateRef = useRef<Map<string, { label: string; color: string; selected: boolean; offline: boolean }>>(new Map());

  // Tick every second so offline state can flip without waiting for next frame
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const polylinesRef = useRef<Map<string, any>>(new Map());
  const distOverlaysRef = useRef<any[]>([]);
  const AMapRef = useRef<any>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const sec = localStorage.getItem('amap_sec');
      if (sec) {
        (window as any)._AMapSecurityConfig = { securityJsCode: sec };
      }
      const AMap = await AMapLoader.load({ key: amapKey, version: '2.0' });
      AMapRef.current = AMap;

      const center = devices.length > 0
        ? wgs84ToGcj02(devices[0].latitude, devices[0].longitude)
        : [34.23, 108.90];

      mapRef.current = new AMap.Map(containerRef.current, {
        zoom: 16,
        center: [center[1], center[0]],
        mapStyle: 'amap://styles/macaron',
        animateEnable: true,
      });

      onMapReady?.();
    } catch (e) {
      console.error('AMap load failed:', e);
    }
  }, [amapKey, onMapReady]);

  useEffect(() => {
    initMap();
    return () => { mapRef.current?.destroy(); mapRef.current = null; };
  }, [initMap]);

  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!map || !AMap) return;

    const visibleDevices = mode === 'sensor'
      ? devices.filter(d => d.role === 'sensor')
      : devices;

    const visibleEuis = new Set(visibleDevices.map(d => d.eui));
    markersRef.current.forEach((marker, eui) => {
      if (!visibleEuis.has(eui)) { map.remove(marker); markersRef.current.delete(eui); }
    });

    const now = Date.now();
    visibleDevices.forEach(device => {
      const offline = isDeviceOffline(device, now);
      // Skip if device has never been valid (no meaningful position yet)
      if (!device.valid && !offline) return;
      // Skip if offline and never had a valid position (all zero)
      if (offline && device.latitude === 0 && device.longitude === 0) return;

      const [gcjLat, gcjLon] = wgs84ToGcj02(device.latitude, device.longitude);
      const position = new AMap.LngLat(gcjLon, gcjLat);
      const isSelected = device.eui === selectedEui;

      const existing = markersRef.current.get(device.eui);
      const prevState = markerStateRef.current.get(device.eui);
      const needContentUpdate = !prevState
        || prevState.label !== device.label
        || prevState.color !== device.color
        || prevState.selected !== isSelected
        || prevState.offline !== offline;

      if (existing) {
        existing.setPosition(position);
        if (needContentUpdate) {
          existing.setContent(createAvatarMarker(device, isSelected, offline));
        }
      } else {
        const marker = new AMap.Marker({
          position,
          content: createAvatarMarker(device, isSelected, offline),
          offset: new AMap.Pixel(-20, -24),
        });
        map.add(marker);
        markersRef.current.set(device.eui, marker);
      }
      markerStateRef.current.set(device.eui, { label: device.label, color: device.color, selected: isSelected, offline });
    });

    if (selectedEui) {
      const dev = devices.find(d => d.eui === selectedEui);
      if (dev?.valid) {
        const [lat, lon] = wgs84ToGcj02(dev.latitude, dev.longitude);
        map.panTo(new AMap.LngLat(lon, lat));
      }
    }

    distOverlaysRef.current.forEach(o => map.remove(o));
    distOverlaysRef.current = [];

    // Distance lines: only between online devices (offline ones are stale)
    const onlineDevices = visibleDevices.filter(d => d.valid && !isDeviceOffline(d, now));
    for (let i = 0; i < onlineDevices.length; i++) {
      for (let j = i + 1; j < onlineDevices.length; j++) {
        const d1 = onlineDevices[i];
        const d2 = onlineDevices[j];
        const [lat1, lon1] = wgs84ToGcj02(d1.latitude, d1.longitude);
        const [lat2, lon2] = wgs84ToGcj02(d2.latitude, d2.longitude);
        const dist = haversineDistance(d1.latitude, d1.longitude, d2.latitude, d2.longitude);

        const line = new AMap.Polyline({
          path: [new AMap.LngLat(lon1, lat1), new AMap.LngLat(lon2, lat2)],
          strokeColor: '#000000',
          strokeWeight: 1.5,
          strokeStyle: 'dashed',
          strokeOpacity: 0.25,
          strokeDasharray: [8, 6],
        });
        map.add(line);
        distOverlaysRef.current.push(line);

        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        const label = new AMap.Marker({
          position: new AMap.LngLat(midLon, midLat),
          content: createDistanceLabel(formatDistance(dist)),
          offset: new AMap.Pixel(-30, -12),
        });
        map.add(label);
        distOverlaysRef.current.push(label);
      }
    }
  }, [devices, selectedEui, mode]);

  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!map || !AMap) return;

    polylinesRef.current.forEach(pl => map.remove(pl));
    polylinesRef.current.clear();

    if (!showTracks) return;

    const visibleDevices = mode === 'sensor'
      ? devices.filter(d => d.role === 'sensor')
      : devices;

    visibleDevices.forEach(device => {
      if (device.track.length < 2) return;
      const path = device.track.map(p => {
        const [lat, lon] = wgs84ToGcj02(p.lat, p.lon);
        return new AMap.LngLat(lon, lat);
      });
      const polyline = new AMap.Polyline({
        path,
        strokeColor: device.color,
        strokeWeight: 3,
        strokeOpacity: 0.6,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
      });
      map.add(polyline);
      polylinesRef.current.set(device.eui, polyline);
    });
  }, [devices, showTracks, mode]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translateX(-50%) scale(1); opacity: 0.3; }
          100% { transform: translateX(-50%) scale(2.5); opacity: 0; }
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
