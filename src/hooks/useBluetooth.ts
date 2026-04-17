import { useState, useRef, useCallback } from 'react';

const GPS_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const GPS_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export interface BLEHook {
  connect: () => Promise<void>;
  disconnect: () => void;
  status: 'disconnected' | 'connecting' | 'connected';
  deviceName: string | null;
  error: string | null;
}

export function useBluetooth(
  onData: (data: DataView) => void
): BLEHook {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth not supported in this browser');
      return;
    }
    try {
      setStatus('connecting');
      setError(null);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [GPS_SERVICE_UUID] }],
        optionalServices: [GPS_SERVICE_UUID],
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'BLE Device');

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setDeviceName(null);
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(GPS_SERVICE_UUID);
      const char = await service.getCharacteristic(GPS_CHAR_UUID);
      charRef.current = char;

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          onData(target.value);
        }
      });

      setStatus('connected');
    } catch (e: any) {
      if (e.name !== 'NotFoundError') {
        setError(e.message || 'Connection failed');
      }
      setStatus('disconnected');
    }
  }, [onData]);

  const disconnect = useCallback(() => {
    if (charRef.current) {
      charRef.current.stopNotifications().catch(() => {});
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setStatus('disconnected');
    setDeviceName(null);
  }, []);

  return { connect, disconnect, status, deviceName, error };
}
