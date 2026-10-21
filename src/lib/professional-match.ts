export interface MatchProfile {
  zone: string;
  available: boolean;
  name: string;
  skills: string[];
}
export function matchesProfessional(p: MatchProfile, filters: { query: string; zone: string; availability: string; tool: string }) {
  return (p.name + ' ' + p.skills.join(' ')).toLocaleLowerCase('es').includes(filters.query.toLocaleLowerCase('es'))
    && (!filters.zone || p.zone === filters.zone)
    && (!filters.availability || p.available === (filters.availability === 'disponible'))
    && (!filters.tool || p.skills.includes(filters.tool));
}
export function cardSkills(skills: string[]) { return skills.slice(0, 3); }