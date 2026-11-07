/** Fallback when WebRTC output FFT is unavailable — shaped like a voiced spectrum. */
export function synthesizeSpectrumFromVolume(volume: number): Uint8Array {
  const v = Math.min(1, Math.max(0, volume));
  const buf = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const envelope = Math.exp(-t * 2.8) * (0.9 + 0.1 * Math.sin(i * 0.17));
    buf[i] = Math.round(255 * v * envelope);
  }
  return buf;
}
