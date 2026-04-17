import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Satellite, Settings, Radio, Wifi, Menu, X, Bluetooth } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { DeviceInfo, AlertConfig } from './types/device';
import { exportToJSON, exportToCSV } from './utils/storage';
import { haversineDistance } from './utils/haversine';
import { isDeviceOffline } from './utils/device-status';
import MapView from './components/MapView';
import DevicePanel from './components/DevicePanel';
import type { ViewMode } from './components/DevicePanel';
import ConnectionPanel from './components/ConnectionPanel';
import Toolbar from './components/Toolbar';
import AlertPanel from './components/AlertPanel';
import SplashScreen from './components/SplashScreen';
import { batchReverseGeocode } from './hooks/useReverseGeocode';
import { useConnectionManager } from './hooks/useConnectionManager';

const isNative = Capacitor.isNativePlatform();

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedEui, setSelectedEui] = useState<string | null>(null);
  const [showTracks, setShowTracks] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [mode, setMode] = useState<ViewMode>('concentrator');
  const [poiNames, setPoiNames] = useState<Map<string, string>>(new Map());
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [keyInput, setKeyInput] = useState('');
  const [secInput, setSecInput] = useState('');
  const [amapKey, setAmapKey] = useState(() => localStorage.getItem('amap_key') || '');
  const [amapSec, setAmapSec] = useState(() => localStorage.getItem('amap_sec') || '');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  const geocodeCacheRef = useRef<Map<string, { lat: number; lon: number }>>(new Map());

  const { connection, spp, handleBluetoothConnect, handleSPPDeviceSelect, handleSerialConnect, handleDisconnect } =
    useConnectionManager({ setDevices, devicesRef, onResetCaches: () => geocodeCacheRef.current.clear() });

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 1s tick for header online-count to reflect offline transitions
  const [, setHeaderTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHeaderTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sidebarWidth = isMobile ? Math.min(320, window.innerWidth * 0.85) : 300;


  useEffect(() => {
    if (!amapKey) return;
    const validDevices = devices.filter(d => d.valid).map(d => ({ eui: d.eui, lat: d.latitude, lon: d.longitude, valid: d.valid }));
    if (validDevices.length === 0) return;
    const needUpdate = validDevices.filter(d => {
      const cached = geocodeCacheRef.current.get(d.eui);
      return !cached || haversineDistance(cached.lat, cached.lon, d.lat, d.lon) >= 50;
    });
    if (needUpdate.length === 0) return;
    const timer = setTimeout(() => {
      batchReverseGeocode(needUpdate, results => {
        setPoiNames(prev => {
          const next = new Map(prev);
          results.forEach((poi, eui) => { if (poi.name) next.set(eui, poi.name); });
          return next;
        });
        needUpdate.forEach(d => geocodeCacheRef.current.set(d.eui, { lat: d.lat, lon: d.lon }));
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [devices, amapKey]);

  useEffect(() => {
    const newActive: string[] = [];
    const now = Date.now();
    alerts.forEach(alert => {
      if (!alert.enabled) return;
      const targets = alert.deviceEui ? devices.filter(d => d.eui === alert.deviceEui) : devices;
      if (alert.type === 'signal_lost') {
        const timeout = alert.timeoutMs || 30000;
        targets.forEach(d => { if (now - d.lastUpdate > timeout) newActive.push(alert.id); });
      }
      if (alert.type === 'geofence' && alert.center && alert.radius) {
        targets.forEach(d => {
          if (!d.valid) return;
          if (haversineDistance(d.latitude, d.longitude, alert.center!.lat, alert.center!.lon) > alert.radius!) newActive.push(alert.id);
        });
      }
    });
    setActiveAlerts(newActive);
  }, [devices, alerts]);

  useEffect(() => {
    if (activeAlerts.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('GPS 告警', { body: `${activeAlerts.length} 条告警触发` });
    }
  }, [activeAlerts.length]);

  const handleExportJSON = useCallback(() => {
    exportToJSON(devices.map(d => ({ eui: d.eui, label: d.label, role: d.role, latitude: d.latitude, longitude: d.longitude, valid: d.valid, rssi: d.rssi, snr: d.snr, trackPoints: d.track.length })));
  }, [devices]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(devices.map(d => ({ eui: d.eui, label: d.label, lat: d.latitude, lon: d.longitude, valid: d.valid, rssi: d.rssi })));
  }, [devices]);

  const concentrator = devices.find(d => d.role === 'concentrator');

  const handleSaveKey = () => {
    if (keyInput.trim() && secInput.trim()) {
      localStorage.setItem('amap_key', keyInput.trim());
      localStorage.setItem('amap_sec', secInput.trim());
      setAmapKey(keyInput.trim());
      setAmapSec(secInput.trim());
      setShowKeyDialog(false);
    }
  };

  if (!amapKey) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 30%, #001a3a 0%, #000000 60%)' }}>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 30 : 0, scale: showSplash ? 0.95 : 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 25, delay: showSplash ? 0 : 0.1 }}
          className="bg-white/[0.03] backdrop-blur-2xl rounded-xl p-8 max-w-md w-full mx-4 border border-white/[0.08] relative"
          style={{ boxShadow: '0 0 80px rgba(0,122,255,0.06), 0 20px 60px rgba(0,0,0,0.4)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,122,255,0.1) 100%)', border: '1px solid rgba(0,122,255,0.2)' }}
            >
              <Satellite size={22} className="text-[#0A84FF]" />
            </div>
            <div>
              <h1 className="text-white text-lg font-semibold tracking-tight">LoRa GPS</h1>
              <p className="text-white/30 text-[11px] tracking-wide">LocalNetwork 位置追踪系统</p>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-sm mb-5 leading-relaxed tracking-[-0.01em]"
          >
            请输入高德地图 JS API Key 和安全密钥以启动应用。
            <a href="https://console.amap.com" target="_blank" rel="noreferrer" className="text-[#0A84FF] hover:text-[#409CFF] ml-1">
              免费申请 &rarr;
            </a>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <input
              type="text"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="粘贴你的高德地图 Key"
              className="w-full bg-white/[0.05] text-white rounded-lg px-4 py-3 text-sm mb-3 border border-white/[0.08] focus:border-[#007AFF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            />
            <input
              type="text"
              value={secInput}
              onChange={e => setSecInput(e.target.value)}
              placeholder="粘贴安全密钥 (securityJsCode)"
              className="w-full bg-white/[0.05] text-white rounded-lg px-4 py-3 text-sm mb-4 border border-white/[0.08] focus:border-[#007AFF]/50 focus:outline-none placeholder:text-white/20 transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveKey}
              disabled={!keyInput.trim() || !secInput.trim()}
              className="w-full text-white rounded-lg py-3 text-sm font-medium transition-all duration-150 disabled:bg-white/[0.04] disabled:text-white/20"
              style={keyInput.trim() ? { background: 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)', boxShadow: '0 4px 20px rgba(0,122,255,0.3)' } : undefined}
            >
              开始使用
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#000000]">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex items-center justify-between px-2 md:px-4 py-2 md:py-2 bg-[#1C1C1E]/80 backdrop-blur-xl backdrop-saturate-[180%] border-b border-white/[0.06] z-20"
      >
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {/* Mobile hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(v => !v)}
            className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-150"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.2), rgba(0,122,255,0.1))' }}>
            <Satellite size={14} className="text-[#0A84FF]" />
          </div>
          <h1 className="text-white/90 text-sm font-semibold tracking-tight hidden sm:block">LoRa GPS</h1>
          <span className="text-white/20 text-[10px] font-mono">
            {devices.filter(d => d.valid && !isDeviceOffline(d)).length}/{devices.length}
          </span>
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 ml-1 md:ml-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('concentrator')}
              className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                mode === 'concentrator' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Radio size={11} />
              主机
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('sensor')}
              className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                mode === 'sensor' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Wifi size={11} />
              从机
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="hidden md:flex items-center gap-1.5">
            <Toolbar
              showTracks={showTracks}
              onToggleTracks={() => setShowTracks(v => !v)}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
            />
            <div className="w-px h-5 bg-white/10 mx-0.5" />
          </div>
          <ConnectionPanel
            connection={connection}
            onBluetoothConnect={handleBluetoothConnect}
            onSerialConnect={handleSerialConnect}
            onDisconnect={handleDisconnect}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowKeyDialog(true)}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150"
            title="设置"
          >
            <Settings size={15} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile backdrop */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`flex flex-col bg-[#1C1C1E]/95 md:bg-[#1C1C1E]/60 backdrop-blur-xl border-r border-white/[0.06] overflow-hidden ${
                isMobile ? 'absolute inset-y-0 left-0 z-40' : 'relative z-10'
              }`}
            >
              {/* Mobile: toolbar inside sidebar top */}
              {isMobile && (
                <div className="flex items-center gap-1.5 px-3 pt-3 pb-1 border-b border-white/[0.08]">
                  <Toolbar
                    showTracks={showTracks}
                    onToggleTracks={() => setShowTracks(v => !v)}
                    onExportJSON={handleExportJSON}
                    onExportCSV={handleExportCSV}
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 pt-3 md:pt-4 pb-1">
                  <h2 className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                    {mode === 'concentrator' ? '全部设备' : '从机设备'}
                  </h2>
                </div>
                <DevicePanel
                  devices={devices}
                  selectedEui={selectedEui}
                  onSelect={eui => {
                    setSelectedEui(eui === selectedEui ? null : eui);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  concentrator={concentrator}
                  mode={mode}
                  poiNames={poiNames}
                />
              </div>
              <div className="border-t border-white/[0.08]">
                <AlertPanel
                  alerts={alerts}
                  devices={devices}
                  activeAlerts={activeAlerts}
                  onAddAlert={a => setAlerts(prev => [...prev, a])}
                  onRemoveAlert={id => setAlerts(prev => prev.filter(a => a.id !== id))}
                  onToggleAlert={id => setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar toggle — desktop only */}
        {!isMobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(v => !v)}
            className="absolute top-1/2 -translate-y-1/2 z-20 bg-[#1C1C1E]/70 backdrop-blur-md hover:bg-[#1C1C1E]/90 text-white/30 hover:text-white/60 rounded-r-lg py-5 px-1 transition-all duration-150 border border-l-0 border-white/[0.08]"
            style={{ left: sidebarOpen ? '300px' : '0px', transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1)' }}
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </motion.button>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            devices={devices}
            selectedEui={selectedEui}
            showTracks={showTracks}
            amapKey={amapKey}
            mode={mode}
          />
          {/* 连接状态浮动提示 */}
          <AnimatePresence>
            {connection.status === 'connected' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-30"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-[#30D158]/90 text-white rounded-lg text-xs font-medium shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  实时模式 — {connection.deviceName || '已连接'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SPP device picker */}
      <AnimatePresence>
        {isNative && spp.pairedDevices.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => spp.clearPairedDevices()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-xl p-5 max-w-sm w-full mx-4 border border-white/[0.08]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Bluetooth size={16} className="text-[#0A84FF]" />
                <h2 className="text-white text-sm font-bold">选择蓝牙设备</h2>
              </div>
              <div className="space-y-2">
                {spp.pairedDevices.map(d => (
                  <motion.button
                    key={d.address}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSPPDeviceSelect(d.address)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors duration-150"
                  >
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{d.name || 'Unknown'}</div>
                      <div className="text-white/30 text-[10px] font-mono">{d.address}</div>
                    </div>
                    <Bluetooth size={14} className="text-white/30" />
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => spp.clearPairedDevices()}
                className="w-full mt-3 py-2.5 text-white/40 hover:text-white/60 text-xs transition-colors"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key dialog */}
      <AnimatePresence>
        {showKeyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowKeyDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-xl p-6 max-w-sm w-full mx-4 border border-white/[0.08]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-white text-sm font-semibold mb-3 tracking-tight">高德地图 API 设置</h2>
              <label className="text-white/30 text-[10px] block mb-1">Key</label>
              <input
                type="text"
                defaultValue={amapKey}
                onChange={e => setKeyInput(e.target.value)}
                className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 text-sm mb-2 border border-white/[0.08] focus:border-[#007AFF]/50 focus:outline-none"
              />
              <label className="text-white/30 text-[10px] block mb-1">安全密钥</label>
              <input
                type="text"
                defaultValue={amapSec}
                onChange={e => setSecInput(e.target.value)}
                className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 text-sm mb-3 border border-white/[0.08] focus:border-[#007AFF]/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowKeyDialog(false)}
                  className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 rounded-lg py-2.5 text-xs font-medium transition-colors duration-150"
                >
                  取消
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const k = keyInput || amapKey;
                    const s = secInput || amapSec;
                    if (k.trim() && s.trim()) {
                      localStorage.setItem('amap_key', k.trim());
                      localStorage.setItem('amap_sec', s.trim());
                      setAmapKey(k.trim());
                      setAmapSec(s.trim());
                      setShowKeyDialog(false);
                      window.location.reload();
                    }
                  }}
                  className="flex-1 bg-[#007AFF] hover:bg-[#0A84FF] text-white rounded-lg py-2.5 text-xs font-medium transition-colors duration-150"
                >
                  保存并刷新
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
