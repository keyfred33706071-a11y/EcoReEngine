import { describe, it, expect } from 'vitest';
import { sanitize } from './sanitize';

describe('sanitize', () => {
  it('limpia texto normal', () => {
    expect(sanitize('Hola mundo')).toBe('Hola mundo');
  });

  it('escapa HTML', () => {
    expect(sanitize('<script>alert("xss")</script>')).not.toContain('<script>');
  });

  it('permite caracteres acentuados', () => {
    expect(sanitize('íñóú áé')).toContain('íñóú áé');
  });

  it('escapa etiquetas HTML básicas', () => {
    const result = sanitize('<b>negrita</b>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('negrita');
  });

  it('maneja strings vacíos', () => {
    expect(sanitize('')).toBe('');
  });
});
