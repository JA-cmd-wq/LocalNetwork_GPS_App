/**
 * 行缓冲器 — 将 BLE/Serial 分块字节流拼接为完整文本行
 * BLE 每次 notification 最多 20 字节，一个 $LGPS 帧可能跨多个 notification
 * Serial 同理，读取块大小不固定
 */
export class LineBuffer {
  private buffer = '';
  private decoder = new TextDecoder('utf-8');

  /** 喂入原始字节，返回 0 或多条完整行 */
  feed(bytes: Uint8Array): string[] {
    this.buffer += this.decoder.decode(bytes, { stream: true });
    const lines: string[] = [];
    let idx: number;
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx).replace(/\r$/, '');
      this.buffer = this.buffer.slice(idx + 1);
      if (line.length > 0) lines.push(line);
    }
    // 防止缓冲区无限增长（异常情况）
    if (this.buffer.length > 1024) {
      this.buffer = this.buffer.slice(-512);
    }
    return lines;
  }

  /** 重置缓冲区 */
  reset(): void {
    this.buffer = '';
  }
}
