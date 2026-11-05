export type PlayerRole = 'GK' | 'DEF' | 'MID' | 'FWD' | 'Unknown';
export type MetricKey = 'goals' | 'assists' | 'xg' | 'xa' | 'xgot' | 'npxg' | 'shots' | 'shotsOnTarget' | 'progressivePasses' | 'progressiveCarries' | 'keyPasses' | 'passesIntoBox' | 'passAccuracy' | 'touches' | 'tackles' | 'interceptions' | 'sca' | 'xT';
export type PlayerStats = {
  id: string; name: string; club: string; teamId: string; role: PlayerRole;
  minutes: number; appearances: number;
  metrics: Record<MetricKey, number | null>;
  coverage: Record<MetricKey, number>;
  personal?: boolean;
  sampleLabel?: string;
};
export type StatsDataset = {
  version: 1; source: 'PitchAPI' | 'Demo' | 'CSV'; season: string; updatedAt: string;
  matches: number; players: PlayerStats[]; matchList?: PitchMatch[];
  label?: string;
};
export type PitchMatch = { id: string; date: string; status: string; home_team: { id: string; name: string }; away_team: { id: string; name: string } };
export type PitchLeague = { id: string; name: string; country_code: string; seasons: string[] };
export type Heatmap = { grid: { length: number; width: number; frame: string }; players: { player: { id: string; name: string }; cells: number[][]; actions: number }[] };
