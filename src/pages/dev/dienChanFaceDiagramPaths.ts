/**
 * Silhouette simplifiée alignée viewBox 400×450 (Moricoli / BQC).
 * Repère identique à dienChanBqcCoordinates.
 */

export const DIEN_CHAN_FACE_DIAGRAM_PATHS: {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
}[] = [
  {
    d: "M 200 58 C 118 62 88 118 92 198 C 94 248 108 298 128 338 C 148 378 172 392 200 394 C 228 392 252 378 272 338 C 292 298 306 248 308 198 C 312 118 282 62 200 58 Z",
    stroke: "rgba(255,255,255,0.35)",
    strokeWidth: 1.2,
    fill: "rgba(255,255,255,0.04)",
  },
  {
    d: "M 118 228 C 108 210 104 188 108 168 C 112 148 124 132 138 128",
    stroke: "rgba(255,255,255,0.2)",
    strokeWidth: 1,
  },
  {
    d: "M 282 228 C 292 210 296 188 292 168 C 288 148 276 132 262 128",
    stroke: "rgba(255,255,255,0.2)",
    strokeWidth: 1,
  },
  {
    d: "M 200 95 L 200 355",
    stroke: "rgba(255,255,255,0.08)",
    strokeWidth: 0.8,
  },
  {
    d: "M 148 178 C 168 172 188 170 200 172 C 212 170 232 172 252 178",
    stroke: "rgba(255,255,255,0.15)",
    strokeWidth: 1,
  },
  {
    d: "M 168 248 Q 200 268 232 248",
    stroke: "rgba(255,255,255,0.12)",
    strokeWidth: 1,
  },
  {
    d: "M 200 218 L 200 278",
    stroke: "rgba(255,255,255,0.1)",
    strokeWidth: 0.9,
  },
];
