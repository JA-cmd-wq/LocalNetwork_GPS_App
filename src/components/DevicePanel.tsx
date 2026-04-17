import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Signal, Clock, WifiOff } from 'lucide-react';
import type { DeviceInfo } from '../types/device';
import { haversineDistance, formatDistance } from '../utils/haversine';
import { isDeviceOffline } from '../utils/device-status';

export type ViewMode = 'concentrator' | 'sensor';

interface DevicePanelProps {
  devices: DeviceInfo[];
  selectedEui: string | null;
  onSelect: (eui: string) => void;
  concentrator?: DeviceInfo;
  mode: ViewMode;
  poiNames: Map<string, string>;
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 3) return '刚刚';
  if (sec < 60) return `${sec}秒前`;
  if (sec < 3600) return `${Math.floor(sec / 60)}分钟前`;
  return `${Math.floor(sec / 3600)}小时前`;
}

export default function DevicePanel({ devices, selectedEui, onSelect, concentrator, mode, poiNames }: DevicePanelProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const visibleDevices = mode === 'sensor'
    ? devices.filter(d => d.role === 'sensor')
    : devices;

  const sensors = devices.filter(d => d.role === 'sensor');

  return (
    <div className="flex flex-col gap-2 p-3">
      <AnimatePresence mode="popLayout">
        {visibleDevices.map((device, index) => {
          const isSelected = device.eui === selectedEui;
          const offline = isDeviceOffline(device);

          let distInfo: string | null = null;
          if (mode === 'concentrator') {
            if (concentrator && device.eui !== concentrator.eui && device.valid && concentrator.valid) {
              distInfo = '距集中器 ' + formatDistance(haversineDistance(
                device.latitude, device.longitude,
                concentrator.latitude, concentrator.longitude
              ));
            }
          } else {
            const otherSensor = sensors.find(s => s.eui !== device.eui);
            if (otherSensor && device.valid && otherSensor.valid) {
              distInfo = '距 ' + otherSensor.label + ' ' + formatDistance(haversineDistance(
                device.latitude, device.longitude,
                otherSensor.latitude, otherSensor.longitude
              ));
            }
          }

          const poi = poiNames.get(device.eui);

          return (
            <motion.button
              key={device.eui}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 30 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(device.eui)}
              className={`
                w-full text-left rounded-xl p-3 transition-colors duration-150
                ${isSelected
                  ? 'bg-white/[0.08]'
                  : 'bg-white/[0.03] hover:bg-white/[0.06]'}
              `}
              style={isSelected ? { boxShadow: `inset 0 0 0 1.5px ${device.color}` } : undefined}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 transition-opacity duration-200"
                  style={{ background: device.color, opacity: offline ? 0.35 : 1 }}
                >
                  {device.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium text-sm tracking-tight ${offline ? 'text-white/50' : 'text-white'}`}>
                      {device.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {offline && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[#FF453A] bg-[#FF453A]/15 px-1.5 py-0.5 rounded-full font-medium">
                          <WifiOff size={9} />
                          离线
                        </span>
                      )}
                      <span className="text-white/30 text-[10px] font-mono">{device.eui.slice(-4)}</span>
                    </div>
                  </div>
                  {offline ? (
                    <span className="text-[11px] text-[#FF453A]/70">最后位置 {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}</span>
                  ) : device.valid ? (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-[11px] text-white/50 font-mono">
                        {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                      </div>
                      {poi && (
                        <div className="flex items-center gap-1 text-[11px] text-white/60">
                          <MapPin size={9} className="shrink-0" />
                          <span className="truncate">{poi}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#FFD60A]/80">搜星中...</span>
                  )}
                </div>
              </div>

              {(device.valid || offline) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className={`flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.06] text-[11px] ${offline ? 'text-white/25' : 'text-white/40'}`}
                >
                  {device.rssi !== undefined && !offline && (
                    <span className="flex items-center gap-1">
                      <Signal size={10} />
                      {device.rssi} dBm
                    </span>
                  )}
                  {distInfo && !offline && (
                    <span className="flex items-center gap-1 text-white/60 font-medium">
                      {distInfo}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 ml-auto ${offline ? 'text-[#FF453A]/80 font-medium' : ''}`}>
                    <Clock size={10} />
                    {timeAgo(device.lastUpdate)}
                  </span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
