import { describe, expect, it } from 'vitest';
import { cardSkills, matchesProfessional } from '@/lib/professional-match';
const p = { name: 'Ana', zone: 'CABA', available: true, skills: ['Pictogramas', 'Primer Grado', 'Comunicación', 'Lectura'] };
const filters = { query: '', zone: '', availability: '', tool: '' };
describe('Professional match', () => {
  it('limits cards to three specialties', () => { expect(cardSkills(p.skills)).toEqual(['Pictogramas', 'Primer Grado', 'Comunicación']); });
  it('filters by zone', () => { expect(matchesProfessional(p, { ...filters, zone: 'CABA' })).toBe(true); expect(matchesProfessional(p, { ...filters, zone: 'Rosario' })).toBe(false); });
  it('filters by availability', () => { expect(matchesProfessional(p, { ...filters, availability: 'disponible' })).toBe(true); expect(matchesProfessional(p, { ...filters, availability: 'no-disponible' })).toBe(false); });
  it('filters by tools', () => { expect(matchesProfessional(p, { ...filters, tool: 'Pictogramas' })).toBe(true); expect(matchesProfessional(p, { ...filters, tool: 'Braille' })).toBe(false); });
});