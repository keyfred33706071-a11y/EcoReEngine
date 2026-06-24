// Comparación de versiones semánticas "x.y.z" para el flujo OTA.
// Extraído de App.tsx para poder testearlo de forma aislada.

export function parseVersion(v: string): [number, number, number] | null {
  const parts = v.split('.').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

/**
 * Devuelve true si `remote` es estrictamente más nueva que `current`.
 * Si alguna versión es inválida, devuelve false (no fuerza actualización).
 */
export function isNewerVersion(remote: string, current: string): boolean {
  const r = parseVersion(remote);
  const c = parseVersion(current);
  if (!r || !c) return false;
  for (let i = 0; i < 3; i++) {
    if (r[i] > c[i]) return true;
    if (r[i] < c[i]) return false;
  }
  return false;
}
