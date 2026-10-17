export type VideoTool = 'select' | 'arrow' | 'dashed-line' | 'run' | 'zone' | 'circle-zone' | 'player-circle' | 'connection-line' | 'highlight' | 'spotlight' | 'text';
export type VideoAnnotationType = Exclude<VideoTool, 'select'> | 'polygon-zone';
export type GridMode = 'off' | 'thirds' | 'lanes';
export type OverlayMotion = 'none' | 'fade' | 'pop' | 'slide';
export type OverlayPattern = 'none' | 'shine' | 'diagonal' | 'grid' | 'scan' | 'pulse-border';
export type EditCommand = 'move' | 'shape';

export type VideoClip = {
  id: string;
  file: File;
  name: string;
  url: string;
  duration: number;
  width: number;
  height: number;
};

export type VideoKeyframe = {
  id: string;
  time: number;
  points: number[];
};

export type VideoAnnotation = {
  id: string;
  type: VideoAnnotationType;
  points: number[];
  connectionIds?: string[];
  text?: string;
  labelVisible?: boolean;
  color: string;
  fill: string;
  strokeWidth: number;
  opacity: number;
  outlineOpacity: number;
  startTime: number;
  endTime: number;
  bend: number;
  dashed: boolean;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  motion: OverlayMotion;
  pattern: OverlayPattern;
  keyframes: VideoKeyframe[];
};

export type FreezeSegment = {
  id: string;
  time: number;
  duration: number;
};

export type TimelineSegment = {
  id: string;
  kind: 'video' | 'freeze';
  label: string;
  sourceStart: number;
  sourceEnd: number;
  duration: number;
  timelineStart: number;
  freezeId?: string;
};

export type VideoAnalysisToolProps = {
  onHome: () => void;
  onOpenBoard: () => void;
  active?: boolean;
};

export type Mapper = {
  width: number;
  height: number;
  toAbs: (x: number, y: number) => [number, number];
  toRel: (x: number, y: number) => { x: number; y: number };
};

export type Bounds = { x1: number; y1: number; x2: number; y2: number };

export type DrawingStyle = {
  color: string;
  fill: string;
  strokeWidth: number;
  opacity: number;
};

export type HistorySnapshot = {
  trimStart: number;
  trimEnd: number;
  annotations: VideoAnnotation[];
  freezes: FreezeSegment[];
};

