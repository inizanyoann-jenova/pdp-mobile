import { describe, it, expect } from 'vitest';
import { getPrioritizedCategories, calcScoreResiduel, calcScore } from '../utils/risques.js';

describe('getPrioritizedCategories', () => {
  it('returns empty array when no types selected', () => {
    expect(getPrioritizedCategories([])).toEqual([]);
  });

  it('maps travaux en hauteur to chute', () => {
    const result = getPrioritizedCategories(['Travaux en hauteur / Échafaudages']);
    expect(result).toContain('chute');
  });

  it('maps Électricité HT / BT to electrique', () => {
    const result = getPrioritizedCategories(['Électricité HT / BT']);
    expect(result).toContain('electrique');
  });

  it('maps Gaz to incendie', () => {
    const result = getPrioritizedCategories(['Gaz / Réseaux combustibles']);
    expect(result).toContain('incendie');
  });

  it('maps Désamiantage to chimique', () => {
    const result = getPrioritizedCategories(['Désamiantage / Amiante']);
    expect(result).toContain('chimique');
  });

  it('maps Travaux en espace confiné to chimique and epi', () => {
    const result = getPrioritizedCategories(['Travaux en espace confiné']);
    expect(result).toContain('chimique');
    expect(result).toContain('epi');
  });

  it('maps Travaux de nuit to acces and epi', () => {
    const result = getPrioritizedCategories(['Travaux de nuit']);
    expect(result).toContain('acces');
    expect(result).toContain('epi');
  });

  it('combines priorities from multiple types without duplicates', () => {
    const result = getPrioritizedCategories([
      'Travaux en hauteur / Échafaudages',
      'Électricité HT / BT',
    ]);
    expect(result).toContain('chute');
    expect(result).toContain('electrique');
    const chutCount = result.filter(c => c === 'chute').length;
    expect(chutCount).toBe(1);
  });

  it('returns only valid category IDs', () => {
    const validIds = ['acces', 'chute', 'electrique', 'incendie', 'chimique', 'mecanique', 'coactivite', 'meteo', 'epi'];
    const result = getPrioritizedCategories(['Toiture / Couverture', 'Levage / Manutention lourde']);
    result.forEach(id => expect(validIds).toContain(id));
  });
});

describe('calcScoreResiduel', () => {
  it('returns same score when no measures selected', () => {
    const measures = [
      { text: 'Mesure A', priorite: 'haute', selectionnee: false },
      { text: 'Mesure B', priorite: 'normale', selectionnee: false },
    ];
    expect(calcScoreResiduel(10, measures)).toBe(10);
  });

  it('subtracts 2 per haute-priority measure selected', () => {
    const measures = [
      { text: 'Mesure A', priorite: 'haute', selectionnee: true },
      { text: 'Mesure B', priorite: 'haute', selectionnee: true },
    ];
    expect(calcScoreResiduel(10, measures)).toBe(6);
  });

  it('subtracts 1 per normale-priority measure selected', () => {
    const measures = [
      { text: 'Mesure A', priorite: 'normale', selectionnee: true },
      { text: 'Mesure B', priorite: 'normale', selectionnee: true },
    ];
    expect(calcScoreResiduel(10, measures)).toBe(8);
  });

  it('combines haute and normale reductions', () => {
    const measures = [
      { text: 'Mesure A', priorite: 'haute', selectionnee: true },
      { text: 'Mesure B', priorite: 'normale', selectionnee: true },
      { text: 'Mesure C', priorite: 'haute', selectionnee: false },
    ];
    expect(calcScoreResiduel(10, measures)).toBe(7);
  });

  it('never goes below 0', () => {
    const measures = [
      { text: 'M1', priorite: 'haute', selectionnee: true },
      { text: 'M2', priorite: 'haute', selectionnee: true },
      { text: 'M3', priorite: 'haute', selectionnee: true },
    ];
    expect(calcScoreResiduel(2, measures)).toBe(0);
  });

  it('handles empty measures array', () => {
    expect(calcScoreResiduel(15, [])).toBe(15);
  });
});

describe('calcScore', () => {
  it('returns 0 for empty reponses', () => {
    expect(calcScore({})).toBe(0);
  });

  it('returns 25 when all answers are non', () => {
    const reponses = { q1: 'non', q2: 'non', q3: 'non', q4: 'non' };
    expect(calcScore(reponses)).toBe(25);
  });

  it('counts nsp at half weight', () => {
    const reponses = { q1: 'nsp', q2: 'nsp' };
    expect(calcScore(reponses)).toBe(13);
  });

  it('ignores oui answers', () => {
    const reponses = { q1: 'oui', q2: 'oui', q3: 'non' };
    expect(calcScore(reponses)).toBeGreaterThan(0);
    const reponsesTous = { q1: 'non', q2: 'non', q3: 'non' };
    expect(calcScore(reponses)).toBeLessThan(calcScore(reponsesTous));
  });
});
