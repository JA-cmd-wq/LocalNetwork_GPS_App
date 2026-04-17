import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Shield, Timer, X, Plus } from 'lucide-react';
import type { AlertConfig, DeviceInfo } from '../types/device';

interface AlertPanelProps {
  alerts: AlertConfig[];
  devices: DeviceInfo[];
  activeAlerts: string[];
  onAddAlert: (alert: AlertConfig) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
}

export default function AlertPanel({ alerts, devices, activeAlerts, onAddAlert, onRemoveAlert, onToggleAlert }: AlertPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<'geofence' | 'signal_lost'>('signal_lost');
  const [newDevice, setNewDevice] = useState('');
  const [newTimeout, setNewTimeout] = useState(30);
  const [newRadius, setNewRadius] = useState(500);

  const handleAdd = () => {
    const id = `alert_${Date.now()}`;
    if (newType === 'signal_lost') {
      onAddAlert({ id, type: 'signal_lost', enabled: true, deviceEui: newDevice || undefined, timeoutMs: newTimeout * 1000 });
    } else {
      const dev = devices.find(d => d.eui === newDevice);
      onAddAlert({ id, type: 'geofence', enabled: true, deviceEui: newDevice || undefined, center: dev ? { lat: dev.latitude, lon: dev.longitude } : undefined, radius: newRadius });
    }
    setShowAdd(false);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-white/80 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <Bell size={12} />
          告警
          {activeAlerts.length > 0 && (
            <span className="bg-[#FF453A] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeAlerts.length}</span>
          )}
        </h3>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(!showAdd)}
          className="text-[11px] text-[#0A84FF] hover:text-[#409CFF] flex items-center gap-0.5"
        >
          <Plus size={11} />
          添加
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.03] rounded-lg p-3 mb-2.5 text-xs space-y-2">
              <div>
                <label className="text-white/30 text-[10px] block mb-1">类型</label>
                <select value={newType} onChange={e => setNewType(e.target.value as 'geofence' | 'signal_lost')} className="w-full bg-white/[0.06] text-white rounded-lg px-2.5 py-1.5 text-xs border-0 outline-none">
                  <option value="signal_lost">信号丢失</option>
                  <option value="geofence">电子围栏</option>
                </select>
              </div>
              <div>
                <label className="text-white/30 text-[10px] block mb-1">设备</label>
                <select value={newDevice} onChange={e => setNewDevice(e.target.value)} className="w-full bg-white/[0.06] text-white rounded-lg px-2.5 py-1.5 text-xs border-0 outline-none">
                  <option value="">全部设备</option>
                  {devices.map(d => (<option key={d.eui} value={d.eui}>{d.label}</option>))}
                </select>
              </div>
              {newType === 'signal_lost' && (
                <div>
                  <label className="text-white/30 text-[10px] block mb-1">超时 (秒)</label>
                  <input type="number" value={newTimeout} onChange={e => setNewTimeout(Number(e.target.value))} className="w-full bg-white/[0.06] text-white rounded-lg px-2.5 py-1.5 text-xs border-0 outline-none" min={5} />
                </div>
              )}
              {newType === 'geofence' && (
                <div>
                  <label className="text-white/30 text-[10px] block mb-1">半径 (米)</label>
                  <input type="number" value={newRadius} onChange={e => setNewRadius(Number(e.target.value))} className="w-full bg-white/[0.06] text-white rounded-lg px-2.5 py-1.5 text-xs border-0 outline-none" min={50} />
                </div>
              )}
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleAdd} className="w-full bg-[#007AFF]/15 hover:bg-[#007AFF]/25 text-[#0A84FF] rounded-lg py-2 text-xs font-medium transition-colors duration-150">
                确认添加
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {alerts.length === 0 && !showAdd && (
        <p className="text-white/20 text-[11px] text-center py-3">暂无告警规则</p>
      )}

      <div className="flex flex-col gap-1.5">
        <AnimatePresence>
          {alerts.map(alert => {
            const isActive = activeAlerts.includes(alert.id);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center justify-between rounded-lg p-2.5 text-xs transition-colors duration-150
                  ${isActive ? 'bg-[#FF453A]/10' : 'bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-2">
                  {isActive ? <BellRing size={13} className="text-[#FF453A] animate-pulse" /> :
                    alert.type === 'geofence' ? <Shield size={13} className="text-white/30" /> :
                      <Timer size={13} className="text-white/30" />}
                  <div>
                    <div className="text-white/80 font-medium text-[11px]">
                      {alert.type === 'signal_lost' ? '信号丢失' : '电子围栏'}
                    </div>
                    <div className="text-white/30 text-[10px]">
                      {alert.deviceEui ? devices.find(d => d.eui === alert.deviceEui)?.label || alert.deviceEui : '全部'}
                      {alert.type === 'signal_lost' && ` / ${(alert.timeoutMs || 30000) / 1000}秒`}
                      {alert.type === 'geofence' && ` / ${alert.radius}米`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => onToggleAlert(alert.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${alert.enabled ? 'bg-[#30D158]/15 text-[#30D158]' : 'bg-white/[0.04] text-white/30'}`}>
                    {alert.enabled ? '开' : '关'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemoveAlert(alert.id)} className="p-1 text-white/20 hover:text-[#FF453A] transition-colors">
                    <X size={11} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
