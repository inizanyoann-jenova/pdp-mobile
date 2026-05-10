// src/tests/settings.test.js
import { describe, it, expect } from 'vitest';

const DEFAULT_SETTINGS = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_logo_base64: null,
  pdf_primary_color: '#1e3a5f',
};

function mergeSettings(stored, overrides) {
  return { ...DEFAULT_SETTINGS, ...stored, ...overrides };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

describe('settings helpers', () => {
  it('mergeSettings uses defaults for missing fields', () => {
    const result = mergeSettings({}, {});
    expect(result.pdf_primary_color).toBe('#1e3a5f');
    expect(result.company_name).toBe('');
  });

  it('mergeSettings overrides defaults', () => {
    const result = mergeSettings({ company_name: 'ACME' }, {});
    expect(result.company_name).toBe('ACME');
  });

  it('hexToRgb convertit #1e3a5f correctement', () => {
    expect(hexToRgb('#1e3a5f')).toEqual([30, 58, 95]);
  });

  it('hexToRgb convertit #ef4444 correctement', () => {
    expect(hexToRgb('#ef4444')).toEqual([239, 68, 68]);
  });
});
