import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { DeviceInfo, ConnectionState } from '../types/device';
import { saveTrack } from '../utils/storage';
import { useBluetooth } from './useBluetooth';
import { useBluetoothSPP } from './useBluetoothSPP';
import { useSerial } from './useSerial';
import { LineBuffer } from '../utils/line-buffer';
import { parseLGPSLine, mergeDeviceUpdates } from '../utils/lgps-parser';
import type { LGPSFrame } from '../utils/lgps-parser';
import { DATA_STALE_THRESHOLD_MS } from '../utils/device-status';

const isNative = Capacitor.isNativePlatform();

interface UseConnectionManagerOptions {
  setDevices: React.Dispatch<React.SetStateAction<DeviceInfo[]>>;
  devicesRef: React.MutableRefObject<DeviceInfo[]>;
  onResetCaches?: () => void;
}

export function useConnectionManager({ setDevices, devicesRef, onResetCaches }: UseConnectionManagerOptions) {
  const [connection, setConnection] = useState<ConnectionState>({ type: 'none', status: 'disconnected' });
  const bleLineBuffer = useRef(new LineBuffer());
  const serialLineBuffer = useRef(new LineBuffer());
  /** Timestamp (ms) of the most recently parsed valid $LGPS frame. 0 means none since connect. */
  const lastFrameTsRef = useRef<number>(0);

  const processFrame = useCallback((frame: LGPSFrame) => {
    lastFrameTsRef.current = Date.now();
    setDevices(prev => mergeDeviceUpdates(prev, frame));
  }, [setDevices]);

  const processLines = useCallback((lines: string[]) => {
    for (const line of lines) {
      const frame = parseLGPSLine(line);
      if (frame) processFrame(frame);
    }
  }, [processFrame]);

  const handleSPPLine = useCallback((line: string) => {
    const frame = parseLGPSLine(line);
    if (frame) processFrame(frame);
  }, [processFrame]);

  const handleBLEData = useCallback((dataView: DataView) => {
    const bytes = new Uint8Array(dataView.buffer);
    const lines = bleLineBuffer.current.feed(bytes);
    processLines(lines);
  }, [processLines]);

  const handleSerialData = useCallback((bytes: Uint8Array) => {
    const lines = serialLineBuffer.current.feed(bytes);
    processLines(lines);
  }, [processLines]);

  const spp = useBluetoothSPP(handleSPPLine);
  const ble = useBluetooth(handleBLEData);
  const serial = useSerial(handleSerialData);

  const handleBluetoothConnect = useCallback(async () => {
    if (isNative) {
      await spp.connect();
    } else {
      setConnection({ type: 'bluetooth', status: 'connecting' });
      setDevices([]);
      bleLineBuffer.current.reset();
      await ble.connect();
    }
  }, [spp, ble, setDevices]);

  const handleSPPDeviceSelect = useCallback(async (address: string) => {
    setConnection({ type: 'bluetooth', status: 'connecting' });
    setDevices([]);
    await spp.connectTo(address);
  }, [spp, setDevices]);

  const handleSerialConnect = useCallback(async () => {
    setConnection({ type: 'serial', status: 'connecting' });
    serialLineBuffer.current.reset();
    setDevices([]);
    await serial.connect();
    setConnection({ type: 'serial', status: serial.status === 'connected' ? 'connected' : 'disconnected' });
  }, [serial, setDevices]);

  const handleDisconnect = useCallback(() => {
    devicesRef.current.forEach(d => {
      if (d.track.length > 1) {
        saveTrack({ eui: d.eui, points: d.track, startTime: d.track[0].timestamp, endTime: d.track[d.track.length - 1].timestamp })
          .catch(err => console.warn('[saveTrack] failed', err));
      }
    });
    if (connection.type === 'bluetooth') {
      if (isNative) spp.disconnect();
      else ble.disconnect();
    }
    if (connection.type === 'serial') serial.disconnect();
    bleLineBuffer.current.reset();
    serialLineBuffer.current.reset();
    onResetCaches?.();
    setConnection({ type: 'none', status: 'disconnected' });
    setDevices([]);
  }, [connection, spp, ble, serial, devicesRef, setDevices, onResetCaches]);

  const btHook = isNative ? spp : ble;
  useEffect(() => {
    if (btHook.status === 'connecting') {
      setDevices([]);
    }
    setConnection(prev => {
      if (prev.type !== 'bluetooth' && btHook.status === 'disconnected') return prev;
      const next: ConnectionState = { ...prev, type: 'bluetooth', status: btHook.status, deviceName: btHook.deviceName || undefined };
      if (btHook.status === 'disconnected' && prev.status !== 'disconnected') {
        setDevices([]);
        return { type: 'none', status: 'disconnected' };
      }
      return next;
    });
  }, [btHook.status, btHook.deviceName, setDevices]);

  useEffect(() => {
    setConnection(prev => ({ ...prev, status: serial.status }));
  }, [serial.status]);

  // Reset last frame timestamp on (re)connect so dataStale starts accurate
  useEffect(() => {
    if (connection.status === 'connected') {
      lastFrameTsRef.current = Date.now();
    } else {
      lastFrameTsRef.current = 0;
    }
  }, [connection.status]);

  // Every 1s, update dataStale flag based on whether a frame arrived recently.
  // Only meaningful when connection is connected.
  useEffect(() => {
    if (connection.status !== 'connected') {
      if (connection.dataStale) {
        setConnection(prev => ({ ...prev, dataStale: false }));
      }
      return;
    }
    const id = setInterval(() => {
      const ts = lastFrameTsRef.current;
      const stale = ts > 0 && Date.now() - ts > DATA_STALE_THRESHOLD_MS;
      setConnection(prev => (prev.dataStale === stale ? prev : { ...prev, dataStale: stale }));
    }, 1000);
    return () => clearInterval(id);
  }, [connection.status, connection.dataStale]);

  return {
    connection,
    spp,
    handleBluetoothConnect,
    handleSPPDeviceSelect,
    handleSerialConnect,
    handleDisconnect,
  };
}
