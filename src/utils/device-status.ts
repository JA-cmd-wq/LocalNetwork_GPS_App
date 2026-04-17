import type { DeviceInfo, GPSPoint } from '../types/device';

/** 设备离线判定阈值：超过该时间未收到更新视为离线 */
export const DEVICE_OFFLINE_THRESHOLD_MS = 10_000;

/** 数据流超时阈值：蓝牙已连接但超过该时间没收到任何 $LGPS 帧视为数据停滞 */
export const DATA_STALE_THRESHOLD_MS = 10_000;

/** 轨迹保留时间窗口：超过该时间的轨迹点将被淘汰（30 分钟） */
export const TRACK_RETENTION_MS = 30 * 60 * 1000;

/**
 * 判断设备是否离线
 * @param device 设备信息
 * @param now   当前时间戳（默认 Date.now()）
 */
export function isDeviceOffline(device: DeviceInfo, now: number = Date.now()): boolean {
  return now - device.lastUpdate > DEVICE_OFFLINE_THRESHOLD_MS;
}

/**
 * 按时间窗过滤轨迹点，淘汰超过 TRACK_RETENTION_MS 的老点
 */
export function filterTrackByTime(track: GPSPoint[], now: number = Date.now()): GPSPoint[] {
  const cutoff = now - TRACK_RETENTION_MS;
  return track.filter(p => p.timestamp >= cutoff);
}
