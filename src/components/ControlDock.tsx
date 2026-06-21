import { useEffect, useState } from 'react';
import { AlertTriangle, BadgeHelp, Circle as CircleIcon, CircleDot, Copy, Download, Eraser, Eye, EyeOff, Film, Frown, ImageDown, ImagePlus, Link2, Minus, MousePointer2, MoveHorizontal, MoveRight, MoveVertical, Palette, PanelBottom, PanelRight, Pencil, Play, Plus, Redo2, RotateCcw, Route, Settings2, Shield, SlidersHorizontal, Square, Trash2, Type, Undo2, Unlink2, UserMinus, UsersRound } from 'lucide-react';
import { formations, FormationKey } from '../data/formations';
import { flagImageUrlByPresetId, presetCollections, PresetCollectionId, teamPresetById, teamPresets, TeamPreset } from '../data/teamPresets';
import { useTacticsStore } from '../store/tacticsStore';
import { BallDesign, BoardFormat, DockTab, ExportRegion, FillPattern, Scene, Tool, ToolStyle } from '../types/domain';

type ControlDockProps = {
  onExportImage: (type: 'png' | 'jpeg', region: ExportRegion) => void;
  onPreviewAnimation: () => void;
  onExportVideo: (region: ExportRegion) => void;
};

const drawingTools = new Set<Tool>(['pass', 'dashed-line', 'long-pass', 'run', 'zone', 'circle-zone', 'text', 'goal-big', 'goal-small', 'cone-small', 'cone-big', 'mannequin', 'mannequin-three']);

function LongPassIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18c5-11 11-11 17-4" /><path d="m17 10 3 4-5 1" /></svg>;
}

function GoalIcon({ size = 16, small = false }: { size?: number; small?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={small ? 'M5 16V9h14v7' : 'M3 18V6h18v12'} /><path d={small ? 'M5 12h14M9 9v7m6-7v7' : 'M3 10h18M8 6v12m8-12v12'} /></svg>;
}

function DiscConeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="13" rx="8" ry="4" /><circle cx="12" cy="13" r="1.8" /></svg>;
}

function TallConeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 4-4 14h8L12 4Z" /><path d="M6 18h12M9.5 12h5" /></svg>;
}

function DashedLineIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h3m3 0h3m3 0h5" /><path d="m17 8 4 4-4 4" /></svg>;
}

function MannequinIcon({ size = 16, group = false }: { size?: number; group?: boolean }) {
  const figure = (x: number, compact = false) => {
    const half = compact ? 2 : 3.2;
    const torsoTop = compact ? 7.3 : 7;
    const torsoBottom = compact ? 13.2 : 13.8;
    return <g key={x}>
      <ellipse cx={x} cy="4.4" rx={compact ? 1.15 : 1.7} ry={compact ? 1.8 : 2.35} />
      <rect x={x - half} y={torsoTop} width={half * 2} height={torsoBottom - torsoTop} rx="0.8" fill="currentColor" fillOpacity="0.2" />
      <path d={`M${x - half * 0.52} ${torsoBottom}L${x - half * 0.62} 20M${x} ${torsoBottom}V20M${x + half * 0.52} ${torsoBottom}L${x + half * 0.62} 20`} />
      <path d={`M${x - half} 21h${half * 2}`} strokeWidth="2.2" />
      {[[-0.42, 0], [0, 0], [0.42, 0], [-0.42, 1], [0, 1], [0.42, 1]].map(([dx, row], index) => <circle key={index} cx={x + half * dx} cy={torsoTop + 1.8 + row * 2.2} r={compact ? 0.22 : 0.3} fill="currentColor" stroke="none" />)}
    </g>;
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{group ? [figure(5, true), figure(12, true), figure(19, true)] : figure(12)}</svg>;
}

const toolSections: { id: string; label: string; tools: { id: Tool; label: string; icon: any }[] }[] = [
  { id: 'selection', label: 'Edit', tools: [{ id: 'select', label: 'Select', icon: MousePointer2 }] },
  { id: 'movement', label: 'Movement', tools: [
    { id: 'pass', label: 'Pass/shot', icon: MoveRight },
    { id: 'dashed-line', label: 'Dashed line', icon: DashedLineIcon },
    { id: 'long-pass', label: 'Long pass', icon: LongPassIcon },
    { id: 'run', label: 'Dribble', icon: Route },
  ] },
  { id: 'areas', label: 'Areas', tools: [
    { id: 'zone', label: 'Rectangle', icon: Square },
    { id: 'circle-zone', label: 'Circle', icon: CircleIcon },
  ] },
  { id: 'equipment', label: 'Equipment', tools: [
    { id: 'goal-big', label: 'Big goal', icon: GoalIcon },
    { id: 'goal-small', label: 'Small goal', icon: (props: { size?: number }) => <GoalIcon {...props} small /> },
    { id: 'cone-small', label: 'Disc cone', icon: DiscConeIcon },
    { id: 'cone-big', label: 'Tall cone', icon: TallConeIcon },
    { id: 'mannequin', label: 'Mannequin', icon: MannequinIcon },
    { id: 'mannequin-three', label: '3 mannequins', icon: (props: { size?: number }) => <MannequinIcon {...props} group /> },
  ] },
  { id: 'notes', label: 'Notes', tools: [{ id: 'text', label: 'Text', icon: Type }] },
];

const tabs: { id: DockTab; label: string; icon: any }[] = [
  { id: 'page', label: 'Pitch', icon: SlidersHorizontal },
  { id: 'style', label: 'Style', icon: Settings2 },
  { id: 'squad', label: 'Squad', icon: UsersRound },
  { id: 'presets', label: 'Preset teams', icon: Shield },
  { id: 'edit', label: 'Player', icon: Pencil },
  { id: 'scenes', label: 'Scenes', icon: Film },
  { id: 'export', label: 'Export', icon: Download },
];

const viewLabels: { id: BoardFormat; label: string }[] = [
  { id: 'portrait', label: 'Portrait' },
  { id: 'landscape', label: 'Landscape' },
];

const ballDesigns: { id: BallDesign; label: string; color: string }[] = [
  { id: 'classic', label: 'Classic', color: '#111827' },
  { id: 'jabulani', label: 'Jabulani 2010', color: '#a855f7' },
  { id: 'brazuca', label: 'Brazil 2014', color: '#22c55e' },
  { id: 'telstar18', label: 'Russia 2018', color: '#334155' },
  { id: 'al-rihla', label: 'Qatar 2022', color: '#ef4444' },
  { id: 'trionda26', label: 'World Cup 2026', color: '#2563eb' },
  { id: 'premier-league', label: 'Premier League', color: '#7c3aed' },
  { id: 'laliga', label: 'La Liga', color: '#f97316' },
];

const gridOptions: { id: 'none' | 'thirds' | 'five-lanes' | 'fifteen' | 'custom'; label: string }[] = [
  { id: 'none', label: 'Off' },
  { id: 'thirds', label: 'Thirds' },
  { id: 'five-lanes', label: 'Five lanes' },
  { id: 'fifteen', label: '15 zones' },
  { id: 'custom', label: 'Custom' },
];

function exportRegionsFor(format: BoardFormat): { id: ExportRegion; label: string }[] {
  return format === 'portrait'
    ? [{ id: 'full', label: 'Full' }, { id: 'top', label: 'Top half' }, { id: 'bottom', label: 'Bottom half' }]
    : [{ id: 'full', label: 'Full' }, { id: 'left', label: 'Left half' }, { id: 'right', label: 'Right half' }];
}

const nextAnimationFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const easeInOut = (progress: number) => progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
type TacticsState = ReturnType<typeof useTacticsStore.getState>;

function flagBackground(preset: TeamPreset) {
  const direction = preset.flagDirection === 'vertical' ? '90deg' : '180deg';
  const step = 100 / preset.flagBands.length;
  const stops = preset.flagBands.flatMap((color, index) => [`${color} ${index * step}%`, `${color} ${(index + 1) * step}%`]).join(', ');
  return `linear-gradient(${direction}, ${stops})`;
}

function FlagNumberChip({ flagId, badgeImage, showFlag = true, color, number, showNumber = true, size = 'md' }: { flagId?: string; badgeImage?: string; showFlag?: boolean; color: string; number: number; showNumber?: boolean; size?: 'sm' | 'md' }) {
  const preset = flagId ? teamPresetById[flagId] : undefined;
  const visibleFlag = showFlag ? preset : undefined;
  const hasBadge = Boolean(badgeImage || visibleFlag);
  const dimension = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-[11px]';
  return <span className={`relative shrink-0 overflow-hidden rounded-full font-black text-[#07111f] ring-1 ring-white/80 ${dimension}`} style={{ background: visibleFlag ? flagBackground(visibleFlag) : color }}>
    {visibleFlag && <img src={flagImageUrlByPresetId[visibleFlag.id]} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" draggable={false} onError={event => { event.currentTarget.style.display = 'none'; }} />}
    {badgeImage && <img src={badgeImage} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
    {hasBadge && <span className="absolute inset-0 bg-white/10" />}
    {showNumber && <span className={`absolute inset-0 z-10 grid place-items-center leading-none ${hasBadge ? 'drop-shadow-[0_1px_2px_rgba(255,255,255,.95)]' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]'}`}>{number}</span>}
  </span>;
}

async function animateTeamChange(teamId: string, applyChange: (store: TacticsState, teamId: string, entryX: number) => void) {
  const store = useTacticsStore.getState();
  if (store.playing) return;
  const project = store.project;
  const teamIndex = project.teams.findIndex(team => team.id === teamId);
  const team = project.teams[teamIndex];
  if (!team) return;

  store.setPlaying(true);
  try {
    const exitX = teamIndex === 1 ? 1.16 : -0.16;
    const currentPositions = Object.fromEntries(project.teams.flatMap(t => t.squad).map(player => [player.id, { x: player.x, y: player.y }]));
    const exitingPlayers = team.squad.filter(player => player.starter && !player.hidden);

    for (let index = 0; index <= 48; index += 1) {
      const progress = easeInOut(index / 48);
      const playerPositions = { ...currentPositions };
      exitingPlayers.forEach(player => {
        playerPositions[player.id] = {
          x: player.x + (exitX - player.x) * progress,
          y: player.y + (0.5 - player.y) * progress * 0.18,
        };
      });
      store.setPlaybackFrame({
        playerPositions,
        ball: project.ball,
        drawings: progress < 0.48 ? project.drawings : [],
      });
      await nextAnimationFrame();
    }

    store.clearDrawings();
    const entryX = teamIndex === 1 ? 1.16 : -0.16;
    applyChange(useTacticsStore.getState(), teamId, entryX);
    const nextProject = useTacticsStore.getState().project;
    const nextTeamIndex = nextProject.teams.findIndex(nextTeam => nextTeam.id === teamId);
    const nextTeam = nextProject.teams[nextTeamIndex];
    if (!nextTeam) return;
    const finalPositions = Object.fromEntries(nextProject.teams.flatMap(t => t.squad).map(player => [player.id, { x: player.x, y: player.y }]));
    const incomingPlayers = nextTeam.squad.filter(player => player.starter && !player.hidden);
    await nextAnimationFrame();

    for (let index = 0; index <= 54; index += 1) {
      const progress = easeInOut(index / 54);
      const playerPositions = { ...finalPositions };
      incomingPlayers.forEach(player => {
        playerPositions[player.id] = {
          x: entryX + (player.x - entryX) * progress,
          y: player.y,
        };
      });
      store.setPlaybackFrame({
        playerPositions,
        ball: nextProject.ball,
        drawings: [],
      });
      await nextAnimationFrame();
    }
  } finally {
    useTacticsStore.getState().clearPlaybackFrame();
  }
}

async function animateTeamPreset(teamId: string, presetId: string) {
  await animateTeamChange(teamId, (store, id, entryX) => store.applyTeamPreset(id, presetId, entryX));
}

async function animateBaseplate(teamId: string) {
  await animateTeamChange(teamId, (store, id, entryX) => store.applyBaseplate(id, entryX));
}

function Field({ label, value, onChange, type = 'text', min, max, step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; min?: string; max?: string; step?: string }) {
  return <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
    <span>{label}</span>
    <input className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case tracking-normal text-[#0b172a] outline-none focus:border-[#2563eb]" type={type} min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value)} />
  </label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="dock-field space-y-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
    <span>{label}</span>
    <span className="flex h-9 items-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 p-1 pr-2 normal-case tracking-normal text-[#0b172a]">
      <input aria-label={label} className="dock-color-input h-7 w-10 shrink-0 cursor-pointer outline-none" type="color" value={value} onChange={e => onChange(e.target.value)} />
      <span className="min-w-0 truncate font-mono text-[10px] font-bold uppercase">{value}</span>
    </span>
  </label>;
}

function readBadgeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Image processing is unavailable'));
        return;
      }
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/webp', 0.86));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    image.src = url;
  });
}

function panelClass(extra = '', dark = false) {
  return `dock-panel rounded-xl border p-2.5 ${dark ? 'border-slate-700 bg-slate-900/78' : 'border-[#d7e5f6] bg-white/76'} ${extra}`;
}

function ToolRail({ vertical = false, compact = false }: { vertical?: boolean; compact?: boolean }) {
  const { project, tool, setTool } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const sectionClass = dark ? 'border-slate-700 bg-slate-900/80' : 'border-[#d7e5f6] bg-white/80';
  const idleToolClass = dark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-white/90 text-[#0b172a] hover:bg-[#eff6ff]';
  return <div className={vertical ? 'grid gap-2' : `flex min-w-max items-stretch ${compact ? 'gap-1' : 'gap-2'}`}>
    {toolSections.map(section => <section key={section.id} className={`${vertical ? 'grid grid-cols-2 gap-1' : 'flex items-center gap-1'} ${compact ? 'rounded-lg border-0 bg-transparent p-0' : 'rounded-xl border p-1'} ${compact ? '' : sectionClass}`}>
      <span className={`${vertical ? 'col-span-2 px-2 pt-1' : compact ? 'px-1' : 'px-1'} text-[8px] font-black uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{section.label}</span>
      {section.tools.map(({ id, label, icon: Icon }) => <button key={id} title={label} onClick={() => setTool(id)} className={`flex ${compact ? 'h-7 px-1.5 text-[9px]' : 'h-8 px-2 text-[10px]'} items-center gap-1.5 rounded-lg font-black transition ${tool === id ? 'bg-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,.22)]' : idleToolClass}`}>
        <Icon size={15} />
        <span>{label}</span>
      </button>)}
      {!vertical && compact && <span className={`mx-0.5 h-5 w-px ${dark ? 'bg-slate-700' : 'bg-[#d7e5f6]'}`} />}
    </section>)}
  </div>;
}

export function QuickActions({ embedded = false }: { embedded?: boolean } = {}) {
  const { project, selectedIds, historyPast, historyFuture, undoLastDrawing, redoLastDrawing, duplicateSelectedDrawings, removeSelectedDrawings, clearDrawings } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const selectedCount = project.drawings.filter(drawing => selectedIds.includes(drawing.id)).length;
  const buttonClass = dark ? 'border-slate-700 bg-slate-950/90 text-slate-100 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/92 text-[#0b172a] hover:border-[#2563eb]';
  const shellClass = embedded
    ? 'border-transparent bg-transparent p-0 shadow-none'
    : dark ? 'border-slate-700 bg-slate-950/90 p-1.5 shadow-[0_16px_38px_rgba(11,23,42,.16)]' : 'border-[#d7e5f6] bg-white/90 p-1.5 shadow-[0_16px_38px_rgba(11,23,42,.16)]';
  const sizeClass = embedded ? 'h-8 w-8' : 'h-9 w-9';
  return <div className={`pointer-events-auto flex items-center gap-1 rounded-xl border backdrop-blur ${shellClass}`}>
    <button aria-label="Undo last change" title="Undo last change" onClick={undoLastDrawing} disabled={!historyPast.length} className={`grid ${sizeClass} place-items-center rounded-lg border disabled:opacity-35 ${buttonClass}`}><Undo2 size={16} /></button>
    <button aria-label="Redo last change" title="Redo last change" onClick={redoLastDrawing} disabled={!historyFuture.length} className={`grid ${sizeClass} place-items-center rounded-lg border disabled:opacity-35 ${buttonClass}`}><Redo2 size={16} /></button>
    <button aria-label="Duplicate selected drawings" title="Duplicate selected" onClick={duplicateSelectedDrawings} disabled={!selectedCount} className={`relative grid ${sizeClass} place-items-center rounded-lg border disabled:opacity-35 ${buttonClass}`}><Copy size={16} />{selectedCount > 1 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] font-black text-white">{selectedCount}</span>}</button>
    <button aria-label="Trash selected drawings" title="Trash selected" onClick={removeSelectedDrawings} disabled={!selectedCount} className={`grid ${sizeClass} place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 disabled:opacity-35`}><Trash2 size={16} /></button>
    <button aria-label="Clear all drawings" title="Clear all drawings" onClick={clearDrawings} disabled={!project.drawings.length} className={`grid ${sizeClass} place-items-center rounded-lg bg-red-600 text-white disabled:opacity-35`}><Eraser size={16} /></button>
  </div>;
}

export function PitchScaleControl({ embedded = false }: { embedded?: boolean } = {}) {
  const { project, viewZoom, setViewZoom } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const setZoom = (zoom: number) => setViewZoom(Math.max(0.35, Math.min(1.35, zoom)));
  const shellClass = dark ? 'border-slate-700 bg-slate-950/90 text-slate-100' : 'border-[#d7e5f6] bg-white/90 text-[#0b172a]';
  const buttonClass = dark ? 'hover:bg-slate-800' : 'hover:bg-[#eff6ff]';
  return <div className={`pointer-events-auto flex ${embedded ? 'h-8 border-transparent bg-transparent px-0 shadow-none' : 'h-10 px-1.5 shadow-[0_12px_30px_rgba(11,23,42,.12)]'} items-center gap-1 rounded-xl border backdrop-blur ${embedded ? '' : shellClass}`}>
    <button aria-label="Zoom pitch out" title="Zoom pitch out" onClick={() => setZoom(viewZoom - 0.05)} className={`grid h-7 w-7 place-items-center rounded-lg ${buttonClass}`}><Minus size={14} /></button>
    <label className="flex items-center gap-2" title="Pitch scale">
      <SlidersHorizontal size={14} className="text-[#2563eb]" />
      <input aria-label="Pitch scale" type="range" min="0.35" max="1.35" step="0.01" value={viewZoom} onChange={event => setZoom(Number(event.target.value))} className={`${embedded ? 'w-16 xl:w-24' : 'w-20 sm:w-28'} accent-[#2563eb]`} />
      <span className="w-9 text-right text-[10px] font-black">{Math.round(viewZoom * 100)}%</span>
    </label>
    <button aria-label="Zoom pitch in" title="Zoom pitch in" onClick={() => setZoom(viewZoom + 0.05)} className={`grid h-7 w-7 place-items-center rounded-lg ${buttonClass}`}><Plus size={14} /></button>
  </div>;
}

export function DockModeSwitcher({ embedded = false }: { embedded?: boolean } = {}) {
  const { project, dockPosition, setDockPosition } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const modes = [
    { id: 'bottom' as const, label: 'Bottom menu', icon: PanelBottom },
    { id: 'right' as const, label: 'Side menu', icon: PanelRight },
    { id: 'hidden' as const, label: 'Hide menu', icon: EyeOff },
  ];
  return <div className={`pointer-events-auto flex items-center gap-1 rounded-xl border ${embedded ? 'border-transparent bg-transparent p-0 shadow-none' : `p-1 shadow-[0_12px_30px_rgba(11,23,42,.12)] ${dark ? 'border-slate-700 bg-slate-950/90' : 'border-[#d7e5f6] bg-white/90'}`} backdrop-blur`}>
    {modes.map(({ id, label, icon: Icon }) => <button key={id} aria-label={label} aria-pressed={dockPosition === id} title={label} onClick={() => setDockPosition(id)} className={`grid h-8 w-8 place-items-center rounded-lg transition ${dockPosition === id ? 'bg-[#2563eb] text-white' : dark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-[#eff6ff]'}`}><Icon size={15} /></button>)}
  </div>;
}

function WorkspaceTabs({ side = false }: { side?: boolean }) {
  const { dockTab: tab, setDockTab: setTab, project } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  return <nav aria-label="Workspace" className={side ? 'grid w-full grid-cols-3 gap-1.5' : 'flex min-w-max items-center gap-1'}>
    {tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={`flex h-8 items-center justify-center gap-1.5 px-2.5 ${side ? '' : 'whitespace-nowrap'} ${tab === id ? 'bg-[#2563eb] text-white shadow-[0_8px_18px_rgba(37,99,235,.2)]' : dark ? 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500' : 'border border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#93c5fd] hover:bg-[#eff6ff]'}`}>
      <Icon size={14} />
      <span>{label}</span>
    </button>)}
  </nav>;
}

function PagePanel() {
  const { project, viewZoom, setViewZoom, setBoardFormat, updateSettings, updateBall, resetElevenAside } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const pitchScaleX = project.settings.pitchScaleX ?? 1;
  const pitchScaleY = project.settings.pitchScaleY ?? 1;
  const resetBoard = () => {
    resetElevenAside();
    setViewZoom(1.08);
  };
  return <div className="dock-page-grid grid gap-2 lg:grid-cols-2 xl:grid-cols-[.85fr_1.05fr_1.15fr_1.1fr]">
    <section className={panelClass('space-y-2', dark)}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Views</p>
      <div className="grid grid-cols-2 gap-2">
        {viewLabels.map(({ id, label }) => <button key={id} onClick={() => setBoardFormat(id)} className={`rounded-lg border px-3 py-2 text-xs font-black ${project.settings.format === id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb]'}`}>{label}</button>)}
      </div>
    </section>
    <section className={panelClass('space-y-2', dark)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Pitch scale</p>
        <span className="flex items-center gap-1 text-xs font-black text-[#0b172a]"><SlidersHorizontal size={14} /> {Math.round(viewZoom * 100)}%</span>
      </div>
      <input type="range" min="0.35" max="1.35" step="0.01" value={viewZoom} onChange={e => setViewZoom(Number(e.target.value))} className="w-full accent-[#2563eb]" />
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Grass" value={project.settings.grassColor} onChange={v => updateSettings({ grassColor: v })} />
        <ColorField label="Lines" value={project.settings.lineColor} onChange={v => updateSettings({ lineColor: v })} />
      </div>
    </section>
    <section className={panelClass('space-y-2', dark)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Grid</p>
        <div className="flex items-center gap-1">
          <button title="Pep zones" onClick={() => updateSettings({ pepZones: !project.settings.pepZones })} className={`h-8 rounded-lg border px-2 text-[10px] font-black ${project.settings.pepZones ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb]'}`}>Zones</button>
          <button title="Restore both teams to the default 11 circle markers" onClick={resetBoard} className="flex h-8 items-center gap-1 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-[10px] font-black text-[#0b172a] hover:border-[#2563eb]">
            <RotateCcw size={12} /> Reset 11
          </button>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(5,minmax(4.75rem,1fr))] gap-1.5 overflow-x-auto pb-1">
        {gridOptions.map(option => <button key={option.id} onClick={() => updateSettings({ grid: option.id })} className={`h-8 whitespace-nowrap rounded-lg border px-2 text-[10px] font-black leading-none transition ${project.settings.grid === option.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb]'}`}>
          {option.label}
        </button>)}
      </div>
      <div className="grid gap-1.5">
        <label className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/70 px-2 py-1">
          <MoveHorizontal size={14} className="text-[#2563eb]" />
          <input type="range" min="0.5" max="1.24" step="0.01" value={pitchScaleX} onChange={event => updateSettings({ pitchScaleX: Number(event.target.value) })} className="w-full accent-[#2563eb]" />
          <span className="w-9 text-right text-[10px] font-black text-[#0b172a]">{Math.round(pitchScaleX * 100)}%</span>
        </label>
        <label className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/70 px-2 py-1">
          <MoveVertical size={14} className="text-[#2563eb]" />
          <input type="range" min="0.5" max="1.24" step="0.01" value={pitchScaleY} onChange={event => updateSettings({ pitchScaleY: Number(event.target.value) })} className="w-full accent-[#2563eb]" />
          <span className="w-9 text-right text-[10px] font-black text-[#0b172a]">{Math.round(pitchScaleY * 100)}%</span>
        </label>
      </div>
    </section>
    <section className={panelClass('space-y-2', dark)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Ball design</p>
        <CircleDot size={16} className="text-[#2563eb]" />
      </div>
      <select className="h-11 w-full rounded-lg border border-[#d7e5f6] bg-white/90 px-3 text-sm font-black text-[#0b172a] outline-none focus:border-[#2563eb]" value={project.ball.design} onChange={event => updateBall({ design: event.target.value as BallDesign })}>
        {ballDesigns.map(design => <option key={design.id} value={design.id}>{design.label}</option>)}
      </select>
      <ColorField label="Player selection ring" value={project.settings.selectionColor ?? '#facc15'} onChange={selectionColor => updateSettings({ selectionColor })} />
    </section>
  </div>;
}

function SquadPanel() {
  const { project, selectedId, select, updateTeam, addPlayer, applyFormation, setTeamPlayerCount } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  return <div className="space-y-3">
    <div className="dock-team-grid grid gap-3 lg:grid-cols-2">
      {project.teams.map(team => {
        const onFieldCount = team.squad.filter(player => player.starter && !player.hidden).length;
        const starters = team.squad.filter(player => player.starter && !player.hidden);
        const bench = team.squad.filter(player => !player.starter || player.hidden);
        const playerChip = (player: (typeof team.squad)[number]) => {
          const label = player.displayName.trim();
          return <button key={player.id} onClick={() => select(player.id)} className={`flex min-w-24 items-center gap-2 rounded-lg border px-2 py-1.5 text-left ${player.starter && !player.hidden ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#d7e5f6] bg-white/80'} ${selectedId === player.id ? 'ring-2 ring-[#2563eb]' : ''}`}>
            <FlagNumberChip flagId={player.flag} badgeImage={team.badge} showFlag={team.showBadge ?? true} color={player.color} number={player.number} showNumber={(team.showNumbers ?? true) && (player.showNumber ?? true)} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-[#0b172a]">{label || `#${player.number}`}</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{player.starter && !player.hidden ? 'Pitch' : 'Bench'}</span>
            </span>
          </button>;
        };
        return <section key={team.id} className={panelClass('space-y-2', dark)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-8 w-8 rounded-lg border border-[#d7e5f6]" style={{ background: `linear-gradient(135deg, ${team.primaryColor} 0 52%, ${team.goalkeeperColor} 52% 100%)` }} />
          <input className="min-w-28 flex-1 bg-transparent text-sm font-black text-[#0b172a] outline-none" value={team.name} onChange={e => updateTeam(team.id, { name: e.target.value })} />
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-[10px] font-black uppercase text-slate-500">
            On pitch
            <input type="number" min="1" max="30" value={onFieldCount} onChange={event => setTeamPlayerCount(team.id, Number(event.target.value))} className="h-7 w-11 rounded-md border border-[#bfdbfe] bg-white px-1 text-center text-xs font-black text-[#0b172a]" />
          </label>
          {onFieldCount === 11
            ? <select className="h-9 w-28 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold text-[#0b172a] sm:w-32" value={team.formation} onChange={e => applyFormation(team.id, e.target.value as FormationKey)}>
              {Object.keys(formations).map(f => <option key={f}>{f}</option>)}
            </select>
            : <span className="flex h-9 items-center rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#1d4ed8]">Custom {onFieldCount}-a-side</span>}
          <button onClick={() => addPlayer(team.id)} className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#2563eb] px-3 text-xs font-black text-white"><Plus size={15} /> Add player</button>
          <input className="w-12 bg-transparent text-right text-xs font-black uppercase text-slate-500 outline-none" value={team.shortName} onChange={e => updateTeam(team.id, { shortName: e.target.value })} />
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-[10px] font-black uppercase text-slate-500">Outfield <input className="h-7 w-8 border-0 p-0" type="color" value={team.primaryColor} onChange={e => updateTeam(team.id, { primaryColor: e.target.value })} /></label>
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-[10px] font-black uppercase text-slate-500">GK <input className="h-7 w-8 border-0 p-0" type="color" value={team.goalkeeperColor} onChange={e => updateTeam(team.id, { goalkeeperColor: e.target.value })} /></label>
          <button onClick={() => updateTeam(team.id, { showNumbers: !(team.showNumbers ?? true) })} className={`h-9 rounded-lg border px-2 text-[10px] font-black uppercase ${team.showNumbers ?? true ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>Numbers {team.showNumbers ?? true ? 'on' : 'off'}</button>
          <button onClick={() => updateTeam(team.id, { showNames: !(team.showNames ?? true) })} className={`h-9 rounded-lg border px-2 text-[10px] font-black uppercase ${team.showNames ?? true ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>Names {team.showNames ?? true ? 'on' : 'off'}</button>
          <label title="Upload one badge for every player in this team" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[#d7e5f6] bg-white/80 text-[#2563eb] hover:border-[#2563eb]">
            <ImagePlus size={15} />
            <input type="file" accept="image/*" className="hidden" onChange={event => {
              const file = event.target.files?.[0];
              event.currentTarget.value = '';
              if (file) void readBadgeImage(file).then(badge => updateTeam(team.id, { badge, showBadge: true }));
            }} />
          </label>
          {team.badge && <button title="Remove team badge" onClick={() => updateTeam(team.id, { badge: undefined })} className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100"><Trash2 size={14} /></button>}
        </div>
        <div className="grid gap-2">
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#2563eb]">On pitch · {starters.length}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">{starters.map(playerChip)}</div>
          </div>
          <div className="rounded-lg border border-[#d7e5f6] bg-white/50 p-1.5">
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Bench · {bench.length}</p>
            {bench.length > 0
              ? <div className="flex gap-2 overflow-x-auto pb-1">{bench.map(playerChip)}</div>
              : <p className="px-1 py-1 text-[10px] font-semibold text-slate-500">No substitutes yet. Add a player to create the bench.</p>}
          </div>
        </div>
      </section>})}
    </div>
  </div>;
}

function PresetTeamsPanel() {
  const { project, playing, updateTeam } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const [teamId, setTeamId] = useState(project.teams[0]?.id ?? '');
  const [collectionId, setCollectionId] = useState<PresetCollectionId | undefined>();
  const selectedTeamId = project.teams.some(team => team.id === teamId) ? teamId : project.teams[0]?.id;
  const selectedTeam = project.teams.find(team => team.id === selectedTeamId);
  const visiblePresets = collectionId === 'world-cup-2026' ? teamPresets : [];

  const applyOfflinePreset = async (preset: TeamPreset) => {
    if (!selectedTeamId || playing) return;
    await animateTeamPreset(selectedTeamId, preset.id);
  };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {presetCollections.map(collection => <button key={collection.id} onClick={() => setCollectionId(collection.id)} className={`rounded-lg border px-3 py-1.5 text-xs font-black ${collectionId === collection.id ? 'border-[#0b172a] bg-[#0b172a] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>
        {collection.label}
      </button>)}
      <span className="hidden h-6 w-px bg-[#d7e5f6] sm:block" />
      {project.teams.map((team, index) => <button key={team.id} onClick={() => setTeamId(team.id)} className={`rounded-lg border px-3 py-2 text-xs font-black ${selectedTeamId === team.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>
        Team {index + 1}
      </button>)}
      <button disabled={playing || !selectedTeamId} onClick={() => selectedTeamId && void animateBaseplate(selectedTeamId)} className="rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-xs font-black text-[#0b172a] transition hover:border-[#2563eb] disabled:opacity-45">
        Baseplate
      </button>
      <button disabled={!selectedTeamId} onClick={() => selectedTeamId && updateTeam(selectedTeamId, { showBadge: !(selectedTeam?.showBadge ?? true) })} className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-black ${selectedTeam?.showBadge ?? true ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>
        <Shield size={14} /> Team badges {selectedTeam?.showBadge ?? true ? 'on' : 'off'}
      </button>
    </div>
    {!collectionId && <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/60 px-3 py-4 text-sm font-semibold text-slate-500">Choose a preset pack to show teams.</div>}
    {collectionId && visiblePresets.length === 0 && <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/60 px-3 py-4 text-sm font-semibold text-slate-500">This preset pack is ready in the menu structure; teams can be loaded into it next.</div>}
    {collectionId === 'world-cup-2026' && <p className="rounded-lg border border-[#d7e5f6] bg-white/70 px-3 py-2 text-xs font-bold text-slate-600">Preset starting 11s are based on the first World Cup games.</p>}
    <div className="dock-preset-grid grid max-h-44 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-10">
      {visiblePresets.map(preset => <button key={preset.id} disabled={playing || !selectedTeamId} onClick={() => void applyOfflinePreset(preset)} title={`Load ${preset.name}`} className="group relative min-h-20 overflow-hidden rounded-lg border border-[#d7e5f6] bg-white/80 text-left shadow-[0_10px_24px_rgba(37,99,235,.08)] transition hover:-translate-y-0.5 hover:border-[#2563eb] disabled:opacity-45">
        <span className="absolute inset-0" style={{ background: flagBackground(preset) }} />
        <img src={flagImageUrlByPresetId[preset.id]} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" draggable={false} onError={event => { event.currentTarget.style.display = 'none'; }} />
        <span className={`absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-md border px-2 py-1 text-left text-[10px] font-black uppercase tracking-[0.06em] shadow-[0_4px_12px_rgba(11,23,42,.12)] backdrop-blur-[2px] transition ${dark ? 'border-slate-600 bg-slate-900/90 text-slate-100 group-hover:bg-slate-900' : 'border-white/60 bg-white/92 text-[#0b172a] group-hover:bg-white'}`}>{preset.name}</span>
      </button>)}
    </div>
  </div>;
}

function PlayerEditPanel() {
  const { project, selectedId, updatePlayer, setPlayerStarter, removePlayer, duplicatePlayer, checkpointHistory } = useTacticsStore();
  const selectedPlayer = project.teams.flatMap(t => t.squad).find(p => p.id === selectedId);
  const dark = project.settings.theme === 'dark';
  return <div className="w-full">
    <section className={panelClass('space-y-2', dark)}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Selected player</p>
      {selectedPlayer ? <div className="dock-edit-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.2fr_.55fr_.8fr_.7fr_.7fr_.8fr_auto_auto_auto_auto]">
        <Field label="Name" value={selectedPlayer.displayName} onChange={v => updatePlayer(selectedPlayer.id, { displayName: v.toUpperCase() })} />
        <Field label="Number" type="number" value={selectedPlayer.number} onChange={v => {
          const number = Number(v);
          if (Number.isFinite(number)) updatePlayer(selectedPlayer.id, { number });
        }} />
        <Field label={`Icon size ${Math.round((selectedPlayer.size ?? 1) * 100)}%`} type="range" min="0.65" max="1.65" step="0.05" value={selectedPlayer.size ?? 1} onChange={v => updatePlayer(selectedPlayer.id, { size: Number(v) })} />
        <ColorField label="Fill" value={selectedPlayer.color} onChange={v => updatePlayer(selectedPlayer.id, { color: v })} />
        <ColorField label="Outline" value={selectedPlayer.outline} onChange={v => updatePlayer(selectedPlayer.id, { outline: v })} />
        <ColorField label="Name background" value={selectedPlayer.nameBackground ?? '#ffffff'} onChange={v => updatePlayer(selectedPlayer.id, { nameBackground: v })} />
        <button onClick={() => updatePlayer(selectedPlayer.id, { showNumber: !(selectedPlayer.showNumber ?? true) })} className={`self-end rounded-lg border px-3 py-2 text-sm font-black ${selectedPlayer.showNumber ?? true ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>Number {selectedPlayer.showNumber ?? true ? 'on' : 'off'}</button>
        <button onClick={() => { checkpointHistory(); setPlayerStarter(selectedPlayer.id, !selectedPlayer.starter); }} className="self-end rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-sm font-black text-[#0b172a] hover:border-[#2563eb]">{selectedPlayer.starter ? 'Move to bench' : 'Send to pitch'}</button>
        <button onClick={() => duplicatePlayer(selectedPlayer.id)} className="self-end rounded-lg border border-[#d7e5f6] bg-white/80 px-3 py-2 text-sm font-black text-[#0b172a] hover:border-[#2563eb]"><Copy size={15} /></button>
        <button onClick={() => removePlayer(selectedPlayer.id)} className="flex items-center justify-center gap-2 self-end rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-600 ring-1 ring-red-100"><UserMinus size={15} /> Delete player</button>
      </div> : <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/60 px-3 py-6 text-sm font-semibold text-slate-500">Select a player chip or marker.</div>}
    </section>
  </div>;
}

function StylePanel() {
  const { project, selectedId, selectedIds, tool, toolStyle, setToolStyle, updateSettings, updatePlayer, updateDrawing, addDrawing, dockPosition } = useTacticsStore();
  const selectedDrawing = project.drawings.find(d => d.id === selectedId);
  const selectedDrawings = project.drawings.filter(drawing => selectedIds.includes(drawing.id));
  const selectedPlayers = project.teams.flatMap(team => team.squad).filter(player => player.starter && selectedIds.includes(player.id));
  const dark = project.settings.theme === 'dark';
  const activeDrawingTool = drawingTools.has(tool);
  const linkedAreaFollows = selectedDrawing?.type === 'polygon-zone'
    ? selectedDrawing.followPlayers !== false
    : project.settings.linkedAreasFollowPlayers ?? true;
  const commitStyle = (patch: Partial<ToolStyle>) => {
    setToolStyle(patch);
    selectedDrawings.forEach(drawing => updateDrawing(drawing.id, patch));
  };
  const updateColor = (key: 'color' | 'fill' | 'stripeColor', value: string) => {
    commitStyle({ [key]: value });
  };
  const updateNumber = (key: 'strokeWidth' | 'opacity', value: number) => {
    commitStyle({ [key]: value });
  };
  const applyTeamStyle = (teamIndex: number) => {
    const team = project.teams[teamIndex];
    if (!team) return;
    commitStyle({ color: team.primaryColor, fill: team.primaryColor, stripeColor: team.secondaryColor || '#ffffff' });
  };
  const createLinkedZone = () => {
    if (selectedPlayers.length < 3) return;
    const center = selectedPlayers.reduce((sum, player) => ({ x: sum.x + player.x, y: sum.y + player.y }), { x: 0, y: 0 });
    center.x /= selectedPlayers.length;
    center.y /= selectedPlayers.length;
    const ordered = selectedPlayers
      .slice()
      .sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
    addDrawing({
      id: crypto.randomUUID(),
      type: 'polygon-zone',
      points: ordered.flatMap(player => [player.x, player.y]),
      color: toolStyle.color,
      fill: toolStyle.fill,
      stripeColor: toolStyle.stripeColor,
      strokeWidth: Math.max(2, toolStyle.strokeWidth),
      opacity: Math.max(0.16, toolStyle.opacity),
      dashed: false,
      locked: false,
      hidden: false,
      zIndex: 12,
      linkedPlayerIds: ordered.map(player => player.id),
      followPlayers: linkedAreaFollows,
      fillPattern: toolStyle.fillPattern,
    });
  };
  const pattern = selectedDrawing?.fillPattern ?? toolStyle.fillPattern;
  const stripePatternOptions: { id: FillPattern; label: string }[] = [
    { id: 'none', label: 'Plain' },
    { id: 'diagonal', label: 'Diagonal' },
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'vertical', label: 'Vertical' },
  ];
  const symbolPatternOptions: { id: FillPattern; label: string; icon: typeof AlertTriangle }[] = [
    { id: 'hazard', label: 'Warning', icon: AlertTriangle },
    { id: 'question', label: 'Question', icon: BadgeHelp },
    { id: 'sad-face', label: 'Sad face', icon: Frown },
  ];
  const isGoal = selectedDrawing?.type === 'goal-big' || selectedDrawing?.type === 'goal-small' || tool === 'goal-big' || tool === 'goal-small';
  const isMannequin = selectedDrawing?.type === 'mannequin' || selectedDrawing?.type === 'mannequin-three' || tool === 'mannequin' || tool === 'mannequin-three';
  const isRotatableProp = isGoal || isMannequin;
  const isArea = selectedDrawing?.type === 'zone' || selectedDrawing?.type === 'circle-zone' || selectedDrawing?.type === 'polygon-zone' || tool === 'zone' || tool === 'circle-zone';
  return <div className={`dock-panel-grid grid gap-2 ${dockPosition === 'right' ? 'grid-cols-1' : 'lg:grid-cols-[1.05fr_1.2fr_1fr_1fr]'}`}>
    <section className={panelClass('space-y-2', dark)}>
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-[#2563eb]" />
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2563eb]">Match colour</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1].map(index => {
          const team = project.teams[index];
          return <button key={index} disabled={!team || (!activeDrawingTool && !selectedDrawing)} onClick={() => applyTeamStyle(index)} className="min-h-10 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-xs font-black text-[#0b172a] disabled:opacity-40" style={team ? { borderColor: team.primaryColor } : undefined}>
            <span className="mx-auto mb-1 block h-2 w-9 rounded-full" style={{ background: team?.primaryColor ?? '#94a3b8' }} />
            Team {index + 1}
          </button>;
        })}
        <button disabled={!activeDrawingTool && !selectedDrawing} onClick={() => commitStyle({ color: toolStyle.color, fill: toolStyle.fill, stripeColor: toolStyle.stripeColor })} className="min-h-10 rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-xs font-black text-[#0b172a] disabled:opacity-40">
          <span className="mx-auto mb-1 block h-2 w-9 rounded-full" style={{ background: `linear-gradient(90deg, ${toolStyle.color}, ${toolStyle.fill})` }} />
          Custom
        </button>
      </div>
      <button onClick={createLinkedZone} disabled={selectedPlayers.length < 3} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 px-3 text-xs font-black text-[#0b172a] disabled:opacity-40">
        <Square size={14} />
        Connect {selectedPlayers.length || 0} players
      </button>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#eff6ff] p-1 ring-1 ring-[#d7e5f6]">
        <button onClick={() => {
          updateSettings({ linkedAreasFollowPlayers: true });
          if (selectedDrawing?.type === 'polygon-zone') updateDrawing(selectedDrawing.id, { followPlayers: true });
        }} className={`flex h-8 items-center justify-center gap-1 rounded-md text-[10px] font-black ${linkedAreaFollows ? 'bg-[#2563eb] text-white' : 'text-[#0b172a]'}`}><Link2 size={12} /> Follow</button>
        <button onClick={() => {
          updateSettings({ linkedAreasFollowPlayers: false });
          if (selectedDrawing?.type === 'polygon-zone') updateDrawing(selectedDrawing.id, { followPlayers: false });
        }} className={`flex h-8 items-center justify-center gap-1 rounded-md text-[10px] font-black ${!linkedAreaFollows ? 'bg-[#0b172a] text-white' : 'text-[#0b172a]'}`}><Unlink2 size={12} /> Stay fixed</button>
      </div>
    </section>
    <section className={panelClass('dock-color-grid grid grid-cols-2 gap-2 sm:grid-cols-4', dark)}>
      <ColorField label="Line" value={selectedDrawing?.color ?? toolStyle.color} onChange={v => updateColor('color', v)} />
      <ColorField label="Inside" value={selectedDrawing?.fill ?? toolStyle.fill} onChange={v => updateColor('fill', v)} />
      <ColorField label="Border" value={selectedDrawing?.stripeColor ?? toolStyle.stripeColor} onChange={v => updateColor('stripeColor', v)} />
      <Field label="Opacity" type="range" min="0.08" max="1" step="0.04" value={selectedDrawing?.opacity ?? toolStyle.opacity} onChange={v => updateNumber('opacity', Number(v))} />
    </section>
    <section className={panelClass('space-y-2', dark)}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Area contents</p>
      {isArea ? <div className="grid gap-2">
        <div className="grid grid-cols-4 gap-1">
          {stripePatternOptions.map(option => <button key={option.id} onClick={() => commitStyle({ fillPattern: option.id })} className={`h-8 rounded-lg border px-1 text-[9px] font-black transition ${pattern === option.id ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-[0_6px_14px_rgba(37,99,235,.16)]' : dark ? 'border-slate-600 bg-slate-800 text-slate-100 hover:border-[#60a5fa]' : 'border-[#bfdbfe] bg-white/90 text-[#0b172a] hover:border-[#2563eb]'}`}>{option.label}</button>)}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Symbols</p>
          <div className="grid grid-cols-3 gap-1">
            {symbolPatternOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => commitStyle({ fillPattern: id })} className={`flex h-8 items-center justify-center gap-1 rounded-lg border px-1 text-[9px] font-black transition ${pattern === id ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-[0_6px_14px_rgba(37,99,235,.16)]' : dark ? 'border-slate-600 bg-slate-800 text-slate-100 hover:border-[#60a5fa]' : 'border-[#bfdbfe] bg-white/90 text-[#0b172a] hover:border-[#2563eb]'}`}>
              <Icon size={13} strokeWidth={2.3} />
              <span>{label}</span>
            </button>)}
          </div>
        </div>
      </div> : <div className="rounded-lg border border-dashed border-[#d7e5f6] px-3 py-5 text-center text-xs font-semibold text-slate-500">Select an area to choose its fill.</div>}
    </section>
    <section className={panelClass('grid gap-2', dark)}>
      {selectedPlayers.length > 0 && <>
        <Field
          label={`Player size ${Math.round((selectedPlayers[0].size ?? 1) * 100)}%`}
          type="range"
          min="0.65"
          max="1.65"
          step="0.05"
          value={selectedPlayers[0].size ?? 1}
          onChange={value => selectedPlayers.forEach(player => updatePlayer(player.id, { size: Number(value) }))}
        />
        <ColorField
          label={`Name background (${selectedPlayers.length})`}
          value={selectedPlayers[0].nameBackground ?? '#ffffff'}
          onChange={nameBackground => selectedPlayers.forEach(player => updatePlayer(player.id, { nameBackground }))}
        />
      </>}
      {!isGoal && <Field label="Thickness" type="range" min="1" max="18" value={selectedDrawing?.strokeWidth ?? toolStyle.strokeWidth} onChange={v => updateNumber('strokeWidth', Number(v))} />}
      {selectedDrawing?.type === 'text' && <Field label="Text" value={selectedDrawing.text ?? ''} onChange={v => updateDrawing(selectedDrawing.id, { text: v })} />}
      {selectedDrawing && isRotatableProp && <div className="grid grid-cols-4 gap-1">
        {([0, 90, 180, 270] as const).map((rotation, index) => <button key={rotation} title={['Up', 'Right', 'Down', 'Left'][index]} onClick={() => updateDrawing(selectedDrawing.id, { rotation })} className={`h-9 rounded-lg border text-[10px] font-black ${selectedDrawing.rotation === rotation || (!selectedDrawing.rotation && rotation === 0) ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a]'}`}>{['Up', 'Right', 'Down', 'Left'][index]}</button>)}
      </div>}
      {isGoal && <p className="text-[10px] font-semibold text-slate-500">Goal thickness is fixed for realistic proportions.</p>}
      {isMannequin && <p className="text-[10px] font-semibold text-slate-500">Choose a direction to rotate the selected mannequin.</p>}
    </section>
  </div>;
}

function ScenesPanel({ onPreviewAnimation, onExportVideo }: Pick<ControlDockProps, 'onPreviewAnimation' | 'onExportVideo'>) {
  const { project, addScene, applyScene, duplicateScene, deleteScene, renameScene, updateScene, playing } = useTacticsStore();
  const dark = project.settings.theme === 'dark';
  const [region, setRegion] = useState<ExportRegion>('full');
  const exportRegions = exportRegionsFor(project.settings.format);
  useEffect(() => {
    if (!exportRegions.some(option => option.id === region)) setRegion('full');
  }, [project.settings.format, region]);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={addScene} className="flex h-9 items-center gap-2 rounded-lg bg-[#2563eb] px-3 text-sm font-black text-white"><Plus size={16} /> Scene</button>
      <button onClick={onPreviewAnimation} disabled={playing || project.scenes.length < 2} className="flex h-9 items-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 px-3 text-sm font-black text-[#0b172a] disabled:opacity-40"><Play size={16} /> Play animation</button>
      <div className="flex items-center gap-1 rounded-lg border border-[#d7e5f6] bg-white/70 p-1">
        {exportRegions.map(option => <button key={option.id} onClick={() => setRegion(option.id)} className={`h-7 rounded-md px-2 text-[10px] font-black ${region === option.id ? 'bg-[#2563eb] text-white' : 'text-[#0b172a] hover:bg-[#eff6ff]'}`}>
          {option.label}
        </button>)}
      </div>
      <button onClick={() => onExportVideo(region)} disabled={playing || project.scenes.length < 2} className="flex h-9 items-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 px-3 text-sm font-black text-[#0b172a] disabled:opacity-40"><Film size={16} /> MP4</button>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {project.scenes.length === 0 && <div className="rounded-lg border border-dashed border-[#d7e5f6] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500">Capture two scenes to preview movement.</div>}
      {project.scenes.map((scene, index) => <section key={scene.id} className={panelClass('min-w-64', dark)}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-sm font-black text-white">{index + 1}</span>
          <input className="min-w-0 flex-1 bg-transparent text-sm font-black text-[#0b172a] outline-none" value={scene.name} onChange={e => renameScene(scene.id, e.target.value)} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Seconds" type="number" min="0.4" step="0.1" value={scene.duration} onChange={v => updateScene(scene.id, { duration: Math.max(0.4, Number(v) || 0.4) })} />
          <label className="space-y-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Ease
            <select className="h-9 w-full rounded-lg border border-[#d7e5f6] bg-white/80 px-2 text-sm font-semibold normal-case text-[#0b172a]" value={scene.transition} onChange={e => updateScene(scene.id, { transition: e.target.value as Scene['transition'] })}>
              {['linear', 'ease-in', 'ease-out', 'ease-in-out'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => applyScene(scene.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#eff6ff] px-2 py-2 text-xs font-black text-[#1d4ed8] ring-1 ring-[#bfdbfe]"><Eye size={14} /> Preview scene</button>
          <button onClick={() => duplicateScene(scene.id)} className="rounded-lg bg-white p-2 text-[#0b172a] ring-1 ring-[#d7e5f6]"><Copy size={14} /></button>
          <button onClick={() => deleteScene(scene.id)} className="rounded-lg bg-red-50 p-2 text-red-600 ring-1 ring-red-100"><Trash2 size={14} /></button>
        </div>
      </section>)}
    </div>
  </div>;
}

function ExportPanel({ onExportImage, onExportVideo }: Pick<ControlDockProps, 'onExportImage' | 'onExportVideo'>) {
  const { project, playing } = useTacticsStore();
  const [region, setRegion] = useState<ExportRegion>('full');
  const exportRegions = exportRegionsFor(project.settings.format);
  useEffect(() => {
    if (!exportRegions.some(option => option.id === region)) setRegion('full');
  }, [project.settings.format, region]);
  return <div className="grid gap-2">
    <section className={panelClass('space-y-2', project.settings.theme === 'dark')}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Export area</p>
      <div className="grid grid-cols-3 gap-1.5">
        {exportRegions.map(option => <button key={option.id} onClick={() => setRegion(option.id)} className={`h-8 whitespace-nowrap rounded-lg border px-2 text-[10px] font-black ${region === option.id ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb]'}`}>
          {option.label}
        </button>)}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <button onClick={() => onExportImage('png', region)} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 text-sm font-black text-[#0b172a] hover:border-[#2563eb]"><ImageDown size={16} /> PNG</button>
        <button onClick={() => onExportImage('jpeg', region)} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 text-sm font-black text-[#0b172a]"><ImageDown size={16} /> JPG</button>
        <button onClick={() => onExportVideo(region)} disabled={playing || project.scenes.length < 2} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7e5f6] bg-white/80 text-sm font-black text-[#0b172a] disabled:opacity-40"><Film size={16} /> MP4</button>
      </div>
    </section>
  </div>;
}

export function ControlDock({ onExportImage, onPreviewAnimation, onExportVideo }: ControlDockProps) {
  const { dockTab: tab, dockPosition } = useTacticsStore();
  const dark = useTacticsStore(s => s.project.settings.theme === 'dark');
  const side = dockPosition === 'right';
  return <footer className={`dock-shell ${side ? 'dock-side h-full w-[min(420px,90vw)] shrink-0 border-l' : 'dock-bottom h-[clamp(220px,27dvh,260px)] shrink-0 border-t'} min-h-0 overflow-hidden shadow-[0_-18px_60px_rgba(11,23,42,.08)] backdrop-blur ${dark ? 'border-slate-700 bg-slate-950/95' : 'border-[#d7e5f6] bg-white/95'}`}>
    <div className="mx-auto flex h-full max-w-[1680px] flex-col">
      {side ? <>
        <div className={`flex shrink-0 flex-col gap-1.5 border-b p-1.5 ${dark ? 'border-slate-700' : 'border-[#d7e5f6]'}`}>
          <div className="flex items-center justify-between gap-2"><QuickActions embedded /><DockModeSwitcher embedded /></div>
          <PitchScaleControl embedded />
        </div>
        <div className="max-h-[34dvh] shrink-0 overflow-y-auto overscroll-contain p-1.5"><ToolRail vertical /></div>
        <div className={`flex shrink-0 flex-col items-stretch gap-2 overflow-x-auto border-y px-2 py-1.5 ${dark ? 'border-slate-700' : 'border-[#d7e5f6]'}`}>
          <span className={`shrink-0 text-[9px] font-black uppercase tracking-[0.18em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Workspace</span>
          <WorkspaceTabs side />
        </div>
      </> : <>
        <div className={`dock-command-row flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b px-2 ${dark ? 'border-slate-700' : 'border-[#d7e5f6]'}`}>
          <div className="flex min-w-max items-center gap-2">
            <WorkspaceTabs />
            <span className={`h-6 w-px ${dark ? 'bg-slate-700' : 'bg-[#d7e5f6]'}`} />
            <QuickActions embedded />
            <PitchScaleControl embedded />
            <DockModeSwitcher embedded />
          </div>
        </div>
        <div className={`flex h-11 shrink-0 items-center gap-2 border-b px-2 ${dark ? 'border-slate-700' : 'border-[#d7e5f6]'}`}>
          <span className={`shrink-0 text-[9px] font-black uppercase tracking-[0.16em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Board tools</span>
          <div className="min-w-0 flex-1 overflow-x-auto overscroll-contain py-1"><ToolRail compact /></div>
        </div>
      </>}
      <div className="dock-content min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-2.5">
        {tab === 'page' && <PagePanel />}
        {tab === 'style' && <StylePanel />}
        {tab === 'squad' && <SquadPanel />}
        {tab === 'presets' && <PresetTeamsPanel />}
        {tab === 'edit' && <PlayerEditPanel />}
        {tab === 'scenes' && <ScenesPanel onPreviewAnimation={onPreviewAnimation} onExportVideo={onExportVideo} />}
        {tab === 'export' && <ExportPanel onExportImage={onExportImage} onExportVideo={onExportVideo} />}
      </div>
    </div>
  </footer>;
}
