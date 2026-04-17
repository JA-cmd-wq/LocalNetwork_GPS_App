import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window { AMap: any; }
}

interface PoiResult {
  name: string;
  address: string;
}

const cache = new Map<string, PoiResult>();

function coordKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

export function useReverseGeocode(
  lat: number,
  lon: number,
  valid: boolean,
): PoiResult | null {
  const [result, setResult] = useState<PoiResult | null>(null);
  const lastKey = useRef('');

  useEffect(() => {
    if (!valid || !window.AMap) return;

    const key = coordKey(lat, lon);
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (cache.has(key)) {
      setResult(cache.get(key)!);
      return;
    }

    const geocoder = new (window.AMap as any).Geocoder();
    const lnglat = [lon, lat];

    geocoder.getAddress(lnglat, (status: string, res: any) => {
      if (status === 'complete' && res.regeocode) {
        const info = res.regeocode;
        const pois = info.pois;
        const poi: PoiResult = {
          name: pois?.[0]?.name || '',
          address: info.formattedAddress || '',
        };
        cache.set(key, poi);
        setResult(poi);
      }
    });
  }, [lat, lon, valid]);

  return result;
}

export function batchReverseGeocode(
  devices: { eui: string; lat: number; lon: number; valid: boolean }[],
  callback: (results: Map<string, PoiResult>) => void,
) {
  if (!window.AMap) return;

  const geocoder = new (window.AMap as any).Geocoder();
  const results = new Map<string, PoiResult>();
  let pending = 0;

  devices.forEach(d => {
    if (!d.valid) return;
    const key = coordKey(d.lat, d.lon);
    if (cache.has(key)) {
      results.set(d.eui, cache.get(key)!);
      return;
    }
    pending++;
    geocoder.getAddress([d.lon, d.lat], (status: string, res: any) => {
      if (status === 'complete' && res.regeocode) {
        const info = res.regeocode;
        const poi: PoiResult = {
          name: info.pois?.[0]?.name || '',
          address: info.formattedAddress || '',
        };
        cache.set(key, poi);
        results.set(d.eui, poi);
      }
      pending--;
      if (pending === 0) callback(results);
    });
  });

  if (pending === 0) callback(results);
}
