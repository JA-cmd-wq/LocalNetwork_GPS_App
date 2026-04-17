import { useState, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import BluetoothSPP from '../plugins/bluetooth-spp';
import type { BluetoothSPPDevice } from '../plugins/bluetooth-spp';

export interface SPPHook {
  connect: () => Promise<void>;
  connectTo: (address: string) => Promise<void>;
  disconnect: () => void;
  status: 'disconnected' | 'connecting' | 'connected';
  deviceName: string | null;
  error: string | null;
  pairedDevices: BluetoothSPPDevice[];
  clearPairedDevices: () => void;
}

export function useBluetoothSPP(
  onLine: (line: string) => void,
): SPPHook {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<BluetoothSPPDevice[]>([]);
  const dataListenerRef = useRef<PluginListenerHandle | null>(null);
  const disconnectListenerRef = useRef<PluginListenerHandle | null>(null);
  const onLineRef = useRef(onLine);
  onLineRef.current = onLine;
  const lastTargetRef = useRef<BluetoothSPPDevice | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doConnect = useCallback(async (target: BluetoothSPPDevice) => {
    try {
      setStatus('connecting');
      setPairedDevices([]);

      dataListenerRef.current = await BluetoothSPP.addListener('sppData', (data) => {
        onLineRef.current(data.line);
      });

      disconnectListenerRef.current = await BluetoothSPP.addListener('sppDisconnected', () => {
        setStatus('disconnected');
        setDeviceName(null);
        if (lastTargetRef.current && retryCountRef.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(() => doConnect(lastTargetRef.current!), delay);
        }
      });

      await BluetoothSPP.connect({ address: target.address });
      setDeviceName(target.name || target.address);
      setStatus('connected');
      lastTargetRef.current = target;
      retryCountRef.current = 0;
    } catch (e: any) {
      setError(e.message || 'Connection failed');
      setStatus('disconnected');
      if (dataListenerRef.current) {
        dataListenerRef.current.remove();
        dataListenerRef.current = null;
      }
      if (disconnectListenerRef.current) {
        disconnectListenerRef.current.remove();
        disconnectListenerRef.current = null;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Bluetooth SPP only available in native app');
      return;
    }

    try {
      setError(null);

      const result = await BluetoothSPP.listPaired();
      const jdyDevices = result.devices.filter(
        (d) => d.name && (d.name.toUpperCase().includes('JDY') || d.name.toUpperCase().includes('SPP')),
      );

      const candidates = jdyDevices.length > 0 ? jdyDevices : result.devices;

      if (candidates.length === 0) {
        setError('未找到已配对蓝牙设备，请先在系统设置中配对 JDY-31');
        setStatus('disconnected');
        return;
      }

      if (candidates.length === 1) {
        await doConnect(candidates[0]);
      } else {
        setPairedDevices(candidates);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to list devices');
      setStatus('disconnected');
    }
  }, [doConnect]);

  const connectTo = useCallback(async (address: string) => {
    const device = pairedDevices.find(d => d.address === address);
    if (device) {
      await doConnect(device);
    }
  }, [pairedDevices, doConnect]);

  const clearPairedDevices = useCallback(() => {
    setPairedDevices([]);
  }, []);

  const disconnect = useCallback(async () => {
    lastTargetRef.current = null;
    retryCountRef.current = 0;
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    try {
      await BluetoothSPP.disconnect();
    } catch {}
    if (dataListenerRef.current) {
      dataListenerRef.current.remove();
      dataListenerRef.current = null;
    }
    if (disconnectListenerRef.current) {
      disconnectListenerRef.current.remove();
      disconnectListenerRef.current = null;
    }
    setStatus('disconnected');
    setDeviceName(null);
  }, []);

  return { connect, connectTo, disconnect, status, deviceName, error, pairedDevices, clearPairedDevices };
}
