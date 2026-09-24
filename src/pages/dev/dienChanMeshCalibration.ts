/** Diagram UV → cible sur la bbox du mesh (marges tempes / menton). */
export function diagramUvToMeshTarget(du: number, dv: number): { u: number; v: number } {
  const U_MARGIN = 0.05;
  const V_BOTTOM = 0.13;
  const V_TOP = 0.93;
  return {
    u: U_MARGIN + du * (1 - 2 * U_MARGIN),
    v: V_BOTTOM + dv * (V_TOP - V_BOTTOM),
  };
}

/** Fallback si la géométrie n'est pas encore disponible. */
export function mapBqcUvToMeshUv(u: number, v: number): { u: number; v: number } {
  return diagramUvToMeshTarget(u, v);
}

export function isLateralDiagramUv(du: number): boolean {
  return Math.abs(du - 0.5) > 0.32;
}

/** Ajuste fin diagramme → enveloppe écran du mesh (face caméra). */
export function refineDiagramUvForPlacement(du: number, dv: number): { u: number; v: number } {
  if (isLateralDiagramUv(du)) {
    return diagramUvToMeshTarget(du, dv);
  }
  const u = 0.04 + du * 0.92;
  const v = 0.1 + dv * 0.82;
  return { u, v };
}
