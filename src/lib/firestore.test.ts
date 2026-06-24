import { describe, it, expect } from 'vitest';
import { xpToLevel, timeAgo, formatCO2, difficultyLabel, difficultyColor, categoryLabel } from './firestore';

describe('xpToLevel', () => {
  it('calcula nivel correctamente', () => {
    const result = xpToLevel(0);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(0);
  });

  it('nivel 2 con 100 XP', () => {
    const result = xpToLevel(100);
    expect(result.level).toBe(2);
    expect(result.currentXp).toBe(0);
  });

  it('nivel 5 con 1600 XP', () => {
    const result = xpToLevel(1600);
    expect(result.level).toBe(5);
    expect(result.currentXp).toBe(0);
  });

  it('nunca retorna nivel menor a 1', () => {
    expect(xpToLevel(-100).level).toBe(1);
  });
});

describe('formatCO2', () => {
  it('formatea kg', () => expect(formatCO2(500)).toBe('500 kg'));
  it('formatea toneladas', () => expect(formatCO2(1500)).toBe('1.5 ton'));
  it('formatea 0', () => expect(formatCO2(0)).toBe('0 kg'));
});

describe('difficultyLabel', () => {
  it('retorna etiqueta correcta', () => {
    expect(difficultyLabel(1)).toBe('Principiante');
    expect(difficultyLabel(3)).toBe('Intermedio');
    expect(difficultyLabel(5)).toBe('Experto');
    expect(difficultyLabel(99)).toBe('Experto');
  });
});

describe('difficultyColor', () => {
  it('retorna clase de color', () => {
    expect(difficultyColor(1)).toContain('emerald');
    expect(difficultyColor(3)).toContain('amber');
    expect(difficultyColor(5)).toContain('red');
  });
});

describe('categoryLabel', () => {
  it('traduce categorías', () => {
    expect(categoryLabel('basics')).toBe('Fundamentos');
    expect(categoryLabel('led')).toBe('LED');
    expect(categoryLabel('unknown')).toBe('unknown');
  });
});

describe('timeAgo', () => {
  it('retorna "ahora" para fechas recientes', () => {
    expect(timeAgo(new Date().toISOString())).toBe('ahora');
  });

  it('retorna vacío para null', () => {
    expect(timeAgo(undefined)).toBe('');
  });
});
