import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, Usb, Loader2, X, WifiOff, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { ConnectionState } from '../types/device';

interface ConnectionPanelProps {
  connection: ConnectionState;
  onBluetoothConnect: () => void;
  onSerialConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectionPanel({ connection, onBluetoothConnect, onSerialConnect, onDisconnect }: ConnectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isStale = connection.status === 'connected' && connection.dataStale === true;

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
          ${isStale
            ? 'bg-[#FF9F0A]/15 text-[#FF9F0A]'
            : connection.status === 'connected'
              ? 'bg-[#30D158]/15 text-[#30D158]'
              : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06]'}`}
      >
        {connection.status === 'connecting'
          ? <Loader2 size={14} className="animate-spin" />
          : isStale
            ? <WifiOff size={14} />
            : <Bluetooth size={14} />}
        <span>
          {isStale ? '无数据'
            : connection.status === 'connected' ? '已连接'
            : connection.status === 'connecting' ? '连接中' : '连接'}
        </span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 p-3 overflow-hidden"
          >
            <h3 className="text-white text-sm font-semibold mb-3">连接设备</h3>

            {connection.status === 'disconnected' && (
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { onBluetoothConnect(); setExpanded(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-[#007AFF]/15 hover:bg-[#007AFF]/25 text-[#0A84FF] text-xs rounded-lg transition-colors duration-150"
                >
                  <Bluetooth size={15} />
                  {Capacitor.isNativePlatform() ? '蓝牙 SPP' : '蓝牙 (BLE)'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { onSerialConnect(); setExpanded(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#0A84FF] text-xs rounded-lg transition-colors duration-150"
                >
                  <Usb size={15} />
                  USB 串口
                </motion.button>
              </div>
            )}

            {connection.status === 'connected' && (
              <div className="flex flex-col gap-2">
                {isStale && (
                  <div className="flex items-start gap-2 px-2 py-2 bg-[#FF9F0A]/10 border border-[#FF9F0A]/25 rounded-lg">
                    <AlertTriangle size={13} className="text-[#FF9F0A] shrink-0 mt-0.5" />
                    <div className="text-[11px] text-[#FF9F0A]/90 leading-snug">
                      已连接，但 10 秒未收到主机数据。<br/>请检查主机开机状态、蓝牙信号或重新配对。
                    </div>
                  </div>
                )}
                <div className="text-[11px] text-white/40 px-1">
                  <div>类型: {connection.type === 'bluetooth' ? '蓝牙' : '串口'}</div>
                  {connection.deviceName && <div>设备: {connection.deviceName}</div>}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { onDisconnect(); setExpanded(false); }}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 bg-[#FF453A]/15 hover:bg-[#FF453A]/25 text-[#FF453A] text-xs rounded-lg transition-colors duration-150"
                >
                  <X size={14} />
                  断开连接
                </motion.button>
              </div>
            )}

            {connection.status === 'connecting' && (
              <div className="flex items-center justify-center gap-2 py-4 text-white/50 text-xs">
                <Loader2 size={16} className="animate-spin" />
                正在连接...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
