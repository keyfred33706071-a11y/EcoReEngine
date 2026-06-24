import { describe, it, expect } from 'vitest';
import { isNewerVersion } from './version';

describe('isNewerVersion', () => {
  it('detecta versión más reciente', () => {
    expect(isNewerVersion('2.0.0', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.1.0', '1.0.9')).toBe(true);
    expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '2.0.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(false);
  });

  it('maneja versiones sin prefijo v (parseVersion limpia)', () => {
    expect(isNewerVersion('2.0.0', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '2.0.0')).toBe(false);
  });

  it('maneja strings vacíos', () => {
    expect(isNewerVersion('', '1.0.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '')).toBe(false);
  });
});
