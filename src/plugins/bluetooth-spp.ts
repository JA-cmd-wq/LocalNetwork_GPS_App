import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface BluetoothSPPDevice {
  name: string;
  address: string;
}

export interface BluetoothSPPPlugin {
  listPaired(): Promise<{ devices: BluetoothSPPDevice[] }>;
  connect(options: { address: string }): Promise<void>;
  disconnect(): Promise<void>;
  addListener(
    eventName: 'sppData',
    handler: (data: { line: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'sppDisconnected',
    handler: (data: { error: string }) => void,
  ): Promise<PluginListenerHandle>;
}

const BluetoothSPP = registerPlugin<BluetoothSPPPlugin>('BluetoothSPP');

export default BluetoothSPP;
