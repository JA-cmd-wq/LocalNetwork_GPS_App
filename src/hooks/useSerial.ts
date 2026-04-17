import { useState, useRef, useCallback } from 'react';

export interface SerialHook {
  connect: () => Promise<void>;
  disconnect: () => void;
  status: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
}

export function useSerial(
  onData: (bytes: Uint8Array) => void,
  baudRate = 9600
): SerialHook {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const runningRef = useRef(false);

  const readLoop = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    runningRef.current = true;
    try {
      while (runningRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) onData(value);
      }
    } catch (e: any) {
      if (runningRef.current) {
        setError(e.message || 'Read error');
        setStatus('disconnected');
      }
    }
  }, [onData]);

  const connect = useCallback(async () => {
    if (!navigator.serial) {
      setError('Web Serial not supported in this browser');
      return;
    }
    try {
      setStatus('connecting');
      setError(null);

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;

      if (port.readable) {
        const reader = port.readable.getReader();
        readerRef.current = reader;
        setStatus('connected');
        readLoop(reader);
      }
    } catch (e: any) {
      if (e.name !== 'NotFoundError') {
        setError(e.message || 'Connection failed');
      }
      setStatus('disconnected');
    }
  }, [baudRate, readLoop]);

  const disconnect = useCallback(async () => {
    runningRef.current = false;
    if (readerRef.current) {
      try { await readerRef.current.cancel(); } catch {}
      readerRef.current = null;
    }
    if (portRef.current) {
      try { await portRef.current.close(); } catch {}
      portRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  return { connect, disconnect, status, error };
}
