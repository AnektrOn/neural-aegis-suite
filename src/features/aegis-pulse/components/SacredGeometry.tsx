import type { RunePrincipleCode } from "../domain/types";

interface SacredGeometryProps {
  type: RunePrincipleCode;
  isGlowing?: boolean;
}

export function SacredGeometry({ type, isGlowing = true }: SacredGeometryProps) {
  const strokeColor = isGlowing ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)";
  const glowFilter = isGlowing ? "url(#glow)" : "none";
  const baseStroke = isGlowing ? "1.5" : "1";

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: glowFilter }}>
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="orbGradient">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>

      {type === "MENTALISM" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="30" strokeDasharray="2 4" />
          <polygon points="50,15 85,75 15,75" />
          {isGlowing && <circle cx="50" cy="35" r="4" fill="url(#orbGradient)" stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CORRESPONDENCE" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <polygon points="50,15 80,65 20,65" />
          <polygon points="50,85 80,35 20,35" />
          <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="1 3" />
          {isGlowing && <circle cx="50" cy="15" r="3" fill="url(#orbGradient)" stroke="none" />}
          {isGlowing && <circle cx="50" cy="85" r="3" fill="url(#orbGradient)" stroke="none" />}
        </g>
      )}

      {type === "VIBRATION" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="35" strokeOpacity="0.5" />
          <circle cx="50" cy="35" r="20" strokeOpacity="0.3" />
          <circle cx="50" cy="65" r="20" strokeOpacity="0.3" />
          <path d="M50 15 Q 70 32 50 50 Q 30 68 50 85" strokeWidth={isGlowing ? "2" : "1"} />
          {isGlowing && <circle cx="50" cy="15" r="5" fill="url(#orbGradient)" stroke="none" />}
          {isGlowing && <circle cx="50" cy="50" r="2" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="50" cy="85" r="3" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "POLARITY" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
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
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="38" />
          <path d="M 15 50 C 15 20, 50 20, 50 50 C 50 80, 85 80, 85 50" />
          <path d="M 15 50 C 15 80, 50 80, 50 50 C 50 20, 85 20, 85 50" strokeDasharray="2 4" />
          {isGlowing && <circle cx="15" cy="50" r="3" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="85" cy="50" r="3" fill="#fff" stroke="none" />}
        </g>
      )}

      {type === "CAUSE_EFFECT" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="15" />
          <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="1 2" />
          <line x1="15" y1="50" x2="85" y2="50" strokeDasharray="1 2" />
          {isGlowing && <circle cx="50" cy="50" r="4" fill="url(#orbGradient)" stroke="none" />}
        </g>
      )}

      {type === "GENDER" && (
        <g stroke={strokeColor} strokeWidth={baseStroke} fill="none">
          <circle cx="50" cy="50" r="40" />
          <circle cx="35" cy="50" r="22" />
          <circle cx="65" cy="50" r="22" />
          {isGlowing && <circle cx="50" cy="50" r="3" fill="url(#orbGradient)" stroke="none" />}
          {isGlowing && <circle cx="35" cy="50" r="1.5" fill="#fff" stroke="none" />}
          {isGlowing && <circle cx="65" cy="50" r="1.5" fill="#fff" stroke="none" />}
        </g>
      )}
    </svg>
  );
}
