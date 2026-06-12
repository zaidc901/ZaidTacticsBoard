import { FormationKey } from './formations';

export type FlagDirection = 'horizontal' | 'vertical';

export interface TeamPreset {
  id: string;
  name: string;
  initials: string;
  confederation: string;
  formation: FormationKey;
  primaryColor: string;
  secondaryColor: string;
  flagBands: string[];
  flagDirection?: FlagDirection;
}

export type PresetCollectionId = 'world-cup-2026' | 'premier-league' | 'laliga';

export const presetCollections: { id: PresetCollectionId; label: string; description: string }[] = [
  { id: 'world-cup-2026', label: 'World Cup 2026', description: 'All 48 qualified national teams' },
  { id: 'premier-league', label: 'Premier League', description: 'Club preset pack' },
  { id: 'laliga', label: 'La Liga', description: 'Club preset pack' },
];

export const teamPresets: TeamPreset[] = [
  { id: 'canada', name: 'Canada', initials: 'CAN', confederation: 'Hosts', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#dc2626'], flagDirection: 'vertical' },
  { id: 'mexico', name: 'Mexico', initials: 'MEX', confederation: 'Hosts', formation: '4-3-3', primaryColor: '#15803d', secondaryColor: '#ffffff', flagBands: ['#15803d', '#ffffff', '#dc2626'], flagDirection: 'vertical' },
  { id: 'usa', name: 'United States', initials: 'USA', confederation: 'Hosts', formation: '4-3-3', primaryColor: '#1d4ed8', secondaryColor: '#ef4444', flagBands: ['#b91c1c', '#ffffff', '#1d4ed8'] },
  { id: 'australia', name: 'Australia', initials: 'AUS', confederation: 'AFC', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#166534', flagBands: ['#1d4ed8', '#facc15', '#166534'] },
  { id: 'iraq', name: 'Iraq', initials: 'IRQ', confederation: 'AFC', formation: '4-4-2', primaryColor: '#166534', secondaryColor: '#ffffff', flagBands: ['#ce1126', '#ffffff', '#000000'] },
  { id: 'iran', name: 'IR Iran', initials: 'IRN', confederation: 'AFC', formation: '4-2-3-1', primaryColor: '#16a34a', secondaryColor: '#ffffff', flagBands: ['#16a34a', '#ffffff', '#dc2626'] },
  { id: 'japan', name: 'Japan', initials: 'JPN', confederation: 'AFC', formation: '3-4-2-1', primaryColor: '#2563eb', secondaryColor: '#ffffff', flagBands: ['#ffffff', '#bc002d', '#ffffff'] },
  { id: 'jordan', name: 'Jordan', initials: 'JOR', confederation: 'AFC', formation: '3-4-2-1', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#000000', '#ffffff', '#15803d'] },
  { id: 'korea-republic', name: 'Korea Republic', initials: 'KOR', confederation: 'AFC', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#2563eb', flagBands: ['#ffffff', '#dc2626', '#2563eb'] },
  { id: 'qatar', name: 'Qatar', initials: 'QAT', confederation: 'AFC', formation: '5-3-2', primaryColor: '#7f1d1d', secondaryColor: '#ffffff', flagBands: ['#ffffff', '#7f1d1d'] },
  { id: 'saudi-arabia', name: 'Saudi Arabia', initials: 'KSA', confederation: 'AFC', formation: '4-2-3-1', primaryColor: '#15803d', secondaryColor: '#ffffff', flagBands: ['#15803d', '#ffffff', '#15803d'] },
  { id: 'uzbekistan', name: 'Uzbekistan', initials: 'UZB', confederation: 'AFC', formation: '3-4-2-1', primaryColor: '#38bdf8', secondaryColor: '#ffffff', flagBands: ['#38bdf8', '#ffffff', '#16a34a'] },
  { id: 'algeria', name: 'Algeria', initials: 'ALG', confederation: 'CAF', formation: '4-3-3', primaryColor: '#15803d', secondaryColor: '#ffffff', flagBands: ['#15803d', '#ffffff'] },
  { id: 'cabo-verde', name: 'Cabo Verde', initials: 'CPV', confederation: 'CAF', formation: '4-3-3', primaryColor: '#1d4ed8', secondaryColor: '#facc15', flagBands: ['#1d4ed8', '#ffffff', '#dc2626', '#facc15'] },
  { id: 'congo-dr', name: 'Congo DR', initials: 'COD', confederation: 'CAF', formation: '4-2-3-1', primaryColor: '#2563eb', secondaryColor: '#facc15', flagBands: ['#2563eb', '#facc15', '#dc2626'] },
  { id: 'cote-divoire', name: "Cote d'Ivoire", initials: 'CIV', confederation: 'CAF', formation: '4-3-3', primaryColor: '#f97316', secondaryColor: '#ffffff', flagBands: ['#f97316', '#ffffff', '#16a34a'], flagDirection: 'vertical' },
  { id: 'egypt', name: 'Egypt', initials: 'EGY', confederation: 'CAF', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#000000'] },
  { id: 'ghana', name: 'Ghana', initials: 'GHA', confederation: 'CAF', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#dc2626', flagBands: ['#dc2626', '#facc15', '#15803d'] },
  { id: 'morocco', name: 'Morocco', initials: 'MAR', confederation: 'CAF', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#15803d', flagBands: ['#dc2626', '#15803d', '#dc2626'] },
  { id: 'senegal', name: 'Senegal', initials: 'SEN', confederation: 'CAF', formation: '4-3-3', primaryColor: '#16a34a', secondaryColor: '#facc15', flagBands: ['#16a34a', '#facc15', '#dc2626'], flagDirection: 'vertical' },
  { id: 'south-africa', name: 'South Africa', initials: 'RSA', confederation: 'CAF', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#16a34a', flagBands: ['#dc2626', '#ffffff', '#16a34a', '#1d4ed8'] },
  { id: 'tunisia', name: 'Tunisia', initials: 'TUN', confederation: 'CAF', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#dc2626'] },
  { id: 'curacao', name: 'Curacao', initials: 'CUW', confederation: 'Concacaf', formation: '4-2-3-1', primaryColor: '#1d4ed8', secondaryColor: '#facc15', flagBands: ['#1d4ed8', '#facc15', '#ffffff'] },
  { id: 'haiti', name: 'Haiti', initials: 'HAI', confederation: 'Concacaf', formation: '4-4-2', primaryColor: '#1d4ed8', secondaryColor: '#dc2626', flagBands: ['#1d4ed8', '#dc2626'] },
  { id: 'panama', name: 'Panama', initials: 'PAN', confederation: 'Concacaf', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#1d4ed8', flagBands: ['#ffffff', '#dc2626', '#1d4ed8'] },
  { id: 'argentina', name: 'Argentina', initials: 'ARG', confederation: 'CONMEBOL', formation: '4-3-3', primaryColor: '#38bdf8', secondaryColor: '#ffffff', flagBands: ['#38bdf8', '#ffffff', '#38bdf8'] },
  { id: 'brazil', name: 'Brazil', initials: 'BRA', confederation: 'CONMEBOL', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#16a34a', flagBands: ['#16a34a', '#facc15', '#1d4ed8'] },
  { id: 'colombia', name: 'Colombia', initials: 'COL', confederation: 'CONMEBOL', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#1d4ed8', flagBands: ['#facc15', '#1d4ed8', '#dc2626'] },
  { id: 'ecuador', name: 'Ecuador', initials: 'ECU', confederation: 'CONMEBOL', formation: '4-2-3-1', primaryColor: '#facc15', secondaryColor: '#1d4ed8', flagBands: ['#facc15', '#1d4ed8', '#dc2626'] },
  { id: 'paraguay', name: 'Paraguay', initials: 'PAR', confederation: 'CONMEBOL', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#1d4ed8', flagBands: ['#dc2626', '#ffffff', '#1d4ed8'] },
  { id: 'uruguay', name: 'Uruguay', initials: 'URU', confederation: 'CONMEBOL', formation: '4-3-3', primaryColor: '#38bdf8', secondaryColor: '#ffffff', flagBands: ['#ffffff', '#38bdf8', '#ffffff', '#38bdf8'] },
  { id: 'new-zealand', name: 'New Zealand', initials: 'NZL', confederation: 'OFC', formation: '4-3-3', primaryColor: '#111827', secondaryColor: '#ffffff', flagBands: ['#111827', '#1d4ed8', '#dc2626'] },
  { id: 'austria', name: 'Austria', initials: 'AUT', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#dc2626'] },
  { id: 'belgium', name: 'Belgium', initials: 'BEL', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#facc15', flagBands: ['#111827', '#facc15', '#dc2626'], flagDirection: 'vertical' },
  { id: 'bosnia', name: 'Bosnia and Herzegovina', initials: 'BIH', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#1d4ed8', secondaryColor: '#facc15', flagBands: ['#1d4ed8', '#facc15', '#ffffff'] },
  { id: 'croatia', name: 'Croatia', initials: 'CRO', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#1d4ed8'] },
  { id: 'czechia', name: 'Czechia', initials: 'CZE', confederation: 'UEFA', formation: '3-4-2-1', primaryColor: '#dc2626', secondaryColor: '#1d4ed8', flagBands: ['#ffffff', '#dc2626', '#1d4ed8'] },
  { id: 'england', name: 'England', initials: 'ENG', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#ffffff', secondaryColor: '#dc2626', flagBands: ['#ffffff', '#dc2626', '#ffffff'] },
  { id: 'france', name: 'France', initials: 'FRA', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', flagBands: ['#1d4ed8', '#ffffff', '#dc2626'], flagDirection: 'vertical' },
  { id: 'germany', name: 'Germany', initials: 'GER', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#ffffff', secondaryColor: '#111827', flagBands: ['#111827', '#dc2626', '#facc15'] },
  { id: 'netherlands', name: 'Netherlands', initials: 'NED', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#f97316', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#1d4ed8'] },
  { id: 'norway', name: 'Norway', initials: 'NOR', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#1d4ed8', flagBands: ['#dc2626', '#ffffff', '#1d4ed8'] },
  { id: 'portugal', name: 'Portugal', initials: 'POR', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#16a34a', flagBands: ['#16a34a', '#dc2626'], flagDirection: 'vertical' },
  { id: 'scotland', name: 'Scotland', initials: 'SCO', confederation: 'UEFA', formation: '3-4-2-1', primaryColor: '#1d4ed8', secondaryColor: '#ffffff', flagBands: ['#1d4ed8', '#ffffff', '#1d4ed8'] },
  { id: 'spain', name: 'Spain', initials: 'ESP', confederation: 'UEFA', formation: '4-3-3', primaryColor: '#dc2626', secondaryColor: '#facc15', flagBands: ['#dc2626', '#facc15', '#dc2626'] },
  { id: 'sweden', name: 'Sweden', initials: 'SWE', confederation: 'UEFA', formation: '4-4-2', primaryColor: '#facc15', secondaryColor: '#1d4ed8', flagBands: ['#1d4ed8', '#facc15', '#1d4ed8'] },
  { id: 'switzerland', name: 'Switzerland', initials: 'SUI', confederation: 'UEFA', formation: '3-4-2-1', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#dc2626'] },
  { id: 'turkiye', name: 'Turkiye', initials: 'TUR', confederation: 'UEFA', formation: '4-2-3-1', primaryColor: '#dc2626', secondaryColor: '#ffffff', flagBands: ['#dc2626', '#ffffff', '#dc2626'] },
];

export const teamPresetById = Object.fromEntries(teamPresets.map(preset => [preset.id, preset])) as Record<string, TeamPreset>;

const flagCodesByPresetId: Record<string, string> = {
  canada: 'ca',
  mexico: 'mx',
  usa: 'us',
  australia: 'au',
  iraq: 'iq',
  iran: 'ir',
  japan: 'jp',
  jordan: 'jo',
  'korea-republic': 'kr',
  qatar: 'qa',
  'saudi-arabia': 'sa',
  uzbekistan: 'uz',
  algeria: 'dz',
  'cabo-verde': 'cv',
  'congo-dr': 'cd',
  'cote-divoire': 'ci',
  egypt: 'eg',
  ghana: 'gh',
  morocco: 'ma',
  senegal: 'sn',
  'south-africa': 'za',
  tunisia: 'tn',
  curacao: 'cw',
  haiti: 'ht',
  panama: 'pa',
  argentina: 'ar',
  brazil: 'br',
  colombia: 'co',
  ecuador: 'ec',
  paraguay: 'py',
  uruguay: 'uy',
  'new-zealand': 'nz',
  austria: 'at',
  belgium: 'be',
  bosnia: 'ba',
  croatia: 'hr',
  czechia: 'cz',
  england: 'gb-eng',
  france: 'fr',
  germany: 'de',
  netherlands: 'nl',
  norway: 'no',
  portugal: 'pt',
  scotland: 'gb-sct',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  turkiye: 'tr',
};

export const flagImageUrlByPresetId = Object.fromEntries(
  Object.entries(flagCodesByPresetId).map(([id, code]) => [id, `https://flagcdn.com/w160/${code}.png`]),
) as Record<string, string>;
