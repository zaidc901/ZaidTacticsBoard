export type BoardFormat = 'portrait' | 'landscape';
export type ExportRegion = 'full' | 'top' | 'bottom' | 'left' | 'right';
export type Tool = 'select' | 'pass' | 'dashed-line' | 'long-pass' | 'run' | 'zone' | 'circle-zone' | 'text' | 'goal-big' | 'goal-small' | 'cone-small' | 'cone-big' | 'mannequin' | 'mannequin-three' | 'freehand';
export type ThemeName = 'portfolio-light' | 'broadcast' | 'minimal' | 'dark' | 'whiteboard' | 'matchday' | 'editorial' | 'neon' | 'classic';
export type BallDesign = 'classic' | 'jabulani' | 'brazuca' | 'telstar18' | 'al-rihla' | 'trionda26' | 'premier-league' | 'laliga';
export type FillPattern = 'diagonal' | 'hazard' | 'question' | 'sad-face' | 'none' | 'vertical' | 'horizontal';
export type DockPosition = 'bottom' | 'right' | 'hidden';
export type DockTab = 'page' | 'style' | 'squad' | 'presets' | 'edit' | 'scenes' | 'export';

export interface ToolStyle {
  color: string;
  fill: string;
  stripeColor: string;
  strokeWidth: number;
  opacity: number;
  dashed: boolean;
  fillPattern: FillPattern;
}

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
  size?: number;
  nameBackground?: string;
  labelPosition: 'bottom' | 'top' | 'left' | 'right';
  markerStyle: 'circle' | 'number' | 'shirt' | 'initials';
  flag?: string;
  showNumber?: boolean;
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
  goalkeeperColor: string;
  badge?: string;
  showBadge?: boolean;
  showNumbers?: boolean;
  showNames?: boolean;
  preset?: string;
  formation: string;
  squad: Player[];
}

export interface Ball {
  x: number;
  y: number;
  size: number;
  design: BallDesign;
  locked: boolean;
  attachedPlayerId?: string;
}

export interface Drawing {
  id: string;
  type: 'arrow' | 'long-pass' | 'curve' | 'zone' | 'circle-zone' | 'polygon-zone' | 'line' | 'circle' | 'rect' | 'text' | 'goal-big' | 'goal-small' | 'cone-small' | 'cone-big' | 'mannequin' | 'mannequin-three' | 'freehand';
  points: number[];
  text?: string;
  color: string;
  fill?: string;
  stripeColor?: string;
  strokeWidth: number;
  opacity: number;
  dashed: boolean;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  linkedPlayerIds?: string[];
  followPlayers?: boolean;
  fillPattern?: FillPattern;
  rotation?: 0 | 90 | 180 | 270;
}

export interface PlaybackDrawing extends Drawing {
  transitionFromFillPattern?: FillPattern;
  fillPatternTransition?: number;
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
  pitchScaleX: number;
  pitchScaleY: number;
  grid: 'none' | 'thirds' | 'five-lanes' | 'fifteen' | 'custom';
  crop: 'full' | 'custom';
  flipDirection: boolean;
  pepZones: boolean;
  linkedAreasFollowPlayers: boolean;
  selectionColor: string;
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

export interface PlaybackFrame {
  playerPositions: Record<string, { x: number; y: number }>;
  ball: Ball;
  drawings: PlaybackDrawing[];
}
