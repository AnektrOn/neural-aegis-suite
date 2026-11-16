export type NetworkNode = { x: number; y: number; r: number; alert?: boolean; label?: string };

export const DECISION_NETWORK_NODES: NetworkNode[] = [
  { x: 86, y: 48, r: 5, label: "Board" },
  { x: 142, y: 36, r: 4, label: "Produit" },
  { x: 198, y: 58, r: 6, label: "Sales" },
  { x: 248, y: 28, r: 4 },
  { x: 52, y: 102, r: 4 },
  { x: 118, y: 118, r: 7, alert: true, label: "COO" },
  { x: 176, y: 96, r: 5, label: "Ops" },
  { x: 232, y: 124, r: 4 },
  { x: 74, y: 168, r: 5 },
  { x: 148, y: 176, r: 4, label: "RH" },
  { x: 210, y: 162, r: 6 },
  { x: 268, y: 88, r: 4 },
];

export const DECISION_NETWORK_EDGES: [number, number][] = [
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