// src/tests/exportPdf.test.js
import { describe, it, expect } from 'vitest';
import { buildAttentionPoints } from '../utils/exportPdf';

describe('buildAttentionPoints', () => {
  it('returns empty array for empty reponses', () => {
    const pdp = { reponses: {}, mesures_suggerees: [] };
    expect(buildAttentionPoints(pdp)).toEqual([]);
  });

  it('ignores oui responses', () => {
    const pdp = { reponses: { a1: 'oui', a2: 'oui' }, mesures_suggerees: [] };
    expect(buildAttentionPoints(pdp)).toHaveLength(0);
  });

  it('includes non responses with correct shape', () => {
    const pdp = { reponses: { a1: 'non' }, mesures_suggerees: [] };
    const result = buildAttentionPoints(pdp);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      categoryLabel: 'Accès & Balisage',
      categoryColor: '#3B82F6',
      reponse: 'non',
      observation: null,
      mesureText: null,
    });
    expect(typeof result[0].questionText).toBe('string');
  });

  it('includes nsp responses', () => {
    const pdp = { reponses: { c1: 'nsp' }, mesures_suggerees: [] };
    const result = buildAttentionPoints(pdp);
    expect(result).toHaveLength(1);
    expect(result[0].reponse).toBe('nsp');
    expect(result[0].categoryLabel).toBe('Chutes de hauteur & Plain-pied');
  });

  it('attaches selected measure via questionId', () => {
    const pdp = {
      reponses: { a1: 'non' },
      mesures_suggerees: [
        { questionId: 'a1', mesure: 'Installer signalisation conforme', selectionnee: true },
      ],
    };
    expect(buildAttentionPoints(pdp)[0].mesureText).toBe('Installer signalisation conforme');
  });

  it('ignores unselected measures', () => {
    const pdp = {
      reponses: { a1: 'non' },
      mesures_suggerees: [
        { questionId: 'a1', mesure: 'Mesure non retenue', selectionnee: false },
      ],
    };
    expect(buildAttentionPoints(pdp)[0].mesureText).toBeNull();
  });

  it('includes observation when present', () => {
    const pdp = {
      reponses: { e1: 'nsp' },
      mesures_suggerees: [],
      observations_questions: { e1: 'Armoire nord non fermée' },
    };
    expect(buildAttentionPoints(pdp)[0].observation).toBe('Armoire nord non fermée');
  });

  it('returns points in category order across multiple categories', () => {
    const pdp = {
      reponses: { a1: 'non', c1: 'nsp', e1: 'oui' },
      mesures_suggerees: [],
    };
    const result = buildAttentionPoints(pdp);
    expect(result).toHaveLength(2);
    expect(result[0].categoryLabel).toBe('Accès & Balisage');
    expect(result[1].categoryLabel).toBe('Chutes de hauteur & Plain-pied');
  });

  it('includes custom questions when answered non or nsp', () => {
    const pdp = {
      reponses: { custom_xyz: 'non' },
      mesures_suggerees: [],
      custom_questions: {
        acces: [{ id: 'custom_xyz', text: 'Risque spécifique site' }],
      },
    };
    const result = buildAttentionPoints(pdp);
    expect(result).toHaveLength(1);
    expect(result[0].questionText).toBe('Risque spécifique site');
    expect(result[0].categoryLabel).toBe('Accès & Balisage');
  });
});
