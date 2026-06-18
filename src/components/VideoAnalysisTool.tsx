import { ChangeEvent, DragEvent as ReactDragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { ArrowLeft, ArrowRight, Circle as CircleIcon, Copy, Download, Eraser, Eye, EyeOff, Film, Gauge, Grid3X3, HelpCircle, Home, KeyRound, Lock, Moon, MousePointer2, MoveRight, Pause, Play, Plus, Redo2, Route, Scissors, Snowflake, Sparkles, Square, Sun, Trash2, Type, Undo2, Unlock, Upload, Video, X } from 'lucide-react';
import { Arrow, Circle, Ellipse, Group, Layer, Line, Rect, Stage, Text } from 'react-konva';

type VideoTool = 'select' | 'arrow' | 'dashed-line' | 'run' | 'zone' | 'circle-zone' | 'player-circle' | 'connection-line' | 'highlight' | 'spotlight' | 'text';
type VideoAnnotationType = Exclude<VideoTool, 'select'> | 'polygon-zone';
type GridMode = 'off' | 'thirds' | 'lanes';
type OverlayMotion = 'none' | 'fade' | 'pop' | 'slide';
type OverlayPattern = 'none' | 'shine' | 'diagonal' | 'grid' | 'scan' | 'pulse-border';
type EditCommand = 'move' | 'shape';

type VideoClip = {
  id: string;
  file: File;
  name: string;
  url: string;
  duration: number;
  width: number;
  height: number;
};

type VideoKeyframe = {
  id: string;
  time: number;
  points: number[];
};

type VideoAnnotation = {
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

type FreezeSegment = {
  id: string;
  time: number;
  duration: number;
};

type TimelineSegment = {
  id: string;
  kind: 'video' | 'freeze';
  label: string;
  sourceStart: number;
  sourceEnd: number;
  duration: number;
  timelineStart: number;
  freezeId?: string;
};

type VideoAnalysisToolProps = {
  onHome: () => void;
  onOpenBoard: () => void;
  active?: boolean;
};

type Mapper = {
  width: number;
  height: number;
  toAbs: (x: number, y: number) => [number, number];
  toRel: (x: number, y: number) => { x: number; y: number };
};

type Bounds = { x1: number; y1: number; x2: number; y2: number };

type DrawingStyle = {
  color: string;
  fill: string;
  strokeWidth: number;
  opacity: number;
};

type HistorySnapshot = {
  annotations: VideoAnnotation[];
  freezes: FreezeSegment[];
};

const id = () => crypto.randomUUID();
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampRange = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, Math.max(0, ms)));
const FRAME_STEP_SECONDS = 1 / 30;
const MIN_ANNOTATION_DURATION = FRAME_STEP_SECONDS;
const HIT_FILL = 'rgba(255,255,255,0.01)';

const defaultStyle: DrawingStyle = {
  color: '#38bdf8',
  fill: '#22c55e',
  strokeWidth: 3,
  opacity: 0.3,
};

const tools: { id: VideoTool; label: string; icon: any }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'arrow', label: 'Pass arrow', icon: MoveRight },
  { id: 'dashed-line', label: 'Dashed line', icon: Grid3X3 },
  { id: 'run', label: 'Carry run', icon: Route },
  { id: 'zone', label: 'Tactical area', icon: Square },
  { id: 'circle-zone', label: 'Round area', icon: CircleIcon },
  { id: 'player-circle', label: 'Player disc', icon: CircleIcon },
  { id: 'spotlight', label: 'Spotlight', icon: Sparkles },
  { id: 'text', label: 'Name tag', icon: Type },
];

const motionOptions: { id: OverlayMotion; label: string }[] = [
  { id: 'pop', label: 'Pop' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'none', label: 'None' },
];

const patternOptions: { id: OverlayPattern; label: string }[] = [
  { id: 'diagonal', label: 'Moving lines' },
  { id: 'grid', label: 'Tactical grid' },
  { id: 'scan', label: 'Scanner sweep' },
  { id: 'shine', label: 'Static shine' },
  { id: 'none', label: 'None' },
];

function defaultMotion(type: VideoAnnotationType): OverlayMotion {
  if (type === 'text') return 'fade';
  if (type === 'player-circle' || type === 'connection-line') return 'fade';
  if (type === 'arrow' || type === 'dashed-line' || type === 'run') return 'slide';
  return 'pop';
}

function defaultPattern(type: VideoAnnotationType): OverlayPattern {
  if (type === 'zone' || type === 'polygon-zone' || type === 'circle-zone') return 'diagonal';
  return 'none';
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 900, height: 560 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00.00';
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe - mins * 60;
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
}

function secondsLabel(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${safe < 1 ? safe.toFixed(2) : safe.toFixed(1)}s`;
}

function makeMapper(width: number, height: number): Mapper {
  return {
    width,
    height,
    toAbs: (x, y) => [x * width, y * height],
    toRel: (x, y) => ({ x: clamp01(x / Math.max(1, width)), y: clamp01(y / Math.max(1, height)) }),
  };
}

function displaySize(container: { width: number; height: number }, video: Pick<VideoClip, 'width' | 'height'> | undefined) {
  const ratio = Math.max(0.1, (video?.width || 1280) / (video?.height || 720));
  const availableWidth = Math.max(240, container.width - 16);
  const availableHeight = Math.max(160, container.height - 16);
  let targetWidth = Math.min(1152, availableWidth);
  let targetHeight = targetWidth / ratio;
  if (targetHeight > availableHeight) {
    targetHeight = availableHeight;
    targetWidth = targetHeight * ratio;
  }
  return { width: Math.round(targetWidth), height: Math.round(targetHeight) };
}

function scaledSize(size: { width: number; height: number }, scale: number) {
  const safeScale = clampRange(scale || 1, 1, 1.7);
  return {
    width: Math.round(size.width * safeScale),
    height: Math.round(size.height * safeScale),
  };
}

function bestVideoMimeType() {
  const types = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) ?? '';
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>(resolve => {
    const done = () => {
      video.removeEventListener('seeked', done);
      resolve();
    };
    video.addEventListener('seeked', done, { once: true });
    video.currentTime = clampRange(time, 0, video.duration || time);
    window.setTimeout(done, 220);
  });
}

function waitForVideoMetadata(video: HTMLVideoElement) {
  return new Promise<void>(resolve => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    const done = () => {
      video.removeEventListener('loadedmetadata', done);
      resolve();
    };
    video.addEventListener('loadedmetadata', done, { once: true });
    window.setTimeout(done, 1000);
    video.load();
  });
}

function buildAnnotation(tool: VideoTool, start: number[], end: number[], style: DrawingStyle, time: number, zIndex: number): VideoAnnotation | null {
  if (tool === 'select') return null;
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const playerCircleTool = tool === 'player-circle';
  const spotlightTool = tool === 'spotlight';
  const ellipseTool = tool === 'highlight' || spotlightTool || playerCircleTool;
  const pointTool = tool === 'text' || ellipseTool;
  const defaultEnd = tool === 'text'
    ? [clamp01(start[0] + 0.11), clamp01(start[1] + 0.065)]
    : ellipseTool
      ? [clamp01(start[0] + (playerCircleTool ? 0.13 : spotlightTool ? 0.16 : 0.045)), clamp01(start[1] + (playerCircleTool ? 0.045 : spotlightTool ? 0.16 : 0.15))]
      : end;
  const safeEnd = pointTool && distance < 0.006 ? defaultEnd : end;
  const x = Math.min(start[0], safeEnd[0]);
  const y = Math.min(start[1], safeEnd[1]);
  const width = Math.abs(safeEnd[0] - start[0]);
  const height = Math.abs(safeEnd[1] - start[1]);
  const type = tool;
  const points = type === 'zone'
    ? [x, y, width, height]
    : type === 'text'
      ? [start[0], start[1]]
      : [start[0], start[1], safeEnd[0], safeEnd[1]];
  const defaultDuration = tool === 'highlight' || tool === 'spotlight' || tool === 'player-circle' ? 4 : tool === 'connection-line' ? 3.5 : tool === 'text' ? 3 : 2.5;
  const annotation: VideoAnnotation = {
    id: id(),
    type,
    points,
    text: type === 'text' ? 'Press' : type === 'highlight' || type === 'spotlight' || type === 'player-circle' ? 'Player' : undefined,
    labelVisible: type === 'text' || type === 'highlight' || type === 'spotlight',
    color: type === 'player-circle' ? '#ffffff' : type === 'spotlight' ? '#dbeafe' : type === 'highlight' ? '#facc15' : style.color,
    fill: type === 'player-circle' ? '#f8fafc' : type === 'spotlight' ? '#dbeafe' : type === 'highlight' ? '#facc15' : style.fill,
    strokeWidth: type === 'player-circle' ? 2 : ellipseTool ? Math.max(2, Math.min(4.5, style.strokeWidth)) : style.strokeWidth,
    opacity: type === 'player-circle' ? 0.16 : type === 'spotlight' ? 0.78 : type === 'zone' || type === 'circle-zone' || ellipseTool ? style.opacity : 1,
    outlineOpacity: type === 'player-circle' || type === 'spotlight' ? 0 : 1,
    startTime: Math.max(0, time),
    endTime: Math.max(time + 0.5, time + defaultDuration),
    bend: type === 'run' ? 0.24 : 0,
    dashed: type === 'dashed-line' || type === 'run',
    locked: false,
    hidden: false,
    zIndex,
    motion: defaultMotion(type),
    pattern: defaultPattern(type),
    keyframes: [],
  };
  return upsertKeyframe(annotation, time, points);
}

function upsertKeyframe(annotation: VideoAnnotation, time: number, points: number[]) {
  const rounded = Math.max(0, Number(time.toFixed(2)));
  const index = annotation.keyframes.findIndex(keyframe => Math.abs(keyframe.time - rounded) < 0.08);
  const nextKeyframe = { id: index >= 0 ? annotation.keyframes[index].id : id(), time: rounded, points: points.map(clamp01) };
  const keyframes = index >= 0
    ? annotation.keyframes.map((keyframe, keyframeIndex) => keyframeIndex === index ? nextKeyframe : keyframe)
    : [...annotation.keyframes, nextKeyframe];
  return { ...annotation, points: nextKeyframe.points, keyframes: keyframes.sort((a, b) => a.time - b.time) };
}

function isAnnotationActive(annotation: VideoAnnotation, time: number) {
  return time >= annotation.startTime - 0.035 && time <= annotation.endTime + 0.035;
}

function annotationDuration(annotation: VideoAnnotation) {
  return Math.max(MIN_ANNOTATION_DURATION, annotation.endTime - annotation.startTime);
}

function annotationLabelVisible(annotation: VideoAnnotation) {
  if (annotation.type === 'player-circle') return annotation.labelVisible === true;
  return annotation.labelVisible !== false;
}

function overlayVisualState(annotation: VideoAnnotation, time: number, forceVisible = false) {
  if (annotation.motion === 'none') return { opacity: 1, scale: 1, slide: 0 };
  if (forceVisible && !isAnnotationActive(annotation, time)) return { opacity: 0.78, scale: 1, slide: 0 };
  const fadeWindow = Math.min(0.58, annotationDuration(annotation) / 2.05);
  const entering = clampRange((time - annotation.startTime) / Math.max(0.001, fadeWindow), 0, 1);
  const leaving = clampRange((annotation.endTime - time) / Math.max(0.001, fadeWindow), 0, 1);
  const progress = Math.min(entering, leaving);
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  const overshoot = annotation.motion === 'pop' && entering < 1 && leaving >= 0.98 ? Math.sin(entering * Math.PI) * 0.045 : 0;
  const visibleProgress = Math.max(0.18, eased);
  return {
    opacity: forceVisible ? Math.max(0.72, eased) : visibleProgress,
    scale: annotation.motion === 'pop' ? 0.88 + visibleProgress * 0.12 + overshoot : 1,
    slide: annotation.motion === 'slide' ? (1 - visibleProgress) * 0.055 : 0,
  };
}

function interpolatePoints(start: number[], end: number[], progress: number) {
  const safeProgress = clampRange(progress, 0, 1);
  const length = Math.min(start.length, end.length);
  return Array.from({ length }, (_, index) => start[index] + (end[index] - start[index]) * safeProgress);
}

function pointsAtTime(annotation: VideoAnnotation, time: number) {
  const keyframes = annotation.keyframes;
  if (!keyframes.length) return annotation.points;
  if (time <= keyframes[0].time) return keyframes[0].points;
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const from = keyframes[index];
    const to = keyframes[index + 1];
    if (time >= from.time && time <= to.time) {
      return interpolatePoints(from.points, to.points, (time - from.time) / Math.max(0.001, to.time - from.time));
    }
  }
  return keyframes[keyframes.length - 1].points;
}

function annotationCenterAtTime(annotation: VideoAnnotation, time: number): [number, number] {
  const points = pointsAtTime(annotation, time);
  const bounds = boundsFromPoints(annotation.type, points);
  return [(bounds.x1 + bounds.x2) / 2, (bounds.y1 + bounds.y2) / 2];
}

function linkedConnectionPoints(annotation: VideoAnnotation, time: number, annotations?: VideoAnnotation[]) {
  if (annotation.type !== 'connection-line' || !annotation.connectionIds?.length || !annotations?.length) return undefined;
  const points = annotation.connectionIds.flatMap(connectionId => {
    const linked = annotations.find(item => item.id === connectionId && item.type === 'player-circle');
    return linked ? annotationCenterAtTime(linked, time) : [];
  });
  return points.length >= 4 ? points : undefined;
}

function resolvedPointsAtTime(annotation: VideoAnnotation, time: number, annotations?: VideoAnnotation[]) {
  return linkedConnectionPoints(annotation, time, annotations) ?? pointsAtTime(annotation, time);
}

function translatePoints(type: VideoAnnotation['type'], points: number[], dx: number, dy: number) {
  if (type === 'zone') {
    const width = points[2] ?? 0;
    const height = points[3] ?? 0;
    return [
      clampRange(points[0] + dx, 0, Math.max(0, 1 - width)),
      clampRange(points[1] + dy, 0, Math.max(0, 1 - height)),
      width,
      height,
    ];
  }
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);
  const safeDx = clampRange(dx, -Math.min(...xs), 1 - Math.max(...xs));
  const safeDy = clampRange(dy, -Math.min(...ys), 1 - Math.max(...ys));
  return points.map((point, index) => index % 2 === 0 ? point + safeDx : point + safeDy);
}

function boundsFromPoints(type: VideoAnnotation['type'], points: number[]): Bounds {
  if (type === 'zone') {
    return { x1: points[0], y1: points[1], x2: points[0] + points[2], y2: points[1] + points[3] };
  }
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);
  const pad = type === 'text' ? 0.04 : 0;
  return { x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad, x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad };
}

function intersects(a: Bounds, b: Bounds) {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
}

function movePoint(points: number[], pointIndex: number, x: number, y: number) {
  const next = points.slice();
  const index = pointIndex * 2;
  if (index >= next.length - 1) return points;
  next[index] = clamp01(x);
  next[index + 1] = clamp01(y);
  return next;
}

function resizePoints(type: VideoAnnotation['type'], points: number[], width: number, height: number) {
  if (type === 'text') return points;
  const bounds = boundsFromPoints(type, points);
  const centerX = (bounds.x1 + bounds.x2) / 2;
  const centerY = (bounds.y1 + bounds.y2) / 2;
  const safeWidth = clampRange(width, 0.01, 0.95);
  const safeHeight = clampRange(height, 0.01, 0.95);
  if (type === 'zone') {
    return [
      clampRange(centerX - safeWidth / 2, 0, Math.max(0, 1 - safeWidth)),
      clampRange(centerY - safeHeight / 2, 0, Math.max(0, 1 - safeHeight)),
      safeWidth,
      safeHeight,
    ];
  }
  if (type === 'polygon-zone') {
    const currentWidth = Math.max(0.001, bounds.x2 - bounds.x1);
    const currentHeight = Math.max(0.001, bounds.y2 - bounds.y1);
    const scaleX = safeWidth / currentWidth;
    const scaleY = safeHeight / currentHeight;
    return points.map((point, index) => index % 2 === 0
      ? clamp01(centerX + (point - centerX) * scaleX)
      : clamp01(centerY + (point - centerY) * scaleY));
  }
  const start = points.length >= 4 ? [points[0], points[1]] : [centerX, centerY];
  const end = points.length >= 4 ? [points[2], points[3]] : [centerX + safeWidth, centerY + safeHeight];
  const minX = centerX - safeWidth / 2;
  const minY = centerY - safeHeight / 2;
  const maxX = centerX + safeWidth / 2;
  const maxY = centerY + safeHeight / 2;
  const startLeft = start[0] <= end[0];
  const startTop = start[1] <= end[1];
  return [
    clamp01(startLeft ? minX : maxX),
    clamp01(startTop ? minY : maxY),
    clamp01(startLeft ? maxX : minX),
    clamp01(startTop ? maxY : minY),
  ];
}

function polygonPath(ctx: CanvasRenderingContext2D, points: number[], width: number, height: number) {
  ctx.beginPath();
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index] * width;
    const y = points[index + 1] * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function makePolygonArea(points: number[], style: DrawingStyle, time: number, zIndex: number): VideoAnnotation {
  const annotation: VideoAnnotation = {
    id: id(),
    type: 'polygon-zone',
    points,
    color: style.color,
    fill: style.fill,
    strokeWidth: Math.max(1.5, style.strokeWidth),
    opacity: style.opacity,
    outlineOpacity: 1,
    startTime: Math.max(0, time),
    endTime: Math.max(time + 0.5, time + 4),
    bend: 0,
    dashed: false,
    locked: false,
    hidden: false,
    zIndex,
    motion: defaultMotion('polygon-zone'),
    pattern: defaultPattern('polygon-zone'),
    keyframes: [],
  };
  return upsertKeyframe(annotation, time, points);
}

function makeConnectionLine(points: number[], style: DrawingStyle, time: number, zIndex: number, connectionIds?: string[]): VideoAnnotation {
  const annotation: VideoAnnotation = {
    id: id(),
    type: 'connection-line',
    points,
    connectionIds,
    color: '#e5e7eb',
    fill: 'transparent',
    strokeWidth: Math.max(2.5, style.strokeWidth),
    opacity: 0.92,
    outlineOpacity: 0.92,
    startTime: Math.max(0, time),
    endTime: Math.max(time + 0.5, time + 4),
    bend: 0,
    dashed: false,
    locked: false,
    hidden: false,
    zIndex,
    motion: defaultMotion('connection-line'),
    pattern: defaultPattern('connection-line'),
    keyframes: [],
  };
  return upsertKeyframe(annotation, time, points);
}

function duplicateAnnotation(annotation: VideoAnnotation, time: number) {
  const dx = 0.035;
  const dy = 0.035;
  const timeOffset = 0.15;
  return {
    ...annotation,
    id: id(),
    points: translatePoints(annotation.type, pointsAtTime(annotation, time), dx, dy),
    keyframes: annotation.keyframes.map(keyframe => ({
      ...keyframe,
      id: id(),
      time: keyframe.time + timeOffset,
      points: translatePoints(annotation.type, keyframe.points, dx, dy),
    })),
    zIndex: annotation.zIndex + 1,
    locked: false,
    hidden: false,
    startTime: annotation.startTime + timeOffset,
    endTime: annotation.endTime + timeOffset,
  };
}

function cloneAnnotation(annotation: VideoAnnotation): VideoAnnotation {
  return {
    ...annotation,
    points: annotation.points.slice(),
    connectionIds: annotation.connectionIds?.slice(),
    keyframes: annotation.keyframes.map(keyframe => ({ ...keyframe, points: keyframe.points.slice() })),
  };
}

function cloneHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    annotations: snapshot.annotations.map(cloneAnnotation),
    freezes: snapshot.freezes.map(freeze => ({ ...freeze })),
  };
}

function makeHistorySnapshot(annotations: VideoAnnotation[], freezes: FreezeSegment[]): HistorySnapshot {
  return cloneHistorySnapshot({ annotations, freezes });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCanvasPattern(ctx: CanvasRenderingContext2D, annotation: VideoAnnotation, time: number, x: number, y: number, width: number, height: number, clipPath: () => void) {
  if (annotation.pattern === 'none') return;
  ctx.save();
  clipPath();
  ctx.clip();
  ctx.lineCap = 'round';
  if (annotation.pattern === 'diagonal') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, annotation.strokeWidth * 0.55);
    ctx.globalAlpha *= 0.24;
    const spacing = Math.max(24, Math.min(width, height) * 0.12);
    const offset = (time * 44) % spacing;
    for (let line = -height - width; line < width + height; line += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + line + offset, y + height + 12);
      ctx.lineTo(x + line + height + offset, y - 12);
      ctx.stroke();
    }
  } else if (annotation.pattern === 'shine') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(10, annotation.strokeWidth * 3.5);
    ctx.globalAlpha *= 0.18;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.18, y + height + 20);
    ctx.lineTo(x + width * 0.72, y - 20);
    ctx.stroke();
  } else if (annotation.pattern === 'grid') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, annotation.strokeWidth * 0.35);
    ctx.globalAlpha *= 0.16;
    const spacing = Math.max(22, Math.min(width, height) * 0.16);
    const offset = (time * 16) % spacing;
    for (let line = -spacing; line <= width + spacing; line += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + line + offset, y);
      ctx.lineTo(x + line + offset, y + height);
      ctx.stroke();
    }
    for (let line = -spacing; line <= height + spacing; line += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, y + line + offset);
      ctx.lineTo(x + width, y + line + offset);
      ctx.stroke();
    }
  } else if (annotation.pattern === 'scan') {
    const sweep = ((time * 0.8) % 1) * (width + height) - height * 0.5;
    const gradient = ctx.createLinearGradient(x + sweep - 28, y + height, x + sweep + 70, y);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,.42)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha *= 0.42;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x + sweep - 34, y + height + 18);
    ctx.lineTo(x + sweep + 34, y + height + 18);
    ctx.lineTo(x + sweep + height + 96, y - 18);
    ctx.lineTo(x + sweep + height + 28, y - 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, size: number) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - Math.cos(angle - Math.PI / 6) * size, toY - Math.sin(angle - Math.PI / 6) * size);
  ctx.lineTo(toX - Math.cos(angle + Math.PI / 6) * size, toY - Math.sin(angle + Math.PI / 6) * size);
  ctx.closePath();
  ctx.fill();
}

function curvedLinePoints(x1: number, y1: number, x2: number, y2: number, bend: number) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const amount = clampRange(bend, -0.65, 0.65) * length;
  return [x1, y1, midX - (dy / length) * amount, midY + (dx / length) * amount, x2, y2];
}

function drawCanvasAnnotation(ctx: CanvasRenderingContext2D, annotation: VideoAnnotation, time: number, width: number, height: number, effectTime = time, annotations?: VideoAnnotation[]) {
  if (annotation.hidden || !isAnnotationActive(annotation, time)) return;
  const points = resolvedPointsAtTime(annotation, time, annotations);
  if (points.length < 2) return;
  const abs = (index: number) => [points[index] * width, points[index + 1] * height] as const;
  const visual = overlayVisualState(annotation, time);
  const baseAlpha = visual.opacity;
  ctx.save();
  ctx.globalAlpha = baseAlpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = annotation.strokeWidth;
  ctx.shadowColor = annotation.color;
  ctx.shadowBlur = annotation.type === 'dashed-line' ? 2 : 7;
  if (annotation.dashed) {
    ctx.setLineDash([14, 10]);
  }

  if (annotation.type === 'zone') {
    const x = points[0] * width;
    const y = points[1] * height;
    const w = points[2] * width;
    const h = points[3] * height;
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    if (fillAlpha > 0.001) {
      ctx.globalAlpha = baseAlpha * fillAlpha;
      ctx.fillStyle = annotation.fill;
      roundedRectPath(ctx, x, y, w, h, 12);
      ctx.fill();
      drawCanvasPattern(ctx, annotation, effectTime, x, y, w, h, () => roundedRectPath(ctx, x, y, w, h, 12));
    }
    ctx.globalAlpha = baseAlpha * Math.max(0, annotation.outlineOpacity);
    ctx.strokeStyle = annotation.color;
    roundedRectPath(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (annotation.type === 'polygon-zone') {
    const bounds = boundsFromPoints(annotation.type, points);
    const x = bounds.x1 * width;
    const y = bounds.y1 * height;
    const w = (bounds.x2 - bounds.x1) * width;
    const h = (bounds.y2 - bounds.y1) * height;
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    if (fillAlpha > 0.001) {
      ctx.globalAlpha = baseAlpha * fillAlpha;
      ctx.fillStyle = annotation.fill;
      polygonPath(ctx, points, width, height);
      ctx.fill();
      drawCanvasPattern(ctx, annotation, effectTime, x, y, w, h, () => polygonPath(ctx, points, width, height));
    }
    ctx.globalAlpha = baseAlpha * Math.max(0, annotation.outlineOpacity);
    ctx.strokeStyle = annotation.color;
    polygonPath(ctx, points, width, height);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (annotation.type === 'circle-zone' || annotation.type === 'player-circle' || annotation.type === 'highlight' || annotation.type === 'spotlight') {
    const [x1, y1] = abs(0);
    const [x2, y2] = abs(2);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const spotlight = annotation.type === 'spotlight';
    const tallTool = annotation.type === 'highlight';
    const playerDisc = annotation.type === 'player-circle';
    const spotRadius = Math.max(34, Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2);
    const rx = spotlight ? spotRadius : Math.max(playerDisc ? 32 : tallTool ? 11 : 18, Math.abs(x2 - x1) / 2);
    const ry = spotlight ? spotRadius : Math.max(playerDisc ? 13 : tallTool ? 28 : 18, Math.abs(y2 - y1) / 2);
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    if (spotlight) {
      ctx.globalAlpha = baseAlpha * 0.24;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);
      if (fillAlpha > 0.001) {
        const topY = Math.max(-height * 0.08, cy - ry * 4.7);
        const beamGradient = ctx.createLinearGradient(cx, topY, cx, cy + ry);
        beamGradient.addColorStop(0, 'rgba(241,248,255,0.22)');
        beamGradient.addColorStop(0.62, 'rgba(219,234,254,0.13)');
        beamGradient.addColorStop(1, 'rgba(226,242,255,0)');
        ctx.globalAlpha = baseAlpha * fillAlpha;
        ctx.fillStyle = beamGradient;
        ctx.beginPath();
        ctx.moveTo(cx - rx * 0.4, topY);
        ctx.lineTo(cx + rx * 0.4, topY);
        ctx.lineTo(cx + rx * 0.98, cy + ry * 0.1);
        ctx.lineTo(cx - rx * 0.98, cy + ry * 0.1);
        ctx.closePath();
        ctx.fill();
        const pool = ctx.createRadialGradient(cx, cy, Math.max(2, rx * 0.14), cx, cy, rx * 1.25);
        pool.addColorStop(0, 'rgba(248,252,255,0.5)');
        pool.addColorStop(0.62, 'rgba(191,219,254,0.28)');
        pool.addColorStop(1, 'rgba(191,219,254,0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!spotlight && fillAlpha > 0.001) {
      ctx.globalAlpha = baseAlpha * fillAlpha * (annotation.type === 'highlight' ? 0.36 : 1);
      ctx.fillStyle = annotation.fill;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (fillAlpha > 0.001 && annotation.pattern !== 'none' && annotation.pattern !== 'pulse-border' && !spotlight) {
      drawCanvasPattern(ctx, annotation, effectTime, cx - rx, cy - ry, rx * 2, ry * 2, () => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      });
    }
    ctx.lineWidth = annotation.strokeWidth;
    if (annotation.outlineOpacity > 0.01) {
      ctx.globalAlpha = baseAlpha * Math.max(0, annotation.outlineOpacity);
      ctx.strokeStyle = annotation.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (annotation.type === 'player-circle') {
      const text = annotationLabelVisible(annotation) ? annotation.text?.trim() : '';
      if (text) {
        let fontSize = 13;
        ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
        const maxWidth = Math.max(28, rx * 1.72);
        while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
          fontSize -= 1;
          ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
        }
        ctx.globalAlpha = baseAlpha * 0.96;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0b172a';
        ctx.fillText(text, cx, cy + 0.5);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    }
    if (annotation.type === 'highlight' || annotation.type === 'spotlight') {
      const text = annotation.text?.trim();
      if (text && annotationLabelVisible(annotation)) {
        ctx.font = '750 18px Inter, Arial, sans-serif';
        const labelWidth = Math.max(54, ctx.measureText(text).width + 16);
        const labelX = cx - labelWidth / 2;
        const labelY = cy + ry + 6;
        ctx.globalAlpha = baseAlpha * 0.98;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#020617';
        ctx.fillStyle = '#ffffff';
        roundedRectPath(ctx, labelX, labelY, labelWidth, 24, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0b172a';
        ctx.fillText(text, labelX + 8, labelY + 17);
      }
    }
    ctx.restore();
    return;
  }

  if (annotation.type === 'connection-line') {
    const absPoints = points.map((point, index) => index % 2 === 0 ? point * width : point * height);
    if (absPoints.length < 4) {
      ctx.restore();
      return;
    }
    ctx.shadowBlur = 8;
    ctx.globalAlpha = baseAlpha * Math.max(0, annotation.outlineOpacity);
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.beginPath();
    ctx.moveTo(absPoints[0], absPoints[1]);
    for (let index = 2; index < absPoints.length; index += 2) ctx.lineTo(absPoints[index], absPoints[index + 1]);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
    return;
  }

  if (annotation.type === 'text') {
    const [x, y] = abs(0);
    const text = annotation.text || 'Label';
    ctx.font = '750 19px Inter, Arial, sans-serif';
    const textWidth = Math.max(58, ctx.measureText(text).width + 18);
    ctx.shadowBlur = 8;
    ctx.globalAlpha = baseAlpha * 0.98;
    ctx.fillStyle = '#ffffff';
    roundedRectPath(ctx, x - 9, y - 20, textWidth, 28, 7);
    ctx.fill();
    ctx.globalAlpha = baseAlpha;
    ctx.shadowBlur = 0;
    ctx.fillStyle = annotation.color;
    ctx.fillText(text, x, y + 1);
    ctx.restore();
    return;
  }

  const [x1, y1] = abs(0);
  const [x2, y2] = abs(2);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const curved = annotation.type === 'run' || Math.abs(annotation.bend) > 0.01;
  if (curved) {
    const [, , controlX, controlY] = curvedLinePoints(x1, y1, x2, y2, annotation.bend);
    ctx.quadraticCurveTo(controlX, controlY, x2, y2);
  } else {
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  if (annotation.type !== 'dashed-line') {
    ctx.setLineDash([]);
    drawArrowHead(ctx, x1, y1, x2, y2, Math.max(12, annotation.strokeWidth * 2.6));
  }
  ctx.restore();
}

function drawCanvasGrid(ctx: CanvasRenderingContext2D, mode: GridMode, width: number, height: number) {
  if (mode === 'off') return;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.34;
  ctx.setLineDash([14, 14]);
  const verticals = mode === 'thirds' ? [1 / 3, 2 / 3] : [0.18, 0.38, 0.62, 0.82];
  const horizontals = mode === 'thirds' ? [1 / 3, 2 / 3] : [0.2, 0.5, 0.8];
  verticals.forEach(value => {
    ctx.beginPath();
    ctx.moveTo(width * value, 0);
    ctx.lineTo(width * value, height);
    ctx.stroke();
  });
  horizontals.forEach(value => {
    ctx.beginPath();
    ctx.moveTo(0, height * value);
    ctx.lineTo(width, height * value);
    ctx.stroke();
  });
  ctx.restore();
}

function buildTimelineSegments(trimStart: number, trimEnd: number, freezes: FreezeSegment[]): TimelineSegment[] {
  const start = Math.max(0, trimStart);
  const end = Math.max(start + 0.2, trimEnd);
  const activeFreezes = freezes
    .filter(freeze => freeze.time >= start && freeze.time <= end)
    .sort((a, b) => a.time - b.time);
  const segments: TimelineSegment[] = [];
  let sourceCursor = start;
  let timelineCursor = 0;

  activeFreezes.forEach((freeze, index) => {
    if (freeze.time > sourceCursor + 0.01) {
      const duration = freeze.time - sourceCursor;
      segments.push({
        id: `video-${index}-${sourceCursor}`,
        kind: 'video',
        label: 'Video',
        sourceStart: sourceCursor,
        sourceEnd: freeze.time,
        duration,
        timelineStart: timelineCursor,
      });
      timelineCursor += duration;
    }
    const duration = clampRange(freeze.duration, 0.5, 10);
    segments.push({
      id: freeze.id,
      kind: 'freeze',
      label: 'Freeze image',
      sourceStart: freeze.time,
      sourceEnd: freeze.time,
      duration,
      timelineStart: timelineCursor,
      freezeId: freeze.id,
    });
    timelineCursor += duration;
    sourceCursor = freeze.time;
  });

  if (end > sourceCursor + 0.01) {
    const duration = end - sourceCursor;
    segments.push({
      id: `video-tail-${sourceCursor}`,
      kind: 'video',
      label: 'Video',
      sourceStart: sourceCursor,
      sourceEnd: end,
      duration,
      timelineStart: timelineCursor,
    });
  }
  return segments;
}

function timelineDuration(segments: TimelineSegment[]) {
  const last = segments.at(-1);
  return last ? last.timelineStart + last.duration : 0;
}

function timelineSnapPoints(segments: TimelineSegment[]) {
  const total = timelineDuration(segments);
  const points = [0, total];
  segments.forEach(segment => {
    points.push(segment.timelineStart);
    points.push(segment.timelineStart + segment.duration);
  });
  return Array.from(new Set(points.map(point => Number(point.toFixed(3))))).sort((a, b) => a - b);
}

function nearestTimelineSnap(time: number, segments: TimelineSegment[], threshold = 0.12) {
  const snap = timelineSnapPoints(segments).find(point => Math.abs(point - time) <= threshold);
  return snap ?? time;
}

function closestTimelineSnap(time: number, segments: TimelineSegment[]) {
  const points = timelineSnapPoints(segments);
  return points.reduce((closest, point) => Math.abs(point - time) < Math.abs(closest - time) ? point : closest, points[0] ?? 0);
}

function snapTimelineTime(time: number, segments: TimelineSegment[], threshold = 0.12) {
  const total = Math.max(0, timelineDuration(segments));
  const safe = clampRange(time, 0, total);
  return clampRange(nearestTimelineSnap(safe, segments, threshold), 0, total);
}

function timelineToSource(segments: TimelineSegment[], timelineTime: number) {
  const total = timelineDuration(segments);
  const safe = clampRange(timelineTime, 0, Math.max(0, total));
  const segment = segments.find((item, index) => {
    const start = item.timelineStart;
    const end = item.timelineStart + item.duration;
    return safe >= start && (safe < end || (index === segments.length - 1 && safe <= end));
  }) ?? segments.at(-1);
  if (!segment) return { sourceTime: 0, segment: undefined as TimelineSegment | undefined, timelineTime: safe };
  if (segment.kind === 'freeze') return { sourceTime: segment.sourceStart, segment, timelineTime: safe };
  return {
    sourceTime: clampRange(segment.sourceStart + (safe - segment.timelineStart), segment.sourceStart, segment.sourceEnd),
    segment,
    timelineTime: safe,
  };
}

function sourceToTimeline(segments: TimelineSegment[], sourceTime: number) {
  if (!segments.length) return 0;
  const freezeMatch = segments.find(segment => segment.kind === 'freeze' && Math.abs(sourceTime - segment.sourceStart) <= 0.02);
  if (freezeMatch) return freezeMatch.timelineStart;
  let fallback = 0;
  for (const segment of segments) {
    if (segment.kind === 'video' && sourceTime >= segment.sourceStart && sourceTime <= segment.sourceEnd) {
      return segment.timelineStart + (sourceTime - segment.sourceStart);
    }
    if (sourceTime >= segment.sourceStart) fallback = segment.timelineStart + segment.duration;
  }
  return clampRange(fallback, 0, timelineDuration(segments));
}

function bendFromControl(x1: number, y1: number, x2: number, y2: number, controlX: number, controlY: number) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  return clampRange(((controlX - midX) * normalX + (controlY - midY) * normalY) / length, -0.65, 0.65);
}

function VideoAnnotationShape({ annotation, time, effectTime, mapper, selected, shapeEditing = false, linkedAnnotations, connectMode = false, connectArmed = false, onSelect, onMoveAtTime, onTranslateAtTime, onEditText, onSetBend, onConnectPick, onConnectCancel, onBeginEdit }: {
  annotation: VideoAnnotation;
  time: number;
  effectTime?: number;
  mapper: Mapper;
  selected: boolean;
  shapeEditing?: boolean;
  linkedAnnotations?: VideoAnnotation[];
  connectMode?: boolean;
  connectArmed?: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onMoveAtTime: (id: string, points: number[]) => void;
  onTranslateAtTime: (id: string, dx: number, dy: number) => void;
  onEditText: (id: string) => void;
  onSetBend: (id: string, bend: number) => void;
  onConnectPick?: (id: string) => void;
  onConnectCancel?: () => void;
  onBeginEdit?: () => void;
}) {
  const dragStart = useRef<{ clientX: number; clientY: number; points: number[]; moved: boolean } | null>(null);
  if (annotation.hidden || (!selected && !isAnnotationActive(annotation, time))) return null;
  const points = resolvedPointsAtTime(annotation, time, linkedAnnotations);
  if (points.length < 2) return null;
  const effectClock = effectTime ?? time;
  const visual = overlayVisualState(annotation, time, selected);
  const linkedConnection = annotation.type === 'connection-line' && Boolean(annotation.connectionIds?.length);
  const rightClickConnectableDisc = connectMode && annotation.type === 'player-circle';
  const pickConnection = (event: Konva.KonvaEventObject<MouseEvent | PointerEvent>) => {
    if (!rightClickConnectableDisc) return false;
    event.evt.preventDefault();
    event.cancelBubble = true;
    onConnectPick?.(annotation.id);
    return true;
  };
  const commitBodyDrag = (clientX: number, clientY: number, finish = false) => {
    const start = dragStart.current;
    if (!start) return;
    const dx = (clientX - start.clientX) / mapper.width;
    const dy = (clientY - start.clientY) / mapper.height;
    if (Math.hypot(dx, dy) > 0.0001) {
      start.moved = true;
      onMoveAtTime(annotation.id, translatePoints(annotation.type, start.points, dx, dy));
    }
    if (finish) dragStart.current = null;
  };
  const beginBodyDrag = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    if (annotation.locked || linkedConnection) return;
    const native = event.evt;
    if ('button' in native && native.button === 2) {
      native.preventDefault();
      return;
    }
    if (connectMode && connectArmed) onConnectCancel?.();
    const additive = 'ctrlKey' in native && (native.ctrlKey || native.metaKey);
    if (additive || !selected) onSelect(annotation.id, Boolean(additive));
    onBeginEdit?.();
    const point = 'touches' in native ? native.touches[0] : native;
    if (!point) return;
    dragStart.current = { clientX: point.clientX, clientY: point.clientY, points: points.slice(), moved: false };
    const stage = event.target.getStage();
    if (stage) stage.container().style.cursor = 'grabbing';

    const moveMouse = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      commitBodyDrag(moveEvent.clientX, moveEvent.clientY);
    };
    const endMouse = (upEvent: MouseEvent) => {
      commitBodyDrag(upEvent.clientX, upEvent.clientY, true);
      window.removeEventListener('mousemove', moveMouse);
      window.removeEventListener('mouseup', endMouse);
      if (stage) stage.container().style.cursor = annotation.locked ? 'default' : 'grab';
    };
    const moveTouch = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      if (!touch) return;
      moveEvent.preventDefault();
      commitBodyDrag(touch.clientX, touch.clientY);
    };
    const endTouch = (endEvent: TouchEvent) => {
      const touch = endEvent.changedTouches[0];
      if (touch) commitBodyDrag(touch.clientX, touch.clientY, true);
      else dragStart.current = null;
      window.removeEventListener('touchmove', moveTouch);
      window.removeEventListener('touchend', endTouch);
      window.removeEventListener('touchcancel', endTouch);
      if (stage) stage.container().style.cursor = annotation.locked ? 'default' : 'grab';
    };
    if ('touches' in native) {
      window.addEventListener('touchmove', moveTouch, { passive: false });
      window.addEventListener('touchend', endTouch, { once: true });
      window.addEventListener('touchcancel', endTouch, { once: true });
    } else {
      window.addEventListener('mousemove', moveMouse);
      window.addEventListener('mouseup', endMouse, { once: true });
    }
  };
  const interactionProps = {
    draggable: false,
    onMouseDown: beginBodyDrag,
    onTouchStart: beginBodyDrag,
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      if (dragStart.current?.moved) return;
      if (event.evt.button === 2) return;
      onSelect(annotation.id, event.evt.ctrlKey || event.evt.metaKey);
    },
    onTap: (event: Konva.KonvaEventObject<TouchEvent>) => {
      event.cancelBubble = true;
      if (dragStart.current?.moved) return;
      onSelect(annotation.id, false);
    },
    onContextMenu: (event: Konva.KonvaEventObject<PointerEvent>) => {
      if (!pickConnection(event)) {
        event.evt.preventDefault();
        if (connectMode && connectArmed) onConnectCancel?.();
      }
    },
    onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = event.target.getStage();
      if (stage && !annotation.locked) stage.container().style.cursor = linkedConnection ? 'pointer' : 'grab';
    },
    opacity: visual.opacity,
  };
  const selectionColor = '#facc15';
  const abs = (index: number) => mapper.toAbs(points[index], points[index + 1]);
  const [x1, y1] = abs(0);
  const borderDash = annotation.dashed ? [14, 10] : undefined;
  const borderDashOffset = 0;
  const renderFxLines = (x: number, y: number, width: number, height: number) => {
    if (annotation.pattern === 'none' || annotation.pattern === 'pulse-border') return null;
    const spacing = Math.max(22, Math.min(width, height) * 0.12);
    if (annotation.pattern === 'shine') {
      return <Line points={[x + width * 0.18, y + height + 18, x + width * 0.72, y - 18]} stroke="#ffffff" strokeWidth={Math.max(8, annotation.strokeWidth * 3.2)} opacity={0.18} lineCap="round" listening={false} />;
    }
    if (annotation.pattern === 'grid') {
      const gridSpacing = Math.max(22, Math.min(width, height) * 0.16);
      const offset = (effectClock * 16) % gridSpacing;
      const verticals = Math.ceil(width / gridSpacing) + 3;
      const horizontals = Math.ceil(height / gridSpacing) + 3;
      return <>
        {Array.from({ length: verticals }, (_, index) => <Line key={`v-${index}`} points={[x - gridSpacing + index * gridSpacing + offset, y, x - gridSpacing + index * gridSpacing + offset, y + height]} stroke="#ffffff" strokeWidth={Math.max(1, annotation.strokeWidth * 0.35)} opacity={0.16} listening={false} />)}
        {Array.from({ length: horizontals }, (_, index) => <Line key={`h-${index}`} points={[x, y - gridSpacing + index * gridSpacing + offset, x + width, y - gridSpacing + index * gridSpacing + offset]} stroke="#ffffff" strokeWidth={Math.max(1, annotation.strokeWidth * 0.35)} opacity={0.14} listening={false} />)}
      </>;
    }
    if (annotation.pattern === 'scan') {
      const sweep = ((effectClock * 0.8) % 1) * (width + height) - height * 0.5;
      return <Line points={[x + sweep, y + height + 18, x + sweep + height + 58, y - 18]} stroke="#ffffff" strokeWidth={Math.max(16, annotation.strokeWidth * 4.2)} opacity={0.26} lineCap="round" listening={false} />;
    }
    const count = Math.ceil((width + height) / spacing) + 5;
    const offset = (effectClock * 44) % spacing;
    return <>
      {Array.from({ length: count }, (_, index) => {
        const start = x - height + index * spacing + offset - spacing * 2;
        return <Line key={index} points={[start, y + height + 10, start + height + 34, y - 10]} stroke="#ffffff" strokeWidth={Math.max(1.5, annotation.strokeWidth * 0.55)} opacity={0.22} lineCap="round" listening={false} />;
      })}
    </>;
  };
  const renderRectFx = (x: number, y: number, width: number, height: number) => {
    if (annotation.pattern === 'none' || annotation.pattern === 'pulse-border') return null;
    return <Group clipX={x} clipY={y} clipWidth={width} clipHeight={height} listening={false}>{renderFxLines(x, y, width, height)}</Group>;
  };
  const renderPolygonFx = (absPoints: number[]) => {
    if (annotation.pattern === 'none' || annotation.pattern === 'pulse-border') return null;
    const xs = absPoints.filter((_, index) => index % 2 === 0);
    const ys = absPoints.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - minX);
    const height = Math.max(1, Math.max(...ys) - minY);
    return <Group listening={false} clipFunc={(ctx: Konva.Context) => {
      ctx.beginPath();
      for (let index = 0; index < absPoints.length; index += 2) {
        if (index === 0) ctx.moveTo(absPoints[index], absPoints[index + 1]);
        else ctx.lineTo(absPoints[index], absPoints[index + 1]);
      }
      ctx.closePath();
    }}>{renderFxLines(minX, minY, width, height)}</Group>;
  };
  const renderEllipseFx = (cx: number, cy: number, rx: number, ry: number) => {
    if (annotation.pattern === 'none' || annotation.pattern === 'pulse-border') return null;
    return <Group listening={false} clipFunc={(ctx: Konva.Context) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }}>{renderFxLines(cx - rx, cy - ry, rx * 2, ry * 2)}</Group>;
  };
  const renderPointHandle = (pointIndex: number, x: number, y: number, accent = '#2563eb') => {
    if (!selected || !shapeEditing || annotation.locked) return null;
    return <Group
      x={x}
      y={y}
      draggable
      dragDistance={1}
      onMouseDown={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onTouchStart={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onDragStart={event => {
        event.cancelBubble = true;
        onBeginEdit?.();
      }}
      onDragMove={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        const rel = mapper.toRel(node.x(), node.y());
        onMoveAtTime(annotation.id, movePoint(points, pointIndex, rel.x, rel.y));
      }}
      onDragEnd={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        const rel = mapper.toRel(node.x(), node.y());
        onMoveAtTime(annotation.id, movePoint(points, pointIndex, rel.x, rel.y));
      }}
    >
      <Circle radius={17} fill={HIT_FILL} />
      <Circle radius={8} fill="#ffffff" stroke={accent} strokeWidth={2.25} shadowColor="#020617" shadowBlur={7} shadowOpacity={0.22} />
      <Circle radius={2.3} fill={accent} />
    </Group>;
  };
  const renderResizeHandle = () => {
    if (!selected || !shapeEditing || annotation.locked || annotation.type === 'text' || annotation.type === 'polygon-zone' || annotation.type === 'connection-line') return null;
    const bounds = boundsFromPoints(annotation.type, points);
    const center = { x: (bounds.x1 + bounds.x2) / 2, y: (bounds.y1 + bounds.y2) / 2 };
    const [handleX, handleY] = mapper.toAbs(bounds.x2, bounds.y2);
    return <Group
      x={handleX}
      y={handleY}
      draggable
      dragDistance={1}
      onMouseDown={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onTouchStart={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onDragStart={event => {
        event.cancelBubble = true;
        onBeginEdit?.();
      }}
      onDragMove={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        const rel = mapper.toRel(node.x(), node.y());
        const width = Math.max(0.01, Math.abs(rel.x - center.x) * 2);
        const height = Math.max(0.01, Math.abs(rel.y - center.y) * 2);
        onMoveAtTime(annotation.id, resizePoints(annotation.type, points, width, height));
      }}
      onDragEnd={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        const rel = mapper.toRel(node.x(), node.y());
        const width = Math.max(0.01, Math.abs(rel.x - center.x) * 2);
        const height = Math.max(0.01, Math.abs(rel.y - center.y) * 2);
        onMoveAtTime(annotation.id, resizePoints(annotation.type, points, width, height));
      }}
    >
      <Rect x={-18} y={-18} width={36} height={36} fill={HIT_FILL} cornerRadius={8} />
      <Rect x={-6} y={-6} width={12} height={12} cornerRadius={3} fill="#ffffff" stroke="#2563eb" strokeWidth={2} />
    </Group>;
  };

  if (annotation.type === 'zone') {
    const [x, y, w, h] = points;
    const [rx, ry] = mapper.toAbs(x, y);
    const width = w * mapper.width;
    const height = h * mapper.height;
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    return <>
      <Group {...interactionProps}>
        {fillAlpha > 0.001 && <Rect x={rx} y={ry} width={width} height={height} fill={annotation.fill} opacity={fillAlpha} cornerRadius={10} shadowColor={annotation.fill} shadowBlur={10} shadowOpacity={0.18} />}
        {fillAlpha > 0.001 && renderRectFx(rx, ry, width, height)}
        <Rect x={rx} y={ry} width={width} height={height} stroke={annotation.color} strokeWidth={annotation.strokeWidth} opacity={annotation.outlineOpacity} dash={borderDash} dashOffset={borderDashOffset} cornerRadius={10} />
        {selected && <Rect x={rx - 4} y={ry - 4} width={width + 8} height={height + 8} stroke={selectionColor} strokeWidth={2} opacity={0.8} cornerRadius={12} />}
        <Rect x={rx - 20} y={ry - 20} width={width + 40} height={height + 40} fill={HIT_FILL} cornerRadius={18} />
      </Group>
      {renderResizeHandle()}
    </>;
  }

  if (annotation.type === 'polygon-zone') {
    const absPoints = points.flatMap((point, index, all) => index % 2 === 0 ? mapper.toAbs(point, all[index + 1]) : []);
    const xs = absPoints.filter((_, index) => index % 2 === 0);
    const ys = absPoints.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - minX);
    const height = Math.max(1, Math.max(...ys) - minY);
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    return <>
      <Group {...interactionProps}>
        <Rect x={minX - 22} y={minY - 22} width={width + 44} height={height + 44} fill={HIT_FILL} cornerRadius={12} />
        {annotation.outlineOpacity > 0.01 && <Line points={absPoints} closed stroke={annotation.color} strokeWidth={annotation.strokeWidth + 9} opacity={0.12 * annotation.outlineOpacity} lineJoin="round" shadowColor={annotation.color} shadowBlur={18} shadowOpacity={0.22} listening={false} />}
        {fillAlpha > 0.001 && <Line points={absPoints} closed fill={annotation.fill} opacity={fillAlpha} lineJoin="round" shadowColor={annotation.fill} shadowBlur={8} shadowOpacity={0.14} />}
        {fillAlpha > 0.001 && renderPolygonFx(absPoints)}
        <Line points={absPoints} closed stroke={annotation.color} strokeWidth={annotation.strokeWidth} opacity={annotation.outlineOpacity} dash={borderDash} dashOffset={borderDashOffset} lineJoin="round" />
        {selected && <Line points={absPoints} closed stroke={selectionColor} strokeWidth={annotation.strokeWidth + 3} opacity={0.36} lineJoin="round" />}
        <Line points={absPoints} closed fill={HIT_FILL} stroke={HIT_FILL} strokeWidth={28} hitStrokeWidth={28} lineJoin="round" />
      </Group>
      {selected && points.map((point, index, all) => {
        if (index % 2 !== 0) return null;
        const [px, py] = mapper.toAbs(point, all[index + 1]);
        return <Group key={`polygon-handle-${index}`} listening>{renderPointHandle(index / 2, px, py, '#22d3ee')}</Group>;
      })}
    </>;
  }

  if (annotation.type === 'connection-line') {
    const absPoints = points.flatMap((point, index, all) => index % 2 === 0 ? mapper.toAbs(point, all[index + 1]) : []);
    if (absPoints.length < 4) return null;
    const xs = absPoints.filter((_, index) => index % 2 === 0);
    const ys = absPoints.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - minX);
    const height = Math.max(1, Math.max(...ys) - minY);
    return <>
      <Group {...interactionProps}>
        <Rect x={minX - 24} y={minY - 24} width={width + 48} height={height + 48} fill={HIT_FILL} cornerRadius={14} />
        <Line points={absPoints} stroke="#ffffff" strokeWidth={annotation.strokeWidth + 28} opacity={0.01} lineCap="round" lineJoin="round" />
        {selected && <Line points={absPoints} stroke={selectionColor} strokeWidth={annotation.strokeWidth + 5} opacity={0.3} lineCap="round" lineJoin="round" />}
        <Line points={absPoints} stroke={annotation.color} strokeWidth={annotation.strokeWidth} opacity={annotation.outlineOpacity} lineCap="round" lineJoin="round" shadowColor={annotation.color} shadowBlur={7} />
      </Group>
      {selected && !linkedConnection && points.map((point, index, all) => {
        if (index % 2 !== 0) return null;
        const [px, py] = mapper.toAbs(point, all[index + 1]);
        return <Group key={`connection-handle-${index}`} listening>{renderPointHandle(index / 2, px, py, '#38bdf8')}</Group>;
      })}
    </>;
  }

  if (annotation.type === 'circle-zone' || annotation.type === 'player-circle' || annotation.type === 'highlight' || annotation.type === 'spotlight') {
    const [x2, y2] = abs(2);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const spotlight = annotation.type === 'spotlight';
    const tallTool = annotation.type === 'highlight';
    const playerDisc = annotation.type === 'player-circle';
    const spotRadius = Math.max(34, Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2);
    const rx = spotlight ? spotRadius : Math.max(playerDisc ? 32 : tallTool ? 9 : 16, Math.abs(x2 - x1) / 2);
    const ry = spotlight ? spotRadius : Math.max(playerDisc ? 13 : tallTool ? 32 : 16, Math.abs(y2 - y1) / 2);
    const label = annotation.text?.trim();
    const labelWidth = label ? Math.max(48, label.length * 7.4 + 14) : 0;
    const fillAlpha = clampRange(annotation.opacity, 0, 1);
    return <>
      {annotation.type === 'spotlight' && <Group listening={false} opacity={visual.opacity}>
        <Rect x={0} y={0} width={mapper.width} height={mapper.height} fill="#020617" opacity={0.24} />
        {fillAlpha > 0.001 && <>
          <Line points={[cx - rx * 0.4, Math.max(-mapper.height * 0.08, cy - ry * 4.7), cx + rx * 0.4, Math.max(-mapper.height * 0.08, cy - ry * 4.7), cx + rx * 0.98, cy + ry * 0.1, cx - rx * 0.98, cy + ry * 0.1]} closed fill="#eff6ff" opacity={0.13 * fillAlpha} shadowColor="#dbeafe" shadowBlur={18} shadowOpacity={0.18} />
          <Ellipse x={cx} y={cy} radiusX={rx} radiusY={ry} fill="#dbeafe" opacity={0.2 * fillAlpha} shadowColor="#dbeafe" shadowBlur={28} shadowOpacity={0.34 * fillAlpha} />
          <Ellipse x={cx} y={cy} radiusX={rx * 0.62} radiusY={ry * 0.62} fill="#ffffff" opacity={0.1 * fillAlpha} />
        </>}
      </Group>}
      <Group x={cx} y={cy} {...interactionProps} onDblClick={() => onEditText(annotation.id)} onDblTap={() => onEditText(annotation.id)}>
        {annotation.type !== 'spotlight' && fillAlpha > 0.001 && <Ellipse x={0} y={0} radiusX={rx} radiusY={ry} fill={annotation.fill} opacity={fillAlpha * (annotation.type === 'highlight' ? 0.34 : 1)} shadowColor={annotation.fill} shadowBlur={9} shadowOpacity={0.16} />}
        {annotation.type !== 'spotlight' && fillAlpha > 0.001 && renderEllipseFx(0, 0, rx, ry)}
        {annotation.outlineOpacity > 0.01 && <Ellipse x={0} y={0} radiusX={rx} radiusY={ry} stroke={annotation.color} strokeWidth={annotation.strokeWidth} opacity={annotation.outlineOpacity} dash={borderDash} dashOffset={borderDashOffset} />}
        {label && playerDisc && annotationLabelVisible(annotation) && <Text
          x={-rx + 5}
          y={-Math.max(8, ry * 0.58)}
          width={Math.max(10, rx * 2 - 10)}
          height={Math.max(16, ry * 1.16)}
          text={label}
          align="center"
          verticalAlign="middle"
          fill="#0b172a"
          fontFamily="Inter, Arial, sans-serif"
          fontSize={Math.max(8, Math.min(13, ry * 0.82))}
          fontStyle="bold"
          listening={false}
        />}
        {label && (annotation.type === 'highlight' || annotation.type === 'spotlight') && annotationLabelVisible(annotation) && <Group
          x={0}
          y={ry + 6}
          onClick={event => { event.cancelBubble = true; onEditText(annotation.id); }}
          onTap={event => { event.cancelBubble = true; onEditText(annotation.id); }}
        >
          <Rect x={-labelWidth / 2} y={0} width={labelWidth} height={19} fill="#020617" opacity={0.9} stroke={annotation.color} strokeWidth={0.8} cornerRadius={6} shadowColor="#020617" shadowBlur={6} shadowOpacity={0.22} />
          <Text x={-labelWidth / 2} y={0} width={labelWidth} height={19} text={label} align="center" verticalAlign="middle" fill="#f8fafc" fontFamily="Inter, Arial, sans-serif" fontSize={10} fontStyle="bold" />
        </Group>}
        {selected && <Ellipse x={0} y={0} radiusX={rx + 5} radiusY={ry + 5} stroke={selectionColor} strokeWidth={1.8} opacity={0.82} />}
        <Ellipse x={0} y={0} radiusX={rx + (playerDisc ? 8 : 30)} radiusY={ry + (playerDisc ? 7 : 30)} fill={HIT_FILL} stroke={HIT_FILL} strokeWidth={playerDisc ? 4 : 22} />
      </Group>
      {renderResizeHandle()}
    </>;
  }

  if (annotation.type === 'text') {
    const text = annotation.text || 'Label';
    const width = Math.max(54, text.length * 8.8 + 16);
    return <Group x={x1} y={y1} {...interactionProps} onDblClick={() => onEditText(annotation.id)} onDblTap={() => onEditText(annotation.id)}>
      <Rect x={-8} y={-19} width={width} height={25} fill="#020617" opacity={0.88} stroke={selected ? selectionColor : annotation.color} strokeWidth={1.1} cornerRadius={7} shadowColor="#0b172a" shadowBlur={7} shadowOpacity={0.18} />
      <Text text={text} fill="#f8fafc" fontFamily="Inter, Arial, sans-serif" fontSize={14} fontStyle="bold" />
    </Group>;
  }

  const [x2, y2] = abs(2);
  const curved = annotation.type === 'run' || Math.abs(annotation.bend) > 0.01;
  const curvePoints = (() => {
    if (!curved) return [x1, y1, x2, y2];
    return curvedLinePoints(x1, y1, x2, y2, annotation.bend);
  })();
  const lineProps = {
    points: curvePoints,
    tension: curved ? 0.45 : 0,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };
  const control = curvedLinePoints(x1, y1, x2, y2, annotation.bend).slice(2, 4);
  return <>
    <Group {...interactionProps}>
      <Line {...lineProps} stroke="#ffffff" strokeWidth={annotation.strokeWidth + 30} opacity={0.01} />
      {selected && <Arrow {...lineProps} pointerLength={12} pointerWidth={12} stroke={selectionColor} fill={selectionColor} strokeWidth={annotation.strokeWidth + 5} opacity={0.28} />}
      {annotation.type === 'dashed-line'
        ? <Line {...lineProps} stroke={annotation.color} strokeWidth={annotation.strokeWidth} dash={borderDash ?? [14, 9]} dashOffset={borderDashOffset} shadowColor={annotation.color} shadowBlur={5} />
        : <Arrow {...lineProps} pointerLength={10} pointerWidth={10} stroke={annotation.color} fill={annotation.color} strokeWidth={annotation.strokeWidth} dash={borderDash} dashOffset={borderDashOffset} shadowColor={annotation.color} shadowBlur={6} />}
    </Group>
    {renderPointHandle(0, x1, y1, '#38bdf8')}
    {renderPointHandle(1, x2, y2, '#38bdf8')}
    {selected && shapeEditing && <Group
      x={control[0]}
      y={control[1]}
      draggable
      dragDistance={1}
      onMouseDown={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onTouchStart={event => { event.cancelBubble = true; onSelect(annotation.id, false); }}
      onDragStart={event => {
        event.cancelBubble = true;
        onBeginEdit?.();
      }}
      onDragMove={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        onSetBend(annotation.id, bendFromControl(x1, y1, x2, y2, node.x(), node.y()));
      }}
      onDragEnd={event => {
        event.cancelBubble = true;
        const node = event.currentTarget as Konva.Group;
        onSetBend(annotation.id, bendFromControl(x1, y1, x2, y2, node.x(), node.y()));
      }}
    >
      <Circle radius={19} fill={HIT_FILL} />
      <Circle radius={12} fill="#22d3ee" opacity={0.2} stroke="#67e8f9" strokeWidth={1} />
      <Circle radius={7.5} fill="#ffffff" stroke="#0891b2" strokeWidth={2.2} shadowColor="#020617" shadowBlur={7} shadowOpacity={0.25} />
      <Circle radius={2.3} fill="#0891b2" />
    </Group>}
    {renderResizeHandle()}
  </>;
}

function UploadPanel({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  return <main className="grid min-h-0 flex-1 place-items-center p-4 sm:p-6">
    <label
      onDragEnter={event => { event.preventDefault(); setDragging(true); }}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event: ReactDragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
      className={`grid min-h-[22rem] w-full max-w-3xl cursor-pointer place-items-center rounded-xl border border-dashed p-6 text-center shadow-[0_22px_64px_rgba(37,99,235,.12)] backdrop-blur transition ${dragging ? 'border-[#0f766e] bg-emerald-50/86' : 'border-[#bfdbfe] bg-white/82 hover:border-[#2563eb]'}`}
    >
      <span>
        <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl bg-[#2563eb] text-white shadow-[0_16px_34px_rgba(37,99,235,.25)]">
          <Upload size={30} />
        </span>
        <span className="block text-2xl font-black text-[#07111f]">Upload MP4 clips</span>
        <span className="mt-2 block text-sm font-semibold text-slate-600">One clip or a full analysis set.</span>
        <span className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0b172a] px-4 text-sm font-black text-white">Choose files</span>
      </span>
      <input type="file" accept="video/mp4,video/*" multiple className="hidden" onChange={event => {
        if (event.target.files) onFiles(event.target.files);
        event.currentTarget.value = '';
      }} />
    </label>
  </main>;
}

function MediaStrip({ segments, playheadTime, onSeek, onFreezeDurationChange, trimStart, trimEnd, sourceDuration, onTrimChange, onBeginEdit }: {
  segments: TimelineSegment[];
  playheadTime: number;
  onSeek: (timelineTime: number) => void;
  onFreezeDurationChange: (freezeId: string, duration: number) => void;
  trimStart: number;
  trimEnd: number;
  sourceDuration: number;
  onTrimChange: (trimStart: number, trimEnd: number) => void;
  onBeginEdit?: () => void;
}) {
  const total = Math.max(0.2, timelineDuration(segments));
  const sourceTotal = Math.max(0.2, sourceDuration || trimEnd || total);
  const sourceStart = clampRange(trimStart, 0, Math.max(0, sourceTotal - 0.2));
  const sourceEnd = clampRange(trimEnd || sourceTotal, sourceStart + 0.2, sourceTotal);
  const trimLeftPct = (sourceStart / sourceTotal) * 100;
  const rawTrimWidthPct = ((sourceEnd - sourceStart) / sourceTotal) * 100;
  const trimWidthPct = Math.min(100 - trimLeftPct, Math.max(2, rawTrimWidthPct));
  const playheadPct = clampRange(trimLeftPct + (clampRange(playheadTime, 0, total) / total) * trimWidthPct, 0, 100);
  const railRef = useRef<HTMLDivElement | null>(null);
  const pointerTimelineTime = (clientX: number, snap = true) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const trimLeft = rect.left + rect.width * (trimLeftPct / 100);
    const trimWidth = Math.max(1, rect.width * (trimWidthPct / 100));
    const raw = clampRange(((clientX - trimLeft) / trimWidth) * total, 0, total);
    return snap ? snapTimelineTime(raw, segments) : raw;
  };
  const pointerSourceTimelineTime = (clientX: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const sourceTime = clampRange(((clientX - rect.left) / Math.max(1, rect.width)) * sourceTotal, sourceStart, sourceEnd);
    return sourceToTimeline(segments, sourceTime);
  };
  const beginScrub = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const seek = (clientX: number) => onSeek(pointerTimelineTime(clientX));
    seek(event.clientX);
    const onMove = (moveEvent: PointerEvent) => seek(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const beginSourceScrub = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const seek = (clientX: number) => onSeek(pointerSourceTimelineTime(clientX));
    seek(event.clientX);
    const onMove = (moveEvent: PointerEvent) => seek(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const beginFreezeResize = (event: React.PointerEvent, segment: TimelineSegment) => {
    if (!segment.freezeId) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    onBeginEdit?.();
    const startClientX = event.clientX;
    const originalEnd = segment.timelineStart + segment.duration;
    const secondsPerPixel = total / Math.max(1, rect.width * (trimWidthPct / 100));
    const resize = (clientX: number) => {
      const rawEnd = originalEnd + (clientX - startClientX) * secondsPerPixel;
      const snappedEnd = nearestTimelineSnap(rawEnd, segments, 0.16);
      onFreezeDurationChange(segment.freezeId!, clampRange(snappedEnd - segment.timelineStart, 0.5, 10));
    };
    resize(event.clientX);
    const onMove = (moveEvent: PointerEvent) => resize(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const beginTrimDrag = (event: React.PointerEvent, edge: 'start' | 'end') => {
    if (!sourceDuration) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startClientX = event.clientX;
    const originalStart = trimStart;
    const originalEnd = trimEnd || sourceDuration;
    const secondsPerPixel = sourceTotal / Math.max(1, rect.width);
    const resize = (clientX: number) => {
      const delta = (clientX - startClientX) * secondsPerPixel;
      if (edge === 'start') {
        onTrimChange(clampRange(originalStart + delta, 0, Math.max(0, originalEnd - 0.2)), originalEnd);
      } else {
        onTrimChange(originalStart, clampRange(originalEnd + delta, originalStart + 0.2, sourceDuration));
      }
    };
    resize(event.clientX);
    const onMove = (moveEvent: PointerEvent) => resize(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  return <div className="border-t border-[#d7e5f6] bg-white/82 px-2 py-2 backdrop-blur">
    <div className="mx-auto max-w-6xl">
      <div ref={railRef} onPointerDown={beginSourceScrub} className="relative h-20 overflow-hidden rounded-xl border border-[#d7e5f6] bg-[#edf4fc] p-1.5">
        <div className="absolute inset-x-1.5 bottom-2 top-4 rounded-xl bg-[#dbeafe]" />
        {trimLeftPct > 0 && <span className="pointer-events-none absolute bottom-2 top-4 z-0 rounded-l-xl bg-slate-900/12" style={{ left: '0.375rem', width: `${trimLeftPct}%` }} />}
        {trimLeftPct + trimWidthPct < 100 && <span className="pointer-events-none absolute bottom-2 top-4 z-0 rounded-r-xl bg-slate-900/12" style={{ left: `${trimLeftPct + trimWidthPct}%`, right: '0.375rem' }} />}
        <div
          onPointerDown={beginScrub}
          className="absolute bottom-2 top-4 z-10 overflow-hidden rounded-xl border border-[#2563eb] bg-white shadow-[0_8px_22px_rgba(37,99,235,.16)]"
          style={{ left: `${trimLeftPct}%`, width: `${trimWidthPct}%` }}
        >
          {timelineSnapPoints(segments).map(point => <span key={point} className="pointer-events-none absolute bottom-1 top-1 z-0 w-px bg-[#bfdbfe]/80" style={{ left: `${(point / total) * 100}%` }} />)}
          {segments.map(segment => {
            const left = `${(segment.timelineStart / total) * 100}%`;
            const width = `${Math.max(3, (segment.duration / total) * 100)}%`;
            const active = playheadTime >= segment.timelineStart && playheadTime < segment.timelineStart + segment.duration;
            return <button
              key={segment.id}
              type="button"
              onPointerDown={beginScrub}
              style={{ left, width }}
              className={`absolute bottom-1 top-1 z-10 min-w-10 overflow-hidden rounded-lg border px-2 text-left transition ${segment.kind === 'freeze' ? 'border-amber-300 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-950' : 'border-[#bfdbfe] bg-white text-[#0b172a]'} ${active ? 'ring-2 ring-[#2563eb]' : ''}`}
            >
              <span className="block truncate text-[10px] font-black uppercase tracking-[0.08em]">{segment.kind === 'freeze' ? 'Freeze' : 'Video'}</span>
              <span className="block text-[10px] font-semibold tabular-nums">{segment.kind === 'freeze' ? `${segment.duration.toFixed(1)}s image` : `${segment.duration.toFixed(1)}s clip`}</span>
              {segment.kind === 'freeze' && <span
                title="Drag to change freeze duration"
                onPointerDown={event => beginFreezeResize(event, segment)}
                className="absolute bottom-1 right-1 z-20 grid h-7 w-7 cursor-ew-resize place-items-center rounded-md bg-amber-300 text-amber-950 shadow-[0_6px_14px_rgba(146,64,14,.25)] ring-1 ring-amber-500/50"
              ><Snowflake size={13} /></span>}
            </button>;
          })}
        </div>
        {sourceDuration > 0.2 && <>
          <span
            title="Drag to crop or extend the clip start"
            onPointerDown={event => beginTrimDrag(event, 'start')}
            className="absolute bottom-1 top-3 z-40 grid w-4 -translate-x-1/2 cursor-ew-resize place-items-center rounded-lg bg-[#2563eb] text-white shadow-[0_0_0_2px_rgba(255,255,255,.9),0_8px_18px_rgba(37,99,235,.25)]"
            style={{ left: `${trimLeftPct}%` }}
          ><Scissors size={12} /></span>
          <span
            title="Drag to crop or extend the clip end"
            onPointerDown={event => beginTrimDrag(event, 'end')}
            className="absolute bottom-1 top-3 z-40 grid w-4 -translate-x-1/2 cursor-ew-resize place-items-center rounded-lg bg-[#2563eb] text-white shadow-[0_0_0_2px_rgba(255,255,255,.9),0_8px_18px_rgba(37,99,235,.25)]"
            style={{ left: `${trimLeftPct + trimWidthPct}%` }}
          ><Scissors size={12} /></span>
        </>}
        <span className="pointer-events-none absolute top-0 z-50 -translate-x-1/2 rounded-b-md bg-[#0b172a] px-1.5 py-0.5 text-[9px] font-black tabular-nums text-white shadow-[0_7px_16px_rgba(11,23,42,.22)]" style={{ left: `${playheadPct}%` }}>{timeLabel(playheadTime)}</span>
        <span className="pointer-events-none absolute bottom-1 top-3 z-30 w-0.5 -translate-x-1/2 rounded-full bg-[#0b172a] shadow-[0_0_0_2px_rgba(255,255,255,.86)]" style={{ left: `${playheadPct}%` }} />
      </div>
    </div>
  </div>;
}

function OverlayTrackStrip({ annotations, selectedId, segments, playheadTime, onSelect, onTimingChange, onBeginEdit }: {
  annotations: VideoAnnotation[];
  selectedId?: string;
  segments: TimelineSegment[];
  playheadTime: number;
  onSelect: (id: string) => void;
  onTimingChange: (id: string, patch: Partial<Pick<VideoAnnotation, 'startTime' | 'endTime'>>) => void;
  onBeginEdit?: () => void;
}) {
  const total = Math.max(0.2, timelineDuration(segments));
  const railRef = useRef<HTMLDivElement | null>(null);

  const pointerTime = (clientX: number, snap = true) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const raw = clampRange(((clientX - rect.left) / Math.max(1, rect.width)) * total, 0, total);
    return snap ? snapTimelineTime(raw, segments) : raw;
  };

  const beginDrag = (event: React.PointerEvent, annotation: VideoAnnotation, edge: 'start' | 'end' | 'move') => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(annotation.id);
    onBeginEdit?.();
    const originalStart = clampRange(annotation.startTime, 0, total);
    const originalEnd = clampRange(annotation.endTime, originalStart + MIN_ANNOTATION_DURATION, total);
    const originalPointer = pointerTime(event.clientX, false);
    const onMove = (moveEvent: PointerEvent) => {
      const nextTimeline = pointerTime(moveEvent.clientX);
      const delta = pointerTime(moveEvent.clientX, false) - originalPointer;
      if (edge === 'start') {
        onTimingChange(annotation.id, { startTime: Math.min(originalEnd - MIN_ANNOTATION_DURATION, nextTimeline) });
      } else if (edge === 'end') {
        onTimingChange(annotation.id, { endTime: Math.max(originalStart + MIN_ANNOTATION_DURATION, nextTimeline) });
      } else {
        const duration = annotation.endTime - annotation.startTime;
        const nextStartTimeline = snapTimelineTime(clampRange(originalStart + delta, 0, Math.max(0, total - MIN_ANNOTATION_DURATION)), segments);
        onTimingChange(annotation.id, { startTime: nextStartTimeline, endTime: nextStartTimeline + duration });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  return <div className="border-t border-[#d7e5f6] bg-white/88 px-2 py-2 backdrop-blur">
    <div className="mx-auto grid max-w-6xl gap-1.5">
      <div ref={railRef} className="relative grid max-h-28 gap-1 overflow-y-auto rounded-xl border border-[#d7e5f6] bg-[#f8fbff] p-1.5">
        {timelineSnapPoints(segments).map(point => <span key={point} className="pointer-events-none absolute bottom-1.5 top-1.5 z-0 w-px bg-[#bfdbfe]/70" style={{ left: `${(point / total) * 100}%` }} />)}
        {annotations.length === 0 && <div className="h-8 rounded-lg border border-dashed border-[#d7e5f6] bg-white/70" />}
        {annotations.map(annotation => {
          const start = clampRange(annotation.startTime, 0, total);
          const end = clampRange(annotation.endTime, start, total);
          const left = `${(start / total) * 100}%`;
          const width = `${Math.max(4, ((Math.max(start + 0.08, end) - start) / total) * 100)}%`;
          const active = annotation.id === selectedId;
          const label = annotation.text || annotation.type.replace('-', ' ');
          return <div key={annotation.id} className="relative h-8 rounded-lg bg-white/60">
            <button
              type="button"
              onClick={() => onSelect(annotation.id)}
              onPointerDown={event => beginDrag(event, annotation, 'move')}
              className={`absolute top-1 flex h-6 items-center justify-between gap-2 overflow-hidden rounded-md border px-2 text-left text-[10px] font-black shadow-sm ${active ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#bfdbfe] bg-white text-[#0b172a]'}`}
              style={{ left, width, borderColor: active ? '#2563eb' : annotation.color }}
            >
              <span className="truncate">{label}</span>
              <span className="shrink-0 tabular-nums opacity-75">{secondsLabel(annotationDuration(annotation))}</span>
            </button>
            <span onPointerDown={event => beginDrag(event, annotation, 'start')} className="absolute top-1 z-10 h-6 w-2 cursor-ew-resize rounded-l-md bg-white/90 ring-1 ring-[#93c5fd]" style={{ left }} />
            <span onPointerDown={event => beginDrag(event, annotation, 'end')} className="absolute top-1 z-10 h-6 w-2 -translate-x-full cursor-ew-resize rounded-r-md bg-white/90 ring-1 ring-[#93c5fd]" style={{ left: `calc(${left} + ${width})` }} />
          </div>;
        })}
        <span className="pointer-events-none absolute bottom-1.5 top-1.5 z-30 w-0.5 rounded-full bg-[#2563eb] shadow-[0_0_0_2px_rgba(37,99,235,.14)]" style={{ left: `calc(${(clampRange(playheadTime, 0, total) / total) * 100}% - 1px)` }} />
      </div>
    </div>
  </div>;
}

export function VideoAnalysisTool({ onHome, onOpenBoard, active = true }: VideoAnalysisToolProps) {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [currentClipId, setCurrentClipId] = useState<string>();
  const [tool, setTool] = useState<VideoTool>('select');
  const [editCommand, setEditCommand] = useState<EditCommand>('move');
  const [style, setStyle] = useState<DrawingStyle>(defaultStyle);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ start: number[]; current: number[] } | null>(null);
  const [selection, setSelection] = useState<{ start: number[]; current: number[] } | null>(null);
  const [polygonDraft, setPolygonDraft] = useState<number[][]>([]);
  const [polygonHover, setPolygonHover] = useState<number[] | null>(null);
  const [connectionDraftIds, setConnectionDraftIds] = useState<string[]>([]);
  const [connectionHover, setConnectionHover] = useState<number[] | null>(null);
  const [freezes, setFreezes] = useState<FreezeSegment[]>([]);
  const [freezeSeconds, setFreezeSeconds] = useState(3);
  const [currentTime, setCurrentTime] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [gridMode, setGridMode] = useState<GridMode>('off');
  const [previewZoom, setPreviewZoom] = useState(1.16);
  const [darkMode, setDarkMode] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [labelEditor, setLabelEditor] = useState<{ id: string; value: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const clipsRef = useRef<VideoClip[]>([]);
  const { ref: stageWrapRef, size: stageWrapSize } = useElementSize<HTMLDivElement>();
  const currentClip = clips.find(clip => clip.id === currentClipId);
  const duration = currentClip?.duration || videoRef.current?.duration || 0;
  const safeTrimEnd = trimEnd || duration || 0;
  const timelineSegments = useMemo(() => buildTimelineSegments(trimStart, safeTrimEnd || duration || 0, freezes), [duration, freezes, safeTrimEnd, trimStart]);
  const compositionDuration = useMemo(() => timelineDuration(timelineSegments), [timelineSegments]);
  const timelinePosition = useMemo(() => timelineToSource(timelineSegments, playheadTime), [playheadTime, timelineSegments]);
  const previewViewportSize = displaySize(stageWrapSize, currentClip);
  const stageSize = useMemo(() => scaledSize(previewViewportSize, previewZoom), [previewViewportSize.height, previewViewportSize.width, previewZoom]);
  const mapper = useMemo(() => makeMapper(stageSize.width, stageSize.height), [stageSize.height, stageSize.width]);
  const selectedAnnotation = annotations.find(annotation => annotation.id === selectedId) ?? annotations.find(annotation => selectedIds.includes(annotation.id));
  const selectedPoints = selectedAnnotation ? pointsAtTime(selectedAnnotation, playheadTime) : undefined;
  const selectedBounds = selectedAnnotation && selectedPoints ? boundsFromPoints(selectedAnnotation.type, selectedPoints) : undefined;
  const visibleAnnotations = annotations.slice().sort((a, b) => a.zIndex - b.zIndex);
  const connectionPreviewPoints = (() => {
    const sourceId = connectionDraftIds.at(-1);
    const source = sourceId ? annotations.find(annotation => annotation.id === sourceId && annotation.type === 'player-circle') : undefined;
    if (!source || !connectionHover) return undefined;
    return [...annotationCenterAtTime(source, playheadTime), connectionHover[0], connectionHover[1]];
  })();
  const draftAnnotation = draft && tool !== 'zone' && tool !== 'connection-line' ? (() => {
    const annotation = buildAnnotation(tool, draft.start, draft.current, style, playheadTime, annotations.length + 1);
    return annotation ? { ...annotation, motion: 'none' as OverlayMotion } : null;
  })() : null;
  const selectionRect = selection ? {
    x: Math.min(selection.start[0], selection.current[0]),
    y: Math.min(selection.start[1], selection.current[1]),
    width: Math.abs(selection.current[0] - selection.start[0]),
    height: Math.abs(selection.current[1] - selection.start[1]),
  } : null;

  const setSingleSelection = (annotationId?: string) => {
    setSelectedId(annotationId);
    setSelectedIds(annotationId ? [annotationId] : []);
  };

  const selectAnnotation = (annotationId: string, additive = false) => {
    if (!additive) {
      setSingleSelection(annotationId);
      return;
    }
    setSelectedIds(current => {
      const next = current.includes(annotationId) ? current.filter(idValue => idValue !== annotationId) : [...current, annotationId];
      setSelectedId(next.at(-1));
      return next;
    });
  };

  const clearConnectionDraft = () => {
    setConnectionDraftIds([]);
    setConnectionHover(null);
  };

  const chooseTool = (nextTool: VideoTool) => {
    setTool(nextTool);
    setEditCommand('move');
    setSingleSelection(undefined);
    clearConnectionDraft();
  };

  const returnToSelectTool = () => {
    setTool('select');
    setEditCommand('move');
    clearConnectionDraft();
  };

  const pushHistory = () => {
    const snapshot = makeHistorySnapshot(annotations, freezes);
    setUndoStack(current => [...current.slice(-79), snapshot]);
    setRedoStack([]);
  };

  const restoreHistorySnapshot = (snapshot: HistorySnapshot) => {
    const restored = cloneHistorySnapshot(snapshot);
    setAnnotations(restored.annotations);
    setFreezes(restored.freezes);
    setSingleSelection(undefined);
    setDraft(null);
    setSelection(null);
    setPolygonDraft([]);
    setPolygonHover(null);
    clearConnectionDraft();
  };

  const undoHistory = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    const currentSnapshot = makeHistorySnapshot(annotations, freezes);
    setUndoStack(current => current.slice(0, -1));
    setRedoStack(current => [...current.slice(-79), currentSnapshot]);
    restoreHistorySnapshot(previous);
  };

  const redoHistory = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    const currentSnapshot = makeHistorySnapshot(annotations, freezes);
    setRedoStack(current => current.slice(0, -1));
    setUndoStack(current => [...current.slice(-79), currentSnapshot]);
    restoreHistorySnapshot(next);
  };

  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  useEffect(() => {
    if (active) return;
    videoRef.current?.pause();
    setPlaying(false);
  }, [active]);

  useEffect(() => () => {
    clipsRef.current.forEach(clip => URL.revokeObjectURL(clip.url));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate, currentClipId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip || !playing) {
      video?.pause();
      return;
    }
    const total = Math.max(0.2, compositionDuration);
    let frame = 0;
    let virtualPlayhead = playheadTime >= total - 0.03 ? 0 : playheadTime;
    let activeSegmentId: string | undefined;
    let segmentStartedAt = performance.now();
    let segmentStartPlayhead = virtualPlayhead;

    const enterSegment = (nextPlayhead: number) => {
      const position = timelineToSource(timelineSegments, nextPlayhead);
      activeSegmentId = position.segment?.id;
      segmentStartedAt = performance.now();
      segmentStartPlayhead = nextPlayhead;
      video.playbackRate = playbackRate;
      if (!position.segment || position.segment.kind === 'freeze') {
        video.pause();
        if (Math.abs((video.currentTime || 0) - position.sourceTime) > 0.04) video.currentTime = position.sourceTime;
        return;
      }
      if (Math.abs((video.currentTime || 0) - position.sourceTime) > 0.08) video.currentTime = position.sourceTime;
      void video.play().catch(() => undefined);
    };

    enterSegment(virtualPlayhead);

    const tick = () => {
      const position = timelineToSource(timelineSegments, virtualPlayhead);
      const segment = position.segment;
      if (!segment) {
        setPlaying(false);
        return;
      }
      if (segment.id !== activeSegmentId) enterSegment(virtualPlayhead);

      if (segment.kind === 'freeze') {
        video.pause();
        if (Math.abs((video.currentTime || 0) - segment.sourceStart) > 0.04) video.currentTime = segment.sourceStart;
        const elapsed = ((performance.now() - segmentStartedAt) / 1000) * playbackRate;
        virtualPlayhead = Math.min(segment.timelineStart + segment.duration, segmentStartPlayhead + elapsed);
      } else {
        if (video.paused) void video.play().catch(() => undefined);
        const sourceTime = clampRange(video.currentTime || segment.sourceStart, segment.sourceStart, segment.sourceEnd);
        virtualPlayhead = segment.timelineStart + (sourceTime - segment.sourceStart);
        const expectedSource = timelineToSource(timelineSegments, virtualPlayhead).sourceTime;
        if (Math.abs(sourceTime - expectedSource) > 0.35) video.currentTime = expectedSource;
        if (sourceTime >= segment.sourceEnd - 0.025) {
          virtualPlayhead = segment.timelineStart + segment.duration;
          enterSegment(virtualPlayhead);
        }
      }

      const nextPosition = timelineToSource(timelineSegments, virtualPlayhead);
      setPlayheadTime(nextPosition.timelineTime);
      setCurrentTime(nextPosition.sourceTime);
      if (virtualPlayhead >= total - 0.001) {
        video.pause();
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      video.pause();
    };
  }, [compositionDuration, currentClip, playbackRate, playing, timelineSegments]);

  useEffect(() => {
    setDraft(null);
    setSelection(null);
    setPolygonDraft([]);
    setPolygonHover(null);
    setConnectionDraftIds([]);
    setConnectionHover(null);
    const stage = stageRef.current;
    if (stage) stage.container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
  }, [tool]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter(file => file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4'));
    if (!incoming.length) return;
    const nextClips = incoming.map(file => ({
      id: id(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      duration: 0,
      width: 1280,
      height: 720,
    }));
    setClips(current => [...current, ...nextClips]);
    setCurrentClipId(current => current ?? nextClips[0].id);
  }, []);

  const removeClip = (clipId: string) => {
    setClips(current => {
      const clip = current.find(item => item.id === clipId);
      if (clip) URL.revokeObjectURL(clip.url);
      const remaining = current.filter(item => item.id !== clipId);
      if (currentClipId === clipId) setCurrentClipId(remaining[0]?.id);
      return remaining;
    });
  };

  const updateClipMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const nextDuration = video.duration || 0;
    setClips(current => current.map(clip => clip.id === currentClipId ? {
      ...clip,
      duration: nextDuration,
      width: video.videoWidth || clip.width,
      height: video.videoHeight || clip.height,
    } : clip));
    setTrimStart(0);
    setTrimEnd(nextDuration);
    setCurrentTime(0);
    setPlayheadTime(0);
  };

  const selectAtTime = (time: number) => {
    const video = videoRef.current;
    const safe = clampRange(time, 0, duration || time);
    if (video) {
      video.pause();
      video.currentTime = safe;
    }
    setPlaying(false);
    setCurrentTime(safe);
    setPlayheadTime(sourceToTimeline(timelineSegments, safe));
  };

  const selectAtTimeline = (time: number) => {
    const video = videoRef.current;
    const snappedTime = snapTimelineTime(time, timelineSegments, 0.08);
    const position = timelineToSource(timelineSegments, snappedTime);
    if (video) {
      video.pause();
      video.currentTime = position.sourceTime;
    }
    setPlaying(false);
    setPlayheadTime(position.timelineTime);
    setCurrentTime(position.sourceTime);
  };

  const togglePlayback = async () => {
    if (!currentClip) return;
    const video = videoRef.current;
    setPlaying(current => {
      const next = !current;
      if (!next) {
        video?.pause();
        return false;
      }
      if (video) {
        const total = Math.max(0.2, compositionDuration);
        const startPlayhead = playheadTime >= total - 0.03 ? 0 : playheadTime;
        const position = timelineToSource(timelineSegments, startPlayhead);
        video.playbackRate = playbackRate;
        if (Math.abs((video.currentTime || 0) - position.sourceTime) > 0.08) video.currentTime = position.sourceTime;
        if (position.segment?.kind !== 'freeze') void video.play().catch(() => undefined);
      }
      return true;
    });
  };

  const pointerRel = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
    return mapper.toRel(pointer.x, pointer.y);
  };

  const pickConnectionDisc = (annotationId: string) => {
    const target = annotations.find(annotation => annotation.id === annotationId && annotation.type === 'player-circle');
    if (!target) return;
    const previousId = connectionDraftIds.at(-1);
    setSingleSelection(annotationId);
    if (!previousId || previousId === annotationId) {
      setConnectionDraftIds([annotationId]);
      setConnectionHover(annotationCenterAtTime(target, playheadTime));
      return;
    }
    const previous = annotations.find(annotation => annotation.id === previousId && annotation.type === 'player-circle');
    if (!previous) {
      setConnectionDraftIds([annotationId]);
      return;
    }
    const existing = annotations.find(annotation => annotation.type === 'connection-line'
      && annotation.connectionIds?.length === 2
      && ((annotation.connectionIds[0] === previousId && annotation.connectionIds[1] === annotationId)
        || (annotation.connectionIds[0] === annotationId && annotation.connectionIds[1] === previousId)));
    if (existing) {
      setSingleSelection(existing.id);
      clearConnectionDraft();
      return;
    }
    const points = [...annotationCenterAtTime(previous, playheadTime), ...annotationCenterAtTime(target, playheadTime)];
    const annotationTime = snapTimelineTime(playheadTime, timelineSegments, 0.12);
    const line = {
      ...makeConnectionLine(points, style, annotationTime, Math.max(0, Math.min(previous.zIndex, target.zIndex) - 0.05), [previousId, annotationId]),
      startTime: Math.min(previous.startTime, target.startTime, annotationTime),
      endTime: Math.max(previous.endTime, target.endTime, annotationTime + 0.5),
    };
    pushHistory();
    setAnnotations(current => [...current, line]);
    setSingleSelection(line.id);
    clearConnectionDraft();
    returnToSelectTool();
  };

  const finishPolygonDraft = () => {
    if (!polygonDraft.length) return;
    if (polygonDraft.length < 3) {
      setPolygonDraft([]);
      setPolygonHover(null);
      return;
    }
    const annotationTime = snapTimelineTime(playheadTime, timelineSegments, 0.12);
    const annotation = makePolygonArea(polygonDraft.flat(), style, annotationTime, annotations.length + 1);
    pushHistory();
    setAnnotations(current => [...current, annotation]);
    setSingleSelection(annotation.id);
    setPolygonDraft([]);
    setPolygonHover(null);
    returnToSelectTool();
  };

  const beginDraft = (stage: Konva.Stage) => {
    if (tool === 'select') {
      const rel = pointerRel(stage);
      setSelection({ start: [rel.x, rel.y], current: [rel.x, rel.y] });
      return;
    }
    const rel = pointerRel(stage);
    setSingleSelection(undefined);
    if (tool === 'zone') {
      const next = [...polygonDraft, [rel.x, rel.y]];
      setPolygonDraft(next);
      setPolygonHover([rel.x, rel.y]);
      return;
    }
    if (tool === 'connection-line') {
      return;
    }
    setDraft({ start: [rel.x, rel.y], current: [rel.x, rel.y] });
  };

  const finishDraft = (stage: Konva.Stage) => {
    if (!draft || tool === 'select') return;
    const rel = pointerRel(stage);
    const annotationTime = snapTimelineTime(playheadTime, timelineSegments, 0.12);
    const annotation = buildAnnotation(tool, draft.start, [rel.x, rel.y], style, annotationTime, annotations.length + 1);
    const distance = Math.hypot(rel.x - draft.start[0], rel.y - draft.start[1]);
    if (annotation && (distance > 0.006 || tool === 'text' || tool === 'spotlight' || tool === 'highlight' || tool === 'player-circle')) {
      pushHistory();
      setAnnotations(current => [...current, annotation]);
      setSingleSelection(annotation.id);
      returnToSelectTool();
    }
    setDraft(null);
  };

  const moveAnnotationAtTime = (annotationId: string, points: number[]) => {
    setAnnotations(current => current.map(annotation => {
      if (annotation.id !== annotationId) return annotation;
      const widened = {
        ...annotation,
        startTime: Math.min(annotation.startTime, playheadTime),
        endTime: Math.max(annotation.endTime, playheadTime + 0.25),
      };
      return upsertKeyframe(widened, playheadTime, points);
    }));
    setSingleSelection(annotationId);
  };

  const translateAnnotationAtTime = (annotationId: string, dx: number, dy: number) => {
    const ids = selectedIds.includes(annotationId) && selectedIds.length ? selectedIds : [annotationId];
    setAnnotations(current => current.map(annotation => {
      if (!ids.includes(annotation.id)) return annotation;
      const widened = {
        ...annotation,
        startTime: Math.min(annotation.startTime, playheadTime),
        endTime: Math.max(annotation.endTime, playheadTime + 0.25),
      };
      return upsertKeyframe(widened, playheadTime, translatePoints(annotation.type, pointsAtTime(annotation, playheadTime), dx, dy));
    }));
    setSelectedIds(ids);
    setSelectedId(annotationId);
  };

  const finishSelection = (stage: Konva.Stage) => {
    if (!selection) return;
    const rel = pointerRel(stage);
    const x1 = Math.min(selection.start[0], rel.x);
    const y1 = Math.min(selection.start[1], rel.y);
    const x2 = Math.max(selection.start[0], rel.x);
    const y2 = Math.max(selection.start[1], rel.y);
    const moved = Math.hypot(x2 - x1, y2 - y1) > 0.01;
    if (!moved) setSingleSelection(undefined);
    else {
      const box = { x1, y1, x2, y2 };
      const ids = visibleAnnotations
        .filter(annotation => !annotation.hidden)
        .filter(annotation => isAnnotationActive(annotation, playheadTime))
        .filter(annotation => intersects(box, boundsFromPoints(annotation.type, pointsAtTime(annotation, playheadTime))))
        .map(annotation => annotation.id);
      setSelectedIds(ids);
      setSelectedId(ids.at(-1));
    }
    setSelection(null);
  };

  const updateSelected = (patch: Partial<VideoAnnotation>) => {
    const targetId = selectedAnnotation?.id;
    if (!targetId) return;
    pushHistory();
    setAnnotations(current => current.map(annotation => annotation.id === targetId ? { ...annotation, ...patch } : annotation));
  };

  const editAnnotationText = (annotationId: string) => {
    const annotation = annotations.find(item => item.id === annotationId);
    if (!annotation || !(annotation.type === 'text' || annotation.type === 'highlight' || annotation.type === 'spotlight' || annotation.type === 'player-circle')) return;
    setLabelEditor({ id: annotationId, value: annotation.text ?? '' });
    setSingleSelection(annotationId);
  };

  const saveLabelEditor = () => {
    if (!labelEditor) return;
    pushHistory();
    setAnnotations(current => current.map(item => item.id === labelEditor.id ? { ...item, text: labelEditor.value } : item));
    setSingleSelection(labelEditor.id);
    setLabelEditor(null);
  };

  const setAnnotationBend = (annotationId: string, bend: number) => {
    setAnnotations(current => current.map(annotation => annotation.id === annotationId ? { ...annotation, bend } : annotation));
    setSingleSelection(annotationId);
  };

  const selectOverlayTrack = (annotationId: string) => {
    const annotation = annotations.find(item => item.id === annotationId);
    setSingleSelection(annotationId);
    if (annotation && !isAnnotationActive(annotation, playheadTime)) selectAtTimeline(annotation.startTime);
  };

  const updateSelectedTiming = (patch: Partial<Pick<VideoAnnotation, 'startTime' | 'endTime'>>) => {
    if (!selectedAnnotation) return;
    const total = Math.max(MIN_ANNOTATION_DURATION, compositionDuration || safeTrimEnd || duration || MIN_ANNOTATION_DURATION);
    const nextStart = clampRange(patch.startTime ?? selectedAnnotation.startTime, 0, Math.max(0, total - MIN_ANNOTATION_DURATION));
    const nextEnd = clampRange(patch.endTime ?? selectedAnnotation.endTime, nextStart + MIN_ANNOTATION_DURATION, total);
    updateSelected({ startTime: nextStart, endTime: nextEnd });
  };

  const snapSelectedTiming = (edge: 'start' | 'end') => {
    if (!selectedAnnotation) return;
    const snapped = closestTimelineSnap(edge === 'start' ? selectedAnnotation.startTime : selectedAnnotation.endTime, timelineSegments);
    if (edge === 'start') updateSelectedTiming({ startTime: Math.min(snapped, selectedAnnotation.endTime - MIN_ANNOTATION_DURATION) });
    else updateSelectedTiming({ endTime: Math.max(snapped, selectedAnnotation.startTime + MIN_ANNOTATION_DURATION) });
  };

  const fitSelectedToCurrentSegment = () => {
    if (!selectedAnnotation || !timelinePosition.segment) return;
    const startTime = timelinePosition.segment.timelineStart;
    const endTime = timelinePosition.segment.timelineStart + timelinePosition.segment.duration;
    updateSelectedTiming({ startTime, endTime });
  };

  const updateAnnotationTiming = (annotationId: string, patch: Partial<Pick<VideoAnnotation, 'startTime' | 'endTime'>>) => {
    setAnnotations(current => current.map(annotation => {
      if (annotation.id !== annotationId) return annotation;
      const total = Math.max(MIN_ANNOTATION_DURATION, compositionDuration || safeTrimEnd || duration || MIN_ANNOTATION_DURATION);
      const nextStart = clampRange(patch.startTime ?? annotation.startTime, 0, Math.max(0, total - MIN_ANNOTATION_DURATION));
      const nextEnd = clampRange(patch.endTime ?? annotation.endTime, nextStart + MIN_ANNOTATION_DURATION, total);
      return { ...annotation, startTime: nextStart, endTime: nextEnd };
    }));
    setSingleSelection(annotationId);
  };

  const resizeSelected = (axis: 'width' | 'height', value: number) => {
    if (!selectedAnnotation || !selectedBounds || !selectedPoints) return;
    const width = axis === 'width' ? value : selectedBounds.x2 - selectedBounds.x1;
    const height = axis === 'height' ? value : selectedBounds.y2 - selectedBounds.y1;
    moveAnnotationAtTime(selectedAnnotation.id, resizePoints(selectedAnnotation.type, selectedPoints, width, height));
  };

  const addKeyframe = () => {
    if (!selectedAnnotation) return;
    pushHistory();
    setAnnotations(current => current.map(annotation => annotation.id === selectedAnnotation.id
      ? upsertKeyframe(annotation, playheadTime, pointsAtTime(annotation, playheadTime))
      : annotation));
  };

  const jumpKeyframe = (direction: -1 | 1) => {
    if (!selectedAnnotation?.keyframes.length) return;
    const ordered = selectedAnnotation.keyframes.slice().sort((a, b) => a.time - b.time);
    const target = direction < 0
      ? ordered.filter(keyframe => keyframe.time < playheadTime - 0.04).at(-1) ?? ordered[0]
      : ordered.find(keyframe => keyframe.time > playheadTime + 0.04) ?? ordered.at(-1);
    if (target) selectAtTimeline(target.time);
  };

  const deleteKeyframe = (keyframeId: string) => {
    if (!selectedAnnotation) return;
    pushHistory();
    setAnnotations(current => current.map(annotation => annotation.id === selectedAnnotation.id
      ? { ...annotation, keyframes: annotation.keyframes.filter(keyframe => keyframe.id !== keyframeId) }
      : annotation));
  };

  const deleteSelected = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    pushHistory();
    setAnnotations(current => current.filter(annotation => !ids.includes(annotation.id)));
    setSingleSelection(undefined);
  };

  const duplicateSelected = () => {
    if (!selectedAnnotation) return;
    const copy = duplicateAnnotation(selectedAnnotation, playheadTime);
    pushHistory();
    setAnnotations(current => [...current, copy]);
    setSingleSelection(copy.id);
  };

  const addFreeze = () => {
    const freeze: FreezeSegment = { id: id(), time: currentTime, duration: clampRange(freezeSeconds, 0.5, 10) };
    pushHistory();
    setFreezes(current => [...current, freeze].sort((a, b) => a.time - b.time));
  };

  const updateFreezeDuration = (freezeId: string, duration: number) => {
    setFreezes(current => current.map(freeze => freeze.id === freezeId
      ? { ...freeze, duration: clampRange(duration, 0.5, 10) }
      : freeze));
  };

  const updateTrimRange = (nextStart: number, nextEnd: number) => {
    const sourceDuration = duration || currentClip?.duration || 0;
    if (!sourceDuration) return;
    const safeStart = clampRange(nextStart, 0, Math.max(0, nextEnd - 0.2));
    const safeEnd = clampRange(nextEnd, safeStart + 0.2, sourceDuration);
    const nextSegments = buildTimelineSegments(safeStart, safeEnd, freezes);
    const nextTotal = Math.max(0, timelineDuration(nextSegments));
    const nextPlayhead = clampRange(playheadTime, 0, nextTotal);
    const position = timelineToSource(nextSegments, nextPlayhead);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = position.sourceTime;
    }
    setPlaying(false);
    setTrimStart(safeStart);
    setTrimEnd(safeEnd);
    setPlayheadTime(position.timelineTime);
    setCurrentTime(position.sourceTime);
  };

  const exportSnapshot = async () => {
    const video = videoRef.current;
    if (!video || !currentClip) return;
    const width = currentClip.width || video.videoWidth || 1280;
    const height = currentClip.height || video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    drawCanvasGrid(ctx, gridMode, width, height);
    annotations.slice().sort((a, b) => a.zIndex - b.zIndex).forEach(annotation => drawCanvasAnnotation(ctx, annotation, playheadTime, width, height, playheadTime, annotations));
    await new Promise<void>(resolve => canvas.toBlob(blob => {
      if (blob) downloadBlob(blob, `video-analysis-${timeLabel(currentTime).replace(':', '-')}.png`);
      resolve();
    }, 'image/png'));
  };

  const exportAnalysis = async () => {
    const previewVideo = videoRef.current;
    if (!previewVideo || !currentClip || exporting) return;
    setExporting(true);
    setExportProgress(0);
    const originalTime = previewVideo.currentTime;
    const originalRate = previewVideo.playbackRate;
    previewVideo.pause();
    setPlaying(false);
    const exportVideo = document.createElement('video');
    exportVideo.src = currentClip.url;
    exportVideo.muted = true;
    exportVideo.playsInline = true;
    exportVideo.preload = 'auto';
    exportVideo.playbackRate = playbackRate;
    await waitForVideoMetadata(exportVideo);
    const outputWidth = currentClip.width || exportVideo.videoWidth || previewVideo.videoWidth || 1280;
    const outputHeight = Math.round(outputWidth / ((currentClip.width || 1280) / (currentClip.height || 720)));
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      exportVideo.pause();
      exportVideo.removeAttribute('src');
      exportVideo.load();
      setExporting(false);
      return;
    }
    const fps = 30;
    const stream = canvas.captureStream(0);
    const canvasTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    const mimeType = bestVideoMimeType();
    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: Math.max(8_000_000, Math.round(outputWidth * outputHeight * fps * 0.16)),
    };
    if (mimeType) recorderOptions.mimeType = mimeType;
    const recorder = new MediaRecorder(stream, recorderOptions);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
    const exportSegments = buildTimelineSegments(trimStart, safeTrimEnd || duration, freezes);
    const totalOutput = Math.max(0.2, timelineDuration(exportSegments));
    const exportRate = Math.max(0.05, playbackRate || 1);
    const exportDuration = totalOutput / exportRate;
    const totalFrames = Math.max(1, Math.ceil(exportDuration * fps));

    const renderFrame = (effectTime: number) => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, outputWidth, outputHeight);
      ctx.drawImage(exportVideo, 0, 0, outputWidth, outputHeight);
      drawCanvasGrid(ctx, gridMode, outputWidth, outputHeight);
      annotations.slice().sort((a, b) => a.zIndex - b.zIndex).forEach(annotation => drawCanvasAnnotation(ctx, annotation, effectTime, outputWidth, outputHeight, effectTime, annotations));
      canvasTrack?.requestFrame();
    };

    try {
      const initialPosition = timelineToSource(exportSegments, 0);
      await seekVideo(exportVideo, initialPosition.sourceTime);
      exportVideo.pause();
      recorder.start();
      let activeSegmentId: string | undefined;
      const startedAt = performance.now();
      for (let frame = 0; frame < totalFrames; frame += 1) {
        const outputTime = Math.min(exportDuration, frame / fps);
        const timelineTime = Math.min(totalOutput, outputTime * exportRate);
        const position = timelineToSource(exportSegments, timelineTime);
        const segment = position.segment;
        if (segment?.id !== activeSegmentId) {
          activeSegmentId = segment?.id;
          if (!segment || segment.kind === 'freeze') {
            exportVideo.pause();
            if (Math.abs((exportVideo.currentTime || 0) - position.sourceTime) > 0.04) await seekVideo(exportVideo, position.sourceTime);
          } else {
            exportVideo.playbackRate = exportRate;
            if (Math.abs((exportVideo.currentTime || 0) - position.sourceTime) > 0.025) await seekVideo(exportVideo, position.sourceTime);
            await exportVideo.play().catch(() => undefined);
          }
        }
        if (!segment || segment.kind === 'freeze') exportVideo.pause();
        else if (Math.abs((exportVideo.currentTime || 0) - position.sourceTime) > 0.04) await seekVideo(exportVideo, position.sourceTime);
        const frameSourceTime = segment?.kind === 'video'
          ? clampRange(exportVideo.currentTime || position.sourceTime, segment.sourceStart, segment.sourceEnd)
          : position.sourceTime;
        const frameTimelineTime = segment?.kind === 'video'
          ? segment.timelineStart + (frameSourceTime - segment.sourceStart)
          : timelineTime;
        renderFrame(frameTimelineTime);
        setExportProgress(clampRange(timelineTime / totalOutput, 0, 1));
        await wait(startedAt + ((frame + 1) / fps) * 1000 - performance.now());
      }
      recorder.stop();
      await stopped;
      const type = recorder.mimeType || mimeType || 'video/webm';
      const extension = type.includes('mp4') ? 'mp4' : 'webm';
      downloadBlob(new Blob(chunks, { type }), `football-video-analysis.${extension}`);
    } finally {
      stream.getTracks().forEach(track => track.stop());
      exportVideo.pause();
      exportVideo.removeAttribute('src');
      exportVideo.load();
      previewVideo.pause();
      previewVideo.playbackRate = originalRate;
      setCurrentTime(previewVideo.currentTime || originalTime || 0);
      setPlayheadTime(sourceToTimeline(timelineSegments, previewVideo.currentTime || originalTime || 0));
      setExportProgress(0);
      setExporting(false);
    }
  };

  return <div className={`tactics-shell video-analysis-shell ${darkMode ? 'video-dark' : ''} flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#f6f9ff] text-[#0b172a]`}>
    <header className="video-analysis-header relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/70 bg-white/70 px-3 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src="/ZTBLogo.png" alt="ZaidTacticsBoard logo" className="h-9 w-9 shrink-0 rounded-full bg-white object-cover p-0.5 shadow-[0_5px_18px_rgba(37,99,235,.28)] ring-1 ring-white/80" />
        <div className="min-w-0">
          <h1 className={`truncate bg-gradient-to-r bg-clip-text text-lg font-black leading-none text-transparent sm:text-xl ${darkMode ? 'from-white via-[#93c5fd] to-[#5eead4]' : 'from-[#07111f] via-[#2563eb] to-[#0f766e]'}`} style={{ fontFamily: '"Segoe UI Variable Display", "Aptos Display", Inter, system-ui, sans-serif' }}>Video Analysis</h1>
          <p className={`mt-0.5 hidden text-[8px] font-black uppercase tracking-[0.24em] sm:block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Football clip studio</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={() => setHelpOpen(true)} title="Help" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d7e5f6] bg-white/82 text-[#0b172a] hover:border-[#2563eb]"><HelpCircle size={15} /></button>
        <button type="button" onClick={() => setDarkMode(current => !current)} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d7e5f6] bg-white/82 text-[#0b172a] hover:border-[#2563eb]">{darkMode ? <Sun size={15} /> : <Moon size={15} />}</button>
        <button type="button" onClick={onHome} title="Studio home" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d7e5f6] bg-white/82 text-[#0b172a] hover:border-[#2563eb]"><Home size={15} /></button>
        <button type="button" onClick={onOpenBoard} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/82 px-2.5 text-xs font-black text-[#0b172a] hover:border-[#2563eb]"><ArrowLeft size={14} /> <span className="hidden sm:inline">Board</span></button>
      </div>
    </header>

    {!clips.length && <UploadPanel onFiles={addFiles} />}

    {clips.length > 0 && <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(16rem,42dvh)] gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1">
      <section className="video-canvas-area relative flex min-h-0 flex-col overflow-hidden bg-[linear-gradient(90deg,rgba(37,99,235,.035)_1px,transparent_1px),linear-gradient(0deg,rgba(37,99,235,.035)_1px,transparent_1px),radial-gradient(circle_at_18%_12%,#dbeafe,transparent_32%),linear-gradient(135deg,#f6f9ff,#eef7ff_48%,#fbfbf4)] bg-[size:70px_70px,70px_70px,auto,auto]">
        <div ref={stageWrapRef} className="relative min-h-0 flex-1 overflow-hidden p-1.5">
          <div className="grid h-full w-full place-items-center">
            <div className="relative overflow-hidden rounded-xl bg-slate-950 shadow-[0_24px_70px_rgba(11,23,42,.28)] ring-1 ring-[#d7e5f6]" style={{ width: previewViewportSize.width, height: previewViewportSize.height }}>
              <div className="absolute right-3 top-3 z-30 flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-slate-950/72 px-2 text-white shadow-[0_10px_30px_rgba(2,6,23,.3)] backdrop-blur">
                <Gauge size={14} />
                <input aria-label="Preview zoom" type="range" min="1" max="1.7" step="0.02" value={previewZoom} onChange={event => setPreviewZoom(Number(event.target.value))} className="h-7 w-24 accent-[#38bdf8]" />
                <span className="w-9 text-right text-[10px] font-black tabular-nums">{Math.round(previewZoom * 100)}%</span>
              </div>
              {tool === 'zone' && polygonDraft.length > 0 && <div className="absolute left-3 top-3 z-30 flex gap-1.5 rounded-lg border border-white/15 bg-slate-950/72 p-1 shadow-[0_10px_30px_rgba(2,6,23,.3)] backdrop-blur">
                <button type="button" onClick={finishPolygonDraft} disabled={polygonDraft.length < 3} className="h-8 rounded-md bg-[#2563eb] px-2 text-[10px] font-black text-white disabled:opacity-45">Close area</button>
                <button type="button" onClick={() => { setPolygonDraft([]); setPolygonHover(null); }} className="h-8 rounded-md bg-white/12 px-2 text-[10px] font-black text-white">Cancel</button>
              </div>}
              <div className="absolute left-1/2 top-1/2" style={{ width: stageSize.width, height: stageSize.height, transform: 'translate(-50%, -50%)' }}>
                {currentClip && <video
                  key={currentClip.id}
                  ref={videoRef}
                  src={currentClip.url}
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={updateClipMetadata}
                  className="absolute inset-0 h-full w-full object-cover"
                />}
                <Stage
                  ref={stageRef}
                  width={stageSize.width}
                  height={stageSize.height}
                  className="absolute inset-0"
                  onContextMenu={event => {
                    event.evt.preventDefault();
                    if (tool === 'zone' && polygonDraft.length) {
                      finishPolygonDraft();
                      return;
                    }
                    if (connectionDraftIds.length) clearConnectionDraft();
                  }}
                  onMouseDown={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    if (connectionDraftIds.length && event.target === stage) {
                      event.evt.preventDefault();
                      clearConnectionDraft();
                      return;
                    }
                    if (event.evt.button === 2) {
                      event.evt.preventDefault();
                      return;
                    }
                    if (event.target !== stage && tool === 'select') return;
                    beginDraft(stage);
                  }}
                  onMouseMove={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    const rel = pointerRel(stage);
                    if (tool === 'zone' && polygonDraft.length) setPolygonHover([rel.x, rel.y]);
                    if (tool === 'player-circle' && connectionDraftIds.length) setConnectionHover([rel.x, rel.y]);
                    setSelection(current => current ? { ...current, current: [rel.x, rel.y] } : current);
                    setDraft(current => current ? { ...current, current: [rel.x, rel.y] } : current);
                  }}
                  onMouseUp={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    if (selection) finishSelection(stage);
                    else finishDraft(stage);
                  }}
                  onTouchStart={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    if (event.target !== stage && tool === 'select') return;
                    beginDraft(stage);
                  }}
                  onTouchMove={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    const rel = pointerRel(stage);
                    if (tool === 'zone' && polygonDraft.length) setPolygonHover([rel.x, rel.y]);
                    setSelection(current => current ? { ...current, current: [rel.x, rel.y] } : current);
                    setDraft(current => current ? { ...current, current: [rel.x, rel.y] } : current);
                  }}
                  onTouchEnd={event => {
                    const stage = event.target.getStage();
                    if (!stage) return;
                    if (selection) finishSelection(stage);
                    else finishDraft(stage);
                  }}
                >
                <Layer listening={false}>
                  {gridMode !== 'off' && <>
                    {(gridMode === 'thirds' ? [1 / 3, 2 / 3] : [0.18, 0.38, 0.62, 0.82]).map(value => <Line key={`v-${value}`} points={[stageSize.width * value, 0, stageSize.width * value, stageSize.height]} stroke="#ffffff" strokeWidth={2} opacity={0.34} dash={[14, 14]} />)}
                    {(gridMode === 'thirds' ? [1 / 3, 2 / 3] : [0.2, 0.5, 0.8]).map(value => <Line key={`h-${value}`} points={[0, stageSize.height * value, stageSize.width, stageSize.height * value]} stroke="#ffffff" strokeWidth={2} opacity={0.28} dash={[14, 14]} />)}
                  </>}
                </Layer>
                <Layer>
                  {connectionPreviewPoints && <Line
                    points={[
                      ...mapper.toAbs(connectionPreviewPoints[0], connectionPreviewPoints[1]),
                      ...mapper.toAbs(connectionPreviewPoints[2], connectionPreviewPoints[3]),
                    ]}
                    stroke="#e5e7eb"
                    strokeWidth={Math.max(2.5, style.strokeWidth)}
                    opacity={0.82}
                    lineCap="round"
                    lineJoin="round"
                    shadowColor="#020617"
                    shadowBlur={6}
                    shadowOpacity={0.22}
                    listening={false}
                  />}
                  {visibleAnnotations.map(annotation => <VideoAnnotationShape
                    key={annotation.id}
                    annotation={annotation}
                    time={playheadTime}
                    effectTime={playheadTime}
                    mapper={mapper}
                    selected={selectedIds.includes(annotation.id) || connectionDraftIds.includes(annotation.id)}
                    shapeEditing={editCommand === 'shape'}
                    linkedAnnotations={annotations}
                    connectMode={tool === 'player-circle'}
                    connectArmed={connectionDraftIds.length > 0}
                    onSelect={selectAnnotation}
                    onMoveAtTime={moveAnnotationAtTime}
                    onTranslateAtTime={translateAnnotationAtTime}
                    onEditText={editAnnotationText}
                    onSetBend={setAnnotationBend}
                    onConnectPick={pickConnectionDisc}
                    onConnectCancel={clearConnectionDraft}
                    onBeginEdit={pushHistory}
                  />)}
                  {draftAnnotation && <VideoAnnotationShape annotation={draftAnnotation} time={playheadTime} effectTime={playheadTime} mapper={mapper} selected={false} shapeEditing={false} linkedAnnotations={annotations} onSelect={() => undefined} onMoveAtTime={() => undefined} onTranslateAtTime={() => undefined} onEditText={() => undefined} onSetBend={() => undefined} />}
                  {tool === 'zone' && polygonDraft.length > 0 && <Group listening={false}>
                    <Line
                      points={[...polygonDraft, polygonHover].filter(Boolean).flatMap(point => mapper.toAbs(point![0], point![1]))}
                      closed={polygonDraft.length >= 3}
                      fill={polygonDraft.length >= 3 ? style.fill : undefined}
                      opacity={polygonDraft.length >= 3 ? clampRange(style.opacity, 0, 1) : 1}
                      stroke={style.color}
                      strokeWidth={Math.max(2, style.strokeWidth)}
                      dash={[8, 8]}
                      lineJoin="round"
                    />
                    {polygonDraft.map((point, index) => {
                      const [px, py] = mapper.toAbs(point[0], point[1]);
                      return <Circle key={index} x={px} y={py} radius={5} fill="#ffffff" stroke="#2563eb" strokeWidth={2} />;
                    })}
                  </Group>}
                  {selectionRect && <Rect
                    x={selectionRect.x * mapper.width}
                    y={selectionRect.y * mapper.height}
                    width={selectionRect.width * mapper.width}
                    height={selectionRect.height * mapper.height}
                    fill="#2563eb"
                    opacity={0.1}
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    dash={[8, 10]}
                    cornerRadius={4}
                    listening={false}
                  />}
                </Layer>
                </Stage>
              </div>
              {exporting && <div className="absolute inset-x-6 bottom-6 z-30 overflow-hidden rounded-lg bg-white/90 p-2 shadow-[0_12px_40px_rgba(11,23,42,.28)] backdrop-blur">
                <div className="h-2 overflow-hidden rounded-full bg-[#d7e5f6]">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${Math.round(exportProgress * 100)}%` }} />
                </div>
              </div>}
            </div>
          </div>
        </div>
        <OverlayTrackStrip annotations={annotations} selectedId={selectedId} segments={timelineSegments} playheadTime={playheadTime} onSelect={selectOverlayTrack} onTimingChange={updateAnnotationTiming} onBeginEdit={pushHistory} />
        <MediaStrip
          segments={timelineSegments}
          playheadTime={playheadTime}
          trimStart={trimStart}
          trimEnd={safeTrimEnd || duration || 0}
          sourceDuration={duration || 0}
          onSeek={selectAtTimeline}
          onFreezeDurationChange={updateFreezeDuration}
          onTrimChange={updateTrimRange}
          onBeginEdit={pushHistory}
        />

        <div className="shrink-0 border-t border-[#d7e5f6] bg-white/88 p-2 shadow-[0_-18px_50px_rgba(11,23,42,.07)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <button type="button" onClick={() => void togglePlayback()} className="grid h-10 w-10 place-items-center rounded-lg bg-[#2563eb] text-white disabled:opacity-45" disabled={!currentClip}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button type="button" title="Undo" onClick={undoHistory} disabled={!undoStack.length} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a] disabled:opacity-35"><Undo2 size={16} /></button>
            <button type="button" title="Redo" onClick={redoHistory} disabled={!redoStack.length} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a] disabled:opacity-35"><Redo2 size={16} /></button>
            <button type="button" title="Previous frame" onClick={() => selectAtTimeline(Math.max(0, playheadTime - FRAME_STEP_SECONDS))} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a]"><ArrowLeft size={16} /></button>
            <button type="button" title="Next frame" onClick={() => selectAtTimeline(Math.min(compositionDuration || 0, playheadTime + FRAME_STEP_SECONDS))} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a]"><ArrowRight size={16} /></button>
            <span className="rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-center text-xs font-black tabular-nums text-[#0b172a]">{timeLabel(playheadTime)} / {timeLabel(compositionDuration || 0)}</span>
            <span className="rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#2563eb]">{timelinePosition.segment?.kind === 'freeze' ? 'Freeze image' : 'Video clip'}</span>
            <span className="ml-auto rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Snap on</span>
          </div>
        </div>
      </section>

      <aside className="dock-shell min-h-0 overflow-y-auto border-t border-[#d7e5f6] bg-white/95 shadow-[0_-18px_60px_rgba(11,23,42,.08)] backdrop-blur lg:border-l lg:border-t-0">
        <div className="grid gap-2 p-2">
          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Clips</p>
              <label className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-[#2563eb] text-white" title="Add clips">
                <Plus size={15} />
                <input type="file" accept="video/mp4,video/*" multiple className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.currentTarget.value = '';
                }} />
              </label>
            </div>
            <div className="mt-2 grid gap-1.5">
              {clips.map(clip => <div key={clip.id} className={`grid grid-cols-[1fr_auto] items-center gap-1.5 rounded-lg border p-1.5 ${clip.id === currentClipId ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#d7e5f6] bg-white/80'}`}>
                <button type="button" onClick={() => setCurrentClipId(clip.id)} className="min-w-0 text-left">
                  <span className="block truncate text-xs font-black text-[#0b172a]">{clip.name}</span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{clip.duration ? timeLabel(clip.duration) : 'Loading'}</span>
                </button>
                <button type="button" title="Remove clip" onClick={() => removeClip(clip.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100"><X size={14} /></button>
              </div>)}
            </div>
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Tools</p>
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              <button type="button" aria-pressed={editCommand === 'move'} onClick={() => setEditCommand('move')} className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-black ${editCommand === 'move' ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/86 text-[#0b172a] hover:border-[#2563eb]'}`}>
                <MousePointer2 size={14} /> Move
              </button>
              <button type="button" aria-pressed={editCommand === 'shape'} onClick={() => setEditCommand('shape')} className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-black ${editCommand === 'shape' ? 'border-[#0f766e] bg-[#0f766e] text-white' : 'border-[#d7e5f6] bg-white/86 text-[#0b172a] hover:border-[#0f766e]'}`}>
                <Square size={14} /> Shape
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tools.map(({ id: toolId, label, icon: Icon }) => <button key={toolId} type="button" title={label} aria-pressed={tool === toolId} onClick={() => chooseTool(toolId)} className={`flex h-9 items-center justify-center gap-1 rounded-lg border px-1 text-[9px] font-black ${tool === toolId ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/86 text-[#0b172a] hover:border-[#2563eb]'}`}>
                <Icon size={14} />
                <span className="min-w-0 truncate">{label}</span>
              </button>)}
            </div>
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Style</p>
              <div className="flex items-center gap-1">
                <button type="button" title="Duplicate selected" onClick={duplicateSelected} disabled={!selectedAnnotation} className="grid h-8 w-8 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a] disabled:opacity-35"><Copy size={14} /></button>
                <button type="button" title="Delete selected" onClick={deleteSelected} disabled={!selectedAnnotation} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 disabled:opacity-35"><Trash2 size={14} /></button>
                <button type="button" title="Clear annotations" onClick={() => { pushHistory(); setAnnotations([]); setSingleSelection(undefined); clearConnectionDraft(); }} disabled={!annotations.length} className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-white disabled:opacity-35"><Eraser size={14} /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Line
                <input aria-label="Line color" type="color" value={selectedAnnotation?.color ?? style.color} onChange={event => selectedAnnotation ? updateSelected({ color: event.target.value }) : setStyle(current => ({ ...current, color: event.target.value }))} className="h-9 w-full" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Fill
                <input aria-label="Fill color" type="color" value={selectedAnnotation?.fill ?? style.fill} onChange={event => selectedAnnotation ? updateSelected({ fill: event.target.value }) : setStyle(current => ({ ...current, fill: event.target.value }))} className="h-9 w-full" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Width
                <input type="range" min="1" max="10" step="0.5" value={selectedAnnotation?.strokeWidth ?? style.strokeWidth} onChange={event => selectedAnnotation ? updateSelected({ strokeWidth: Number(event.target.value) }) : setStyle(current => ({ ...current, strokeWidth: Number(event.target.value) }))} className="h-9 w-full accent-[#2563eb]" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Opacity
                <input type="range" min="0" max="1" step="0.02" value={selectedAnnotation?.opacity ?? style.opacity} onChange={event => selectedAnnotation ? updateSelected({ opacity: Number(event.target.value) }) : setStyle(current => ({ ...current, opacity: Number(event.target.value) }))} className="h-9 w-full accent-[#2563eb]" />
              </label>
            </div>
            {selectedAnnotation && (selectedAnnotation.type === 'zone' || selectedAnnotation.type === 'polygon-zone' || selectedAnnotation.type === 'circle-zone' || selectedAnnotation.type === 'player-circle' || selectedAnnotation.type === 'connection-line' || selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'spotlight') && <label className="dock-field mt-2 block space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Outline
              <input type="range" min="0" max="1" step="0.05" value={selectedAnnotation.outlineOpacity} onChange={event => updateSelected({ outlineOpacity: Number(event.target.value) })} className="h-9 w-full accent-[#2563eb]" />
            </label>}
            {selectedAnnotation && (selectedAnnotation.type === 'zone' || selectedAnnotation.type === 'polygon-zone' || selectedAnnotation.type === 'circle-zone' || selectedAnnotation.type === 'player-circle' || selectedAnnotation.type === 'connection-line' || selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'spotlight') && <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => updateSelected({ outlineOpacity: selectedAnnotation.outlineOpacity > 0.01 ? 0 : 1 })} className="h-8 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a]">{selectedAnnotation.outlineOpacity > 0.01 ? 'No outline' : 'Show outline'}</button>
              {selectedAnnotation.type !== 'connection-line' && <button type="button" onClick={() => updateSelected({ opacity: selectedAnnotation.opacity > 0.01 ? 0 : defaultStyle.opacity })} className="h-8 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a]">{selectedAnnotation.opacity > 0.01 ? 'No fill' : 'Show fill'}</button>}
            </div>}
            {selectedAnnotation && (selectedAnnotation.type === 'text' || selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'spotlight' || selectedAnnotation.type === 'player-circle') && <label className="dock-field mt-2 block space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Label
              <input value={selectedAnnotation.text ?? ''} onChange={event => updateSelected({ text: event.target.value })} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a] outline-none focus:border-[#2563eb]" />
            </label>}
            {selectedAnnotation && (selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'spotlight' || selectedAnnotation.type === 'player-circle') && <button type="button" onClick={() => updateSelected({ labelVisible: !annotationLabelVisible(selectedAnnotation), text: selectedAnnotation.text || 'Player' })} className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 text-xs font-black text-[#0b172a]">
              <Type size={14} /> {annotationLabelVisible(selectedAnnotation) ? 'Hide name' : 'Show name'}
            </button>}
            {selectedAnnotation && <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Start
                <input type="number" min="0" max={compositionDuration || 0} step="0.01" value={Number(selectedAnnotation.startTime.toFixed(2))} onChange={event => updateSelectedTiming({ startTime: Number(event.target.value) || 0 })} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a]" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Lasts
                <input type="number" min={MIN_ANNOTATION_DURATION} max="30" step="0.01" value={Number(annotationDuration(selectedAnnotation).toFixed(2))} onChange={event => updateSelectedTiming({ endTime: selectedAnnotation.startTime + Math.max(MIN_ANNOTATION_DURATION, Number(event.target.value) || MIN_ANNOTATION_DURATION) })} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a]" />
              </label>
            </div>}
            {selectedAnnotation && <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button type="button" onClick={() => snapSelectedTiming('start')} className="h-8 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a]">Snap in</button>
              <button type="button" onClick={() => snapSelectedTiming('end')} className="h-8 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a]">Snap out</button>
              <button type="button" onClick={fitSelectedToCurrentSegment} disabled={!timelinePosition.segment} className="h-8 rounded-lg bg-[#0f766e] text-[10px] font-black text-white disabled:opacity-35">Fit block</button>
            </div>}
            {selectedAnnotation && editCommand === 'shape' && selectedBounds && selectedAnnotation.type !== 'text' && selectedAnnotation.type !== 'connection-line' && <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Object W
                <input type="range" min="0.02" max="0.82" step="0.01" value={clampRange(selectedBounds.x2 - selectedBounds.x1, 0.02, 0.82)} onChange={event => resizeSelected('width', Number(event.target.value))} className="h-9 w-full accent-[#2563eb]" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Object H
                <input type="range" min="0.02" max="0.82" step="0.01" value={clampRange(selectedBounds.y2 - selectedBounds.y1, 0.02, 0.82)} onChange={event => resizeSelected('height', Number(event.target.value))} className="h-9 w-full accent-[#2563eb]" />
              </label>
            </div>}
            {selectedAnnotation && editCommand === 'shape' && (selectedAnnotation.type === 'arrow' || selectedAnnotation.type === 'dashed-line' || selectedAnnotation.type === 'run') && <label className="dock-field mt-2 block space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Bend
              <input type="range" min="-0.55" max="0.55" step="0.01" value={selectedAnnotation.bend} onChange={event => updateSelected({ bend: Number(event.target.value) })} className="h-9 w-full accent-[#2563eb]" />
            </label>}
            {selectedAnnotation && <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => updateSelected({ hidden: !selectedAnnotation.hidden })} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 text-xs font-black text-[#0b172a]">{selectedAnnotation.hidden ? <Eye size={14} /> : <EyeOff size={14} />} {selectedAnnotation.hidden ? 'Show' : 'Hide'}</button>
              <button type="button" onClick={() => updateSelected({ locked: !selectedAnnotation.locked })} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 text-xs font-black text-[#0b172a]">{selectedAnnotation.locked ? <Unlock size={14} /> : <Lock size={14} />} {selectedAnnotation.locked ? 'Unlock' : 'Lock'}</button>
            </div>}
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Keyframes</p>
              {selectedAnnotation && <span className="rounded-md bg-[#eff6ff] px-2 py-1 text-[10px] font-black tabular-nums text-[#2563eb]">{selectedAnnotation.keyframes.length}</span>}
            </div>
            <div className="mb-2 grid grid-cols-[1fr_1.55fr_1fr] gap-1.5">
              <button type="button" title="Previous keyframe" onClick={() => jumpKeyframe(-1)} disabled={!selectedAnnotation?.keyframes.length} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a] disabled:opacity-35"><ArrowLeft size={13} /> Prev</button>
              <button type="button" onClick={addKeyframe} disabled={!selectedAnnotation} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] px-2 text-xs font-black text-white disabled:opacity-35"><KeyRound size={14} /> Keyframe</button>
              <button type="button" title="Next keyframe" onClick={() => jumpKeyframe(1)} disabled={!selectedAnnotation?.keyframes.length} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#d7e5f6] bg-white/80 text-[10px] font-black text-[#0b172a] disabled:opacity-35">Next <MoveRight size={13} /></button>
            </div>
            {selectedAnnotation && <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Enter/exit
                <select value={selectedAnnotation.motion} onChange={event => updateSelected({ motion: event.target.value as OverlayMotion })} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case text-[#0b172a]">
                  {motionOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Visual FX
                <select value={selectedAnnotation.pattern === 'pulse-border' ? 'none' : selectedAnnotation.pattern} onChange={event => updateSelected({ pattern: event.target.value as OverlayPattern })} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case text-[#0b172a]">
                  {patternOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
            </div>}
            {selectedAnnotation ? <div className="flex flex-wrap gap-1.5">
              {selectedAnnotation.keyframes.map(keyframe => {
                const active = Math.abs(keyframe.time - playheadTime) < 0.05;
                return <button key={keyframe.id} type="button" onClick={() => selectAtTimeline(keyframe.time)} className={`group flex h-8 items-center gap-1 rounded-lg border px-2 text-[10px] font-black ${active ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>
                {timeLabel(keyframe.time)}
                <span onClick={event => { event.stopPropagation(); deleteKeyframe(keyframe.id); }} className={`grid h-5 w-5 place-items-center rounded-md ${active ? 'text-white/90 hover:bg-white/15' : 'text-red-500 group-hover:bg-red-50'}`}><X size={12} /></span>
              </button>;
              })}
            </div> : <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/70 px-3 py-4 text-center text-xs font-semibold text-slate-500">Select an overlay.</div>}
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Freeze</p>
              <button type="button" onClick={addFreeze} className="flex h-8 items-center gap-1.5 rounded-lg bg-[#0f766e] px-2.5 text-xs font-black text-white"><Snowflake size={14} /> Add</button>
            </div>
            <label className="dock-field block space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Seconds
              <input type="number" min="0.5" max="10" step="0.5" value={freezeSeconds} onChange={event => setFreezeSeconds(Number(event.target.value) || 0.5)} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a] outline-none focus:border-[#2563eb]" />
            </label>
            <div className="mt-2 grid gap-1.5">
              {freezes.map(freeze => <div key={freeze.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 py-1.5">
                <button type="button" onClick={() => selectAtTime(freeze.time)} className="text-xs font-black text-[#0b172a]">{timeLabel(freeze.time)} / {freeze.duration}s</button>
                <button type="button" onClick={() => { pushHistory(); setFreezes(current => current.filter(item => item.id !== freeze.id)); }} className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-red-600"><Trash2 size={13} /></button>
              </div>)}
              {!freezes.length && <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/70 px-3 py-4 text-center text-xs font-semibold text-slate-500">No freezes yet.</div>}
            </div>
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Playback & Range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Speed
                <select value={playbackRate} onChange={event => setPlaybackRate(Number(event.target.value))} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case text-[#0b172a]">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5].map(rate => <option key={rate} value={rate}>{rate}x</option>)}
                </select>
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Grid
                <select value={gridMode} onChange={event => setGridMode(event.target.value as GridMode)} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case text-[#0b172a]">
                  <option value="off">Off</option>
                  <option value="thirds">Thirds</option>
                  <option value="lanes">Lanes</option>
                </select>
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">In point
                <input type="number" min="0" max={duration || 0} step="0.1" value={Number(trimStart.toFixed(1))} onChange={event => setTrimStart(clampRange(Number(event.target.value) || 0, 0, Math.max(0, safeTrimEnd - 0.2)))} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a]" />
              </label>
              <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Out point
                <input type="number" min="0" max={duration || 0} step="0.1" value={Number((safeTrimEnd || 0).toFixed(1))} onChange={event => setTrimEnd(clampRange(Number(event.target.value) || duration, trimStart + 0.2, duration || Number(event.target.value)))} className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a]" />
              </label>
              <button type="button" onClick={() => setTrimStart(clampRange(currentTime, 0, Math.max(0, safeTrimEnd - 0.2)))} className="h-9 rounded-lg border border-[#d7e5f6] bg-white/80 text-xs font-black text-[#0b172a]">Set In</button>
              <button type="button" onClick={() => setTrimEnd(clampRange(currentTime, trimStart + 0.2, duration || currentTime))} className="h-9 rounded-lg border border-[#d7e5f6] bg-white/80 text-xs font-black text-[#0b172a]">Set Out</button>
            </div>
          </section>

          <section className="dock-panel rounded-xl border border-[#d7e5f6] bg-white/76 p-2.5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Export</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void exportSnapshot()} disabled={!currentClip || exporting} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 text-sm font-black text-[#0b172a] disabled:opacity-40"><Scissors size={16} /> PNG</button>
              <button type="button" onClick={() => void exportAnalysis()} disabled={!currentClip || exporting} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-sm font-black text-white disabled:opacity-40">{exporting ? <Gauge size={16} /> : <Download size={16} />} MP4</button>
            </div>
          </section>
        </div>
      </aside>
    </main>}
    {helpOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/62 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[min(42rem,92dvh)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#d7e5f6] bg-white/95 p-3 shadow-[0_24px_80px_rgba(2,6,23,.34)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Video editor help</p>
            <h2 className="mt-1 text-lg font-black text-[#07111f]">Tools and gestures</h2>
          </div>
          <button type="button" onClick={() => setHelpOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a]"><X size={14} /></button>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Move</span>Use Move for normal work. Dragging an overlay moves the whole object only and creates or updates its keyframe at the playhead.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Shape</span>Use Shape when you want point handles, resize handles, or line bend controls. Switch back to Move before repositioning.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Lines</span>Drag on the video to place pass arrows, dashed lines, and carry runs. The same tool stays active for the next line.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Tactical area</span>Left-click to add as many points as needed. Right-click or tap Close area to connect the shape.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Player disc</span>Click or drag to place a disc. Turn the name on in Style, then edit the label text.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Connections</span>Choose Player disc, right-click one disc, then right-click another disc to link them.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Timing</span>Use the overlay track or Start and Lasts fields. Lasts can go down to a single 30 fps frame.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Spotlight</span>Click or drag over the target, then resize the pool with the corner handle.</div>
          <div className="rounded-lg border border-[#d7e5f6] bg-[#f8fbff] p-3"><span className="block text-xs font-black text-[#0b172a]">Transparent style</span>Use No outline or No fill when an item should keep its timing and handles but render without that part.</div>
        </div>
      </div>
    </div>}
    {labelEditor && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/62 p-4 backdrop-blur-sm">
      <form
        onSubmit={event => {
          event.preventDefault();
          saveLabelEditor();
        }}
        className="w-full max-w-sm rounded-xl border border-[#d7e5f6] bg-white/95 p-3 shadow-[0_24px_80px_rgba(2,6,23,.34)]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Edit label</p>
          <button type="button" onClick={() => setLabelEditor(null)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#0b172a]"><X size={14} /></button>
        </div>
        <input
          autoFocus
          value={labelEditor.value}
          onChange={event => setLabelEditor(current => current ? { ...current, value: event.target.value } : current)}
          className="h-11 w-full rounded-lg border border-[#bfdbfe] bg-white/80 px-3 text-sm font-black text-[#0b172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setLabelEditor(null)} className="h-10 rounded-lg border border-[#d7e5f6] bg-white/80 text-sm font-black text-[#0b172a]">Cancel</button>
          <button type="submit" className="h-10 rounded-lg bg-[#2563eb] text-sm font-black text-white">Save</button>
        </div>
      </form>
    </div>}
  </div>;
}
