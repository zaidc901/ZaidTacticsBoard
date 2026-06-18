import { useCallback, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { ControlDock, DockModeSwitcher, PitchScaleControl, QuickActions } from './components/ControlDock';
import { PitchCanvas } from './components/PitchCanvas';
import { StudioHome } from './components/StudioHome';
import { VideoAnalysisTool } from './components/VideoAnalysisTool';
import { useTacticsStore } from './store/tacticsStore';
import { Drawing, ExportRegion, PlaybackDrawing, PlaybackFrame, Scene } from './types/domain';
import { exportStageImage, recordStageAnimation } from './utils/exporters';

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
type AppMode = 'home' | 'board' | 'video';

function modeFromHash(): AppMode {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'board' || hash === 'video') return hash;
  return 'home';
}

function ease(progress: number, mode: Scene['transition']) {
  if (mode === 'linear') return progress;
  if (mode === 'ease-in') return progress * progress;
  if (mode === 'ease-out') return 1 - (1 - progress) * (1 - progress);
  return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function interpolateScene(from: Scene, to: Scene, progress: number): PlaybackFrame {
  const eased = ease(progress, to.transition);
  const ids = new Set([...Object.keys(from.playerPositions), ...Object.keys(to.playerPositions)]);
  const playerPositions: PlaybackFrame['playerPositions'] = {};
  ids.forEach(id => {
    const start = from.playerPositions[id] ?? to.playerPositions[id];
    const end = to.playerPositions[id] ?? start;
    playerPositions[id] = {
      x: start.x + (end.x - start.x) * eased,
      y: start.y + (end.y - start.y) * eased,
    };
  });
  return {
    playerPositions,
    ball: {
      ...to.ball,
      x: from.ball.x + (to.ball.x - from.ball.x) * eased,
      y: from.ball.y + (to.ball.y - from.ball.y) * eased,
    },
    drawings: interpolateDrawings(from.drawings, to.drawings, eased),
  };
}

function parseColor(value?: string) {
  if (!value) return undefined;
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
  if (hex) {
    const expanded = hex.length <= 4 ? hex.split('').map(character => character + character).join('') : hex;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!rgb) return undefined;
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
}

function interpolateColor(from: string | undefined, to: string | undefined, progress: number) {
  const startValue = from ?? to;
  const endValue = to ?? from;
  if (!startValue || !endValue) return endValue;
  const start = parseColor(startValue);
  const end = parseColor(endValue);
  if (!start || !end) return progress < 0.5 ? startValue : endValue;
  const channel = (a: number, b: number) => Math.round(a + (b - a) * progress);
  const alpha = start.a + (end.a - start.a) * progress;
  return `rgba(${channel(start.r, end.r)}, ${channel(start.g, end.g)}, ${channel(start.b, end.b)}, ${alpha.toFixed(3)})`;
}

function interpolateDrawings(from: Drawing[], to: Drawing[], progress: number): PlaybackDrawing[] {
  const byId = new Map<string, { from?: Drawing; to?: Drawing }>();
  from.forEach(drawing => byId.set(drawing.id, { from: drawing }));
  to.forEach(drawing => {
    const entry = byId.get(drawing.id) ?? {};
    byId.set(drawing.id, { ...entry, to: drawing });
  });

  return Array.from(byId.entries()).flatMap(([id, entry]) => {
    const base = entry.to ?? entry.from;
    if (!base) return [];
    const transitionVisibility = !entry.from ? progress : !entry.to ? 1 - progress : 1;
    if (transitionVisibility < 0.01) return [];
    const compatible = (!entry.from || !entry.to || entry.from.type === entry.to.type)
      && (entry.from?.points.length ?? entry.to?.points.length) === (entry.to?.points.length ?? entry.from?.points.length);
    // Entering and exiting objects fade at their real size. Collapsing their
    // geometry made minimum-sized props appear, then visibly grow mid-fade.
    const startPoints = entry.from?.points ?? base.points;
    const endPoints = entry.to?.points ?? base.points;
    const points = compatible
      ? startPoints.map((point, index) => point + (endPoints[index] - point) * progress)
      : [...base.points];
    const startDrawing = entry.from ?? base;
    const endDrawing = entry.to ?? base;
    const patternChanged = Boolean(entry.from && entry.to && startDrawing.fillPattern !== endDrawing.fillPattern);
    return [{
      ...base,
      id,
      points,
      color: interpolateColor(startDrawing.color, endDrawing.color, progress) ?? base.color,
      fill: interpolateColor(startDrawing.fill, endDrawing.fill, progress),
      stripeColor: interpolateColor(startDrawing.stripeColor, endDrawing.stripeColor, progress),
      strokeWidth: startDrawing.strokeWidth + (endDrawing.strokeWidth - startDrawing.strokeWidth) * progress,
      opacity: startDrawing.opacity + (endDrawing.opacity - startDrawing.opacity) * progress,
      dashed: progress < 0.5 ? startDrawing.dashed : endDrawing.dashed,
      hidden: false,
      transitionFromFillPattern: patternChanged ? startDrawing.fillPattern : undefined,
      fillPatternTransition: patternChanged ? progress : undefined,
      transitionVisibility,
    }];
  });
}

function sceneFrame(scene: Scene): PlaybackFrame {
  return {
    playerPositions: Object.fromEntries(Object.entries(scene.playerPositions).map(([id, position]) => [id, { ...position }])),
    ball: { ...scene.ball },
    drawings: scene.drawings.map(drawing => ({ ...drawing, points: [...drawing.points] })),
  };
}

export default function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [mode, setMode] = useState<AppMode>(() => modeFromHash());
  const dark = useTacticsStore(s => s.project.settings.theme === 'dark');
  const dockPosition = useTacticsStore(s => s.dockPosition);

  useEffect(() => {
    const syncMode = () => setMode(modeFromHash());
    window.addEventListener('hashchange', syncMode);
    return () => window.removeEventListener('hashchange', syncMode);
  }, []);

  const openMode = useCallback((nextMode: AppMode) => {
    window.location.hash = nextMode === 'home' ? '' : nextMode;
    setMode(nextMode);
  }, []);

  const playScenes = useCallback(async (captureFrame?: () => void, keepFinalFrame = false) => {
    const store = useTacticsStore.getState();
    const scenes = store.project.scenes;
    if (scenes.length < 2) return;
    store.setPlaying(true);
    try {
      store.setPlaybackFrame(sceneFrame(scenes[0]));
      await nextFrame();
      captureFrame?.();
      for (let index = 0; index < scenes.length - 1; index += 1) {
        const from = scenes[index];
        const to = scenes[index + 1];
        const duration = Math.max(0.4, to.duration || from.duration || 2) * 1000;
        const start = performance.now();
        let progress = 0;
        while (progress < 1) {
          progress = Math.min(1, (performance.now() - start) / duration);
          store.setPlaybackFrame(interpolateScene(from, to, progress));
          await nextFrame();
          captureFrame?.();
        }
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    } finally {
      if (keepFinalFrame) store.setPlaying(false);
      else store.clearPlaybackFrame();
    }
  }, []);

  const exportImage = useCallback((type: 'png' | 'jpeg', region: ExportRegion) => {
    if (stageRef.current) void exportStageImage(stageRef.current, type, region);
  }, []);

  const exportVideo = useCallback((region: ExportRegion) => {
    if (!stageRef.current) return;
    void recordStageAnimation(stageRef.current, capture => playScenes(capture, true), 30, region)
      .finally(() => useTacticsStore.getState().clearPlaybackFrame());
  }, [playScenes]);

  return <div className="relative h-screen h-[100dvh] overflow-hidden">
    <div className={mode === 'home' ? 'absolute inset-0' : 'hidden'}>
      <StudioHome onOpenBoard={() => openMode('board')} onOpenVideo={() => openMode('video')} />
    </div>
    <div className={mode === 'video' ? 'absolute inset-0' : 'hidden'}>
      <VideoAnalysisTool active={mode === 'video'} onHome={() => openMode('home')} onOpenBoard={() => openMode('board')} />
    </div>
    <div className={`tactics-shell h-full w-full overflow-hidden ${mode === 'board' ? 'flex' : 'hidden'} ${dockPosition === 'right' ? 'flex-row' : 'flex-col'} ${dark ? 'tactics-dark bg-slate-950 text-slate-100' : 'bg-[#f6f9ff] text-[#0b172a]'}`}>
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <PitchCanvas stageRef={stageRef} onHome={() => openMode('home')} onOpenVideo={() => openMode('video')} />
        {dockPosition === 'hidden' && <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2">
          <DockModeSwitcher />
          <PitchScaleControl />
          <QuickActions />
        </div>}
      </main>
      {dockPosition !== 'hidden' && <ControlDock onExportImage={exportImage} onPreviewAnimation={() => { void playScenes(); }} onExportVideo={exportVideo} />}
    </div>
  </div>;
}
