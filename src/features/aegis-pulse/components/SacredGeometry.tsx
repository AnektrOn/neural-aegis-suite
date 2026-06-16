import { useId } from "react";
import type { RunePrincipleCode } from "../domain/types";

interface SacredGeometryProps {
  type: RunePrincipleCode;
  isGlowing?: boolean;
  /** 0–1 float for progressive illumination. Overrides isGlowing when provided. */
  glowIntensity?: number;
  glyphSvg?: string | null;
}

const KNOWN_CODES = new Set([
  "MENTALISM", "CORRESPONDENCE", "VIBRATION",
  "POLARITY", "RHYTHM", "CAUSE_EFFECT", "GENDER",
  "CHILD", "VICTIM", "PROSTITUTE", "SABOTEUR",
  "MYSTIC", "SAGE", "HEALER", "WARRIOR",
  "SOVEREIGN", "CREATOR", "EXPLORER", "REBEL",
  "LOVER", "CAREGIVER", "MAGICIAN", "JESTER",
  "KYBALION", "MYSS_ARCHETYPE", "ECHOLS", "AEGIS",
  "ENERGY", "GROUNDING", "SHIELDING", "DIRECTING", "CENTERING",
]);

function starPolygon(outerR: number, innerR: number, tips: number, cx = 50, cy = 50): string {
  return Array.from({ length: tips * 2 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / (tips * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function regularPolygon(r: number, sides: number, cx = 50, cy = 50, rotation = -Math.PI / 2): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides + rotation;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

const MYSS_STAR_12 = starPolygon(30, 13, 12);
const MYSS_SURVIVAL_DIAMOND = regularPolygon(20, 4, 50, 50, Math.PI / 4);

export function SacredGeometry({ type, isGlowing = true, glowIntensity, glyphSvg }: SacredGeometryProps) {
  const uid = useId();
  const effectiveGlow = glowIntensity !== undefined ? glowIntensity > 0 : isGlowing;
  const intensity = glowIntensity !== undefined ? glowIntensity : (isGlowing ? 1 : 0);
  const baseOpacity = 0.25 + intensity * 0.75;
  const blurRadius = Math.round(3 + intensity * 5);

  const goldFillPct = Math.round(intensity * 100);
  const goldStop = `${100 - goldFillPct}%`;

  const glowId = `glow${uid}`;
  const fillGradId = `gf${uid}`;
  const orbGradId = `og${uid}`;

  if (glyphSvg) {
    return (
      <div
        className="w-full h-full"
        style={{
          opacity: baseOpacity,
          filter: effectiveGlow ? `drop-shadow(0 0 ${blurRadius}px rgba(255,215,0,${(0.1 + intensity * 0.35).toFixed(2)}))` : "none",
          transition: "opacity 0.7s, filter 0.7s",
        }}
        dangerouslySetInnerHTML={{ __html: glyphSvg }}
      />
    );
  }

  const glowFilter = effectiveGlow ? `url(#${glowId})` : "none";
  const baseStroke = effectiveGlow ? "1.5" : "1";

  if (!KNOWN_CODES.has(type)) {
    return <GenericGlyph code={type} intensity={intensity} glowFilter={glowFilter} baseStroke={baseStroke} isGlowing={effectiveGlow} opacity={baseOpacity} glowId={glowId} />;
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: glowFilter, opacity: baseOpacity, transition: "opacity 0.7s" }}>
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset={goldStop} stopColor="rgba(255,255,255,0.45)" />
          <stop offset={goldStop} stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={orbGradId}>
          <stop offset="0%" stopColor={intensity > 0.5 ? "#fde68a" : "#ffffff"} />
          <stop offset="70%" stopColor={intensity > 0.5 ? "#fbbf24" : "#f8fafc"} />
          <stop offset="100%" stopColor={intensity > 0.5 ? "#d97706" : "#cbd5e1"} />
        </radialGradient>
      </defs>

      {type === "MENTALISM" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="30" strokeDasharray="2 4" />
          <polygon points="50,15 85,75 15,75" />
          {isGlowing && <circle cx="50" cy="35" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CORRESPONDENCE" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <polygon points="50,15 80,65 20,65" />
          <polygon points="50,85 80,35 20,35" />
          <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="1 3" />
          {isGlowing && <circle cx="50" cy="15" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="85" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "VIBRATION" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="35" strokeOpacity="0.5" />
          <circle cx="50" cy="35" r="20" strokeOpacity="0.3" />
          <circle cx="50" cy="65" r="20" strokeOpacity="0.3" />
          <path d="M50 15 Q 70 32 50 50 Q 30 68 50 85" strokeWidth={isGlowing ? "2" : "1"} />
          {isGlowing && <circle cx="50" cy="15" r="5" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="85" r="3" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "POLARITY" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <line x1="15" y1="50" x2="85" y2="50" />
          <circle cx="30" cy="50" r="12" />
          <circle cx="70" cy="50" r="12" />
          {isGlowing && <circle cx="30" cy="50" r="3" fill="#fff" stroke="none" />}
          {isGlowing && (
            <circle cx="70" cy="50" r="3" fill="#000" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
          )}
        </g>
      )}

      {type === "RHYTHM" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <path d="M 15 50 C 15 20, 50 20, 50 50 C 50 80, 85 80, 85 50" />
          <path d="M 15 50 C 15 80, 50 80, 50 50 C 50 20, 85 20, 85 50" strokeDasharray="2 4" />
          {isGlowing && <circle cx="15" cy="50" r="3" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="85" cy="50" r="3" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CAUSE_EFFECT" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="15" />
          <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="1 2" />
          <line x1="15" y1="50" x2="85" y2="50" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="50" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "GENDER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="40" />
          <circle cx="35" cy="50" r="22" />
          <circle cx="65" cy="50" r="22" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="35" cy="50" r="1.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="65" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {/* ── Myss Archetypes — Survival ── */}

      {type === "CHILD" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="28" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="10" />
          <line x1="50" y1="12" x2="50" y2="40" strokeDasharray="1 3" />
          <line x1="50" y1="60" x2="50" y2="88" strokeDasharray="1 3" />
          <line x1="12" y1="50" x2="40" y2="50" strokeDasharray="1 3" />
          <line x1="60" y1="50" x2="88" y2="50" strokeDasharray="1 3" />
          {isGlowing && <circle cx="50" cy="50" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="12" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "VICTIM" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <rect x="28" y="28" width="44" height="44" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="16" strokeDasharray="3 5" />
          <path d="M 18 82 L 82 18" strokeWidth={isGlowing ? "2" : "1"} />
          <path d="M 28 72 L 38 62 M 62 38 L 72 28" strokeOpacity="0.55" />
          {isGlowing && <circle cx="18" cy="82" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="82" cy="18" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "PROSTITUTE" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
          <polygon points="50,14 76,50 50,86 24,50" />
          <polygon points="50,28 64,50 50,72 36,50" strokeDasharray="2 3" />
          <line x1="14" y1="50" x2="86" y2="50" strokeOpacity="0.5" />
          <circle cx="50" cy="50" r="5" />
          {isGlowing && <circle cx="24" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="76" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="14" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "SABOTEUR" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeDasharray="3 5" strokeOpacity="0.45" />
          <polygon points="50,14 78,72 22,72" />
          <polygon points="50,86 22,28 78,28" strokeDasharray="3 4" />
          <path d="M 18 50 Q 50 30 82 50" strokeOpacity="0.65" />
          <line x1="50" y1="14" x2="50" y2="86" strokeDasharray="1 3" strokeOpacity="0.4" />
          {isGlowing && <circle cx="50" cy="50" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="22" cy="72" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="78" cy="72" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {/* ── Myss Archetypes — Personality ── */}

      {type === "MYSTIC" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <ellipse cx="50" cy="50" rx="32" ry="16" strokeOpacity="0.55" />
          <circle cx="50" cy="50" r="14" />
          <circle cx="50" cy="50" r="5" fill={isGlowing ? "#fff" : "none"} stroke="none" />
          <line x1="50" y1="12" x2="50" y2="30" strokeDasharray="1 2" />
          <line x1="50" y1="70" x2="50" y2="88" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="12" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="88" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "SAGE" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <polygon points="34,26 66,26 50,50" />
          <polygon points="50,50 34,74 66,74" />
          <line x1="26" y1="26" x2="74" y2="26" strokeWidth={isGlowing ? "2" : "1"} />
          <line x1="26" y1="74" x2="74" y2="74" strokeWidth={isGlowing ? "2" : "1"} />
          <line x1="50" y1="26" x2="50" y2="74" strokeDasharray="1 3" strokeOpacity="0.45" />
          {isGlowing && <circle cx="50" cy="50" r="3.5" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="34" cy="26" r="1.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="66" cy="26" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "HEALER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.25" />
          <circle cx="37" cy="50" r="22" />
          <circle cx="63" cy="50" r="22" />
          <ellipse cx="50" cy="50" rx="6" ry="18" fill={`url(#${orbGradId})`} fillOpacity={isGlowing ? 0.22 : 0} stroke="none" />
          <line x1="50" y1="32" x2="50" y2="68" strokeDasharray="1 2" strokeOpacity="0.5" />
          {isGlowing && <circle cx="50" cy="32" r="2.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="68" r="2.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="2" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "WARRIOR" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <polygon points="50,10 56,82 44,82" />
          <line x1="28" y1="60" x2="72" y2="60" strokeWidth={isGlowing ? "2" : "1"} />
          <path d="M 38 82 Q 50 72 62 82" strokeOpacity="0.55" />
          <line x1="50" y1="10" x2="50" y2="24" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="10" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="60" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "SOVEREIGN" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <rect x="24" y="44" width="52" height="32" />
          <line x1="14" y1="76" x2="86" y2="76" strokeWidth={isGlowing ? "2" : "1"} />
          <polygon points="38,44 50,24 62,44" />
          <line x1="50" y1="24" x2="50" y2="44" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="24" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="58" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CREATOR" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="24" strokeDasharray="2 4" strokeOpacity="0.45" />
          <path d="M 50 14 Q 86 50 50 86 Q 14 50 50 14" />
          <path d="M 14 50 Q 50 14 86 50 Q 50 86 14 50" strokeDasharray="2 3" strokeOpacity="0.65" />
          {isGlowing && <circle cx="50" cy="50" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="14" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="86" cy="50" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "EXPLORER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="22" strokeDasharray="2 4" />
          <polygon points="50,10 54,28 46,28" />
          <polygon points="50,90 46,72 54,72" strokeOpacity="0.45" />
          <polygon points="10,50 28,46 28,54" strokeOpacity="0.45" />
          <polygon points="90,50 72,54 72,46" strokeOpacity="0.45" />
          <line x1="50" y1="28" x2="50" y2="72" strokeOpacity="0.35" />
          <line x1="28" y1="50" x2="72" y2="50" strokeOpacity="0.35" />
          {isGlowing && <circle cx="50" cy="10" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "REBEL" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="36" strokeDasharray="4 5" strokeOpacity="0.45" />
          <polygon points="50,84 76,26 24,26" />
          <line x1="50" y1="84" x2="50" y2="50" strokeWidth={isGlowing ? "2" : "1"} />
          <path d="M 32 38 L 68 62 M 68 38 L 32 62" strokeOpacity="0.55" />
          {isGlowing && <circle cx="50" cy="84" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "LOVER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.3" />
          <circle cx="36" cy="38" r="18" />
          <circle cx="64" cy="38" r="18" />
          <path d="M 36 56 Q 50 72 64 56" strokeOpacity="0.65" />
          <path d="M 50 72 L 50 88" strokeDasharray="2 3" />
          {isGlowing && <circle cx="50" cy="72" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="36" cy="38" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="64" cy="38" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CAREGIVER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.25" />
          <path d="M 24 34 C 24 76, 50 86, 50 86 C 50 86, 76 76, 76 34 C 62 34, 50 24, 50 24 C 50 24, 38 34, 24 34" />
          <circle cx="50" cy="54" r="13" strokeDasharray="2 2" />
          <path d="M 50 24 L 50 34" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="54" r="4" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="24" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "MAGICIAN" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.25" />
          <path d="M 50 50 C 50 26, 14 26, 14 50 C 14 74, 50 74, 50 50 C 50 26, 86 26, 86 50 C 86 74, 50 74, 50 50" strokeWidth={isGlowing ? "1.75" : "1"} />
          <circle cx="50" cy="50" r="4" strokeDasharray="1 2" />
          {isGlowing && <circle cx="14" cy="50" r="2.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="86" cy="50" r="2.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="2" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "JESTER" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="36" strokeDasharray="2 6" strokeOpacity="0.45" />
          <polyline points="16,52 34,24 50,52 66,76 84,48" strokeWidth={isGlowing ? "2" : "1"} />
          <circle cx="34" cy="24" r="4" strokeOpacity="0.55" />
          <circle cx="66" cy="76" r="4" strokeOpacity="0.55" />
          {isGlowing && <circle cx="16" cy="52" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="84" cy="48" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="52" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {/* ── Collection Glyphs ── */}

      {type === "KYBALION" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <polygon points="50,14 72,38 64,78 36,78 28,38" />
          <polygon points="50,26 62,40 58,66 42,66 38,40" strokeDasharray="2 3" strokeOpacity="0.6" />
          <circle cx="50" cy="50" r="6" />
          {isGlowing && <circle cx="50" cy="14" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "MYSS_ARCHETYPE" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="24" strokeDasharray="2 4" strokeOpacity="0.5" />
          <polygon points={MYSS_STAR_12} />
          <polygon points={MYSS_SURVIVAL_DIAMOND} strokeDasharray="2 3" strokeOpacity="0.6" />
          <line x1="50" y1="26" x2="50" y2="74" strokeDasharray="1 3" strokeOpacity="0.35" />
          <line x1="26" y1="50" x2="74" y2="50" strokeDasharray="1 3" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="5" />
          {isGlowing && <circle cx="50" cy="50" r="2.5" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="20" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="80" cy="50" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="80" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="20" cy="50" r="2" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "ECHOLS" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <rect x="22" y="22" width="56" height="56" rx="4" strokeOpacity="0.35" />
          <line x1="22" y1="36" x2="78" y2="36" strokeDasharray="2 3" strokeOpacity="0.55" />
          <line x1="22" y1="50" x2="78" y2="50" strokeOpacity="0.75" />
          <line x1="22" y1="64" x2="78" y2="64" strokeDasharray="2 3" strokeOpacity="0.55" />
          <circle cx="50" cy="50" r="8" />
          <line x1="50" y1="22" x2="50" y2="78" strokeDasharray="1 3" strokeOpacity="0.4" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="36" r="1.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="64" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "ENERGY" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <path d="M 54 14 L 34 54 L 48 54 L 42 86 L 68 42 L 52 42 Z" />
          {isGlowing && <circle cx="50" cy="50" r="2.5" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "GROUNDING" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <path d="M 50 18 L 72 42 L 72 68 L 50 82 L 28 68 L 28 42 Z" />
          <line x1="50" y1="82" x2="50" y2="92" strokeOpacity="0.6" />
          <line x1="38" y1="92" x2="62" y2="92" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "SHIELDING" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <path d="M 50 14 L 76 28 L 76 54 Q 76 72 50 86 Q 24 72 24 54 L 24 28 Z" />
          <path d="M 50 24 L 66 34 L 66 54 Q 66 66 50 74 Q 34 66 34 54 L 34 34 Z" strokeDasharray="2 3" strokeOpacity="0.6" />
          {isGlowing && <circle cx="50" cy="48" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "DIRECTING" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="34" strokeOpacity="0.35" />
          <line x1="50" y1="16" x2="50" y2="84" />
          <line x1="16" y1="50" x2="84" y2="50" strokeOpacity="0.35" />
          <circle cx="50" cy="50" r="6" />
          {isGlowing && <circle cx="50" cy="22" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "CENTERING" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="36" />
          <circle cx="50" cy="50" r="22" strokeDasharray="2 4" strokeOpacity="0.55" />
          <circle cx="50" cy="50" r="8" />
          <line x1="50" y1="14" x2="50" y2="86" strokeDasharray="1 3" strokeOpacity="0.35" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
        </g>
      )}

      {type === "AEGIS" && (
        <g stroke={`url(#${fillGradId})`} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
          <path d="M 50 12 L 78 28 L 78 58 Q 78 78 50 88 Q 22 78 22 58 L 22 28 Z" />
          <path d="M 50 22 L 66 32 L 66 56 Q 66 68 50 74 Q 34 68 34 56 L 34 32 Z" strokeDasharray="2 3" strokeOpacity="0.6" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${orbGradId})`} stroke="none" />}
          {isGlowing && <circle cx="50" cy="12" r="2" fill="#fff" stroke="none" />}
        </g>
      )}
    </svg>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function GenericGlyph({
  code,
  intensity,
  glowFilter,
  baseStroke,
  isGlowing,
  opacity = 1,
  glowId,
}: {
  code: string;
  intensity: number;
  glowFilter: string;
  baseStroke: string;
  isGlowing: boolean;
  opacity?: number;
  glowId: string;
}) {
  const h = hashCode(code);
  const sides = (h % 5) + 4;
  const innerR = 18 + (h % 15);
  const outerR = 36 + (h % 5);

  const polygon = Array.from({ length: sides }, (_, i) => {
    const angle = ((2 * Math.PI) / sides) * i - Math.PI / 2;
    return `${50 + outerR * Math.cos(angle)},${50 + outerR * Math.sin(angle)}`;
  }).join(" ");

  const innerPolygon = Array.from({ length: sides }, (_, i) => {
    const angle = ((2 * Math.PI) / sides) * i + Math.PI / sides - Math.PI / 2;
    return `${50 + innerR * Math.cos(angle)},${50 + innerR * Math.sin(angle)}`;
  }).join(" ");

  const goldStop = `${100 - Math.round(intensity * 100)}%`;
  const gfId = `${glowId}-gf`;
  const ogId = `${glowId}-og`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: glowFilter, opacity, transition: "opacity 0.7s" }}>
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id={gfId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset={goldStop} stopColor="rgba(255,255,255,0.45)" />
          <stop offset={goldStop} stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={ogId}>
          <stop offset="0%" stopColor={intensity > 0.5 ? "#fde68a" : "#ffffff"} />
          <stop offset="70%" stopColor={intensity > 0.5 ? "#fbbf24" : "#f8fafc"} />
          <stop offset="100%" stopColor={intensity > 0.5 ? "#d97706" : "#cbd5e1"} />
        </radialGradient>
      </defs>
      <g stroke={`url(#${gfId})`} strokeWidth={baseStroke} fill="none">
        <circle cx="50" cy="50" r="38" strokeOpacity="0.35" />
        <circle cx="50" cy="50" r={outerR - 2} strokeDasharray="2 4" strokeOpacity="0.5" />
        <polygon points={polygon} />
        <polygon points={innerPolygon} strokeDasharray="2 3" strokeOpacity="0.7" />
        <circle cx="50" cy="50" r="5" strokeOpacity="0.45" />
        {isGlowing && <circle cx="50" cy="50" r="3" fill={`url(#${ogId})`} stroke="none" />}
        {isGlowing && <circle cx="50" cy={50 - outerR + 4} r="2" fill="#fff" stroke="none" />}
      </g>
    </svg>
  );
}
