export type BoardFormat = 'portrait' | 'landscape' | 'square' | 'custom';
export type Tool = 'select' | 'pass' | 'run' | 'zone' | 'text' | 'freehand' | 'erase';
export type ThemeName = 'broadcast' | 'minimal' | 'dark' | 'whiteboard' | 'matchday' | 'editorial' | 'neon' | 'classic';

export interface Player {
  id: string;
  teamId: string;
  fullName: string;
  displayName: string;
  number: number;
  position: string;
  x: number;
  y: number;
  color: string;
  secondaryColor: string;
  outline: string;
  opacity: number;
  labelPosition: 'bottom' | 'top' | 'left' | 'right';
  markerStyle: 'circle' | 'number' | 'shirt' | 'initials';
  starter: boolean;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  badge?: string;
  formation: string;
  squad: Player[];
}

export interface Ball {
  x: number;
  y: number;
  size: number;
  locked: boolean;
  attachedPlayerId?: string;
}

export interface Drawing {
  id: string;
  type: 'arrow' | 'curve' | 'zone' | 'line' | 'circle' | 'rect' | 'text' | 'freehand';
  points: number[];
  text?: string;
  color: string;
  fill?: string;
  strokeWidth: number;
  opacity: number;
  dashed: boolean;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
}

export interface Scene {
  id: string;
  name: string;
  duration: number;
  transition: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  playerPositions: Record<string, { x: number; y: number }>;
  ball: Ball;
  drawings: Drawing[];
  camera: { x: number; y: number; zoom: number };
}

export interface BoardSettings {
  format: BoardFormat;
  width: number;
  height: number;
  customWidth: number;
  customHeight: number;
  grassColor: string;
  lineColor: string;
  lineThickness: number;
  stripeIntensity: number;
  backgroundColor: string;
  border: boolean;
  grid: 'none' | 'thirds' | 'five-lanes' | 'fifteen' | 'custom';
  crop: 'full' | 'half' | 'attacking-third' | 'defensive-third' | 'custom';
  flipDirection: boolean;
  theme: ThemeName;
  accentColor: string;
}

export interface Project {
  id: string;
  name: string;
  teams: Team[];
  ball: Ball;
  drawings: Drawing[];
  scenes: Scene[];
  settings: BoardSettings;
  updatedAt: string;
}
