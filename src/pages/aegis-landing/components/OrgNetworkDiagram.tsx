const NODES: { x: number; y: number; r: number; alert?: boolean }[] = [
  { x: 86, y: 48, r: 5 },
  { x: 142, y: 36, r: 4 },
  { x: 198, y: 58, r: 6 },
  { x: 248, y: 28, r: 4 },
  { x: 52, y: 102, r: 4 },
  { x: 118, y: 118, r: 7, alert: true },
  { x: 176, y: 96, r: 5 },
  { x: 232, y: 124, r: 4 },
  { x: 74, y: 168, r: 5 },
  { x: 148, y: 176, r: 4 },
  { x: 210, y: 162, r: 6 },
  { x: 268, y: 88, r: 4 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 5],
  [1, 2],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 11],
  [4, 5],
  [4, 8],
  [5, 6],
  [5, 9],
  [6, 7],
  [6, 10],
  [7, 11],
  [8, 9],
  [9, 10],
];

export function OrgNetworkDiagram({
  className = "",
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 320 210"
      className={className}
      role="img"
      aria-label={label}
    >
      {EDGES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          stroke="#C9BDB4"
          strokeWidth="1"
        />
      ))}
      {NODES.map((n, i) =>
        n.alert ? (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r + 5}
              fill="none"
              stroke="var(--aegis-alert)"
              strokeWidth="1.4"
            />
            <rect
              x={n.x - n.r}
              y={n.y - n.r}
              width={n.r * 2}
              height={n.r * 2}
              fill="var(--aegis-alert)"
            />
          </g>
        ) : (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="#8A7D74"
          />
        ),
      )}
    </svg>
  );
}
