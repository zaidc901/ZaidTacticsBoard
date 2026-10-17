import { StudioLogo } from './StudioLogo';
import { useShallow } from 'zustand/react/shallow';
import { memo, RefObject, useMemo, useRef, useState, useEffect } from 'react';
import { Copy, Home, Mail, Moon, Share2, Sun, Video, X } from 'lucide-react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Arrow, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { flagImageUrlByPresetId, teamPresetById } from '../data/teamPresets';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { BoardToolbox, PitchScaleControl, QuickActions } from './ControlDock';
import { boardDragMoved, constrainBoardMove } from '../utils/boardInteraction';
import { boardCanvasPixelRatio, boardFitZoom, boardZoomBaseline } from '../utils/boardZoom';
import { trackBoardPointer } from '../utils/boardPointer';
import { useTacticsStore } from '../store/tacticsStore';
import { Ball, BallDesign, Drawing, FillPattern, PlaybackDrawing, Player, Team, ToolStyle } from '../types/domain';

const pitchMargin = 56;
const baseMarkerRadius = 24;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clampRange = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const imageCache = new Map<string, HTMLImageElement | 'error'>();

type Mapper = {
  toAbs: (x: number, y: number) => [number, number];
  toRel: (x: number, y: number) => { x: number; y: number };
  pitch: { x: number; y: number; width: number; height: number };
};

function useLoadedImage(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    const cached = url ? imageCache.get(url) : undefined;
    return cached instanceof HTMLImageElement ? cached : null;
  });

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const cached = imageCache.get(url);
    if (cached instanceof HTMLImageElement) {
      setImage(cached);
      return;
    }
    if (cached === 'error') {
      setImage(null);
      return;
    }
    let cancelled = false;
    const next = new window.Image();
    next.crossOrigin = 'anonymous';
    next.referrerPolicy = 'no-referrer';
    next.onload = () => {
      if (cancelled) return;
      imageCache.set(url, next);
      setImage(next);
    };
    next.onerror = () => {
      if (cancelled) return;
      imageCache.set(url, 'error');
      setImage(null);
    };
    next.src = url;
    return () => { cancelled = true; };
  }, [url]);

  return image;
}

function coverCrop(image: HTMLImageElement) {
  const targetRatio = 1;
  const sourceRatio = image.width / image.height;
  if (sourceRatio > targetRatio) {
    const width = image.height * targetRatio;
    return { x: (image.width - width) / 2, y: 0, width, height: image.height };
  }
  const height = image.width / targetRatio;
  return { x: 0, y: (image.height - height) / 2, width: image.width, height };
}

function makeMapper(width: number, height: number, scaleX: number, scaleY: number, landscape: boolean): Mapper {
  const maxWidth = width - pitchMargin * 2;
  const maxHeight = height - pitchMargin * 2;
  const baseRatio = landscape ? 105 / 68 : 68 / 105;
  const horizontalScale = clampRange(scaleX || 1, 0.5, 1.24);
  const verticalScale = clampRange(scaleY || 1, 0.5, 1.24);
  const availableRatio = maxWidth / maxHeight;
  const baseWidth = availableRatio > baseRatio ? maxHeight * baseRatio : maxWidth;
  const baseHeight = availableRatio > baseRatio ? maxHeight : maxWidth / baseRatio;
  const pitchWidth = Math.min(maxWidth, baseWidth * horizontalScale);
  const pitchHeight = Math.min(maxHeight, baseHeight * verticalScale);
  const pitch = { x: (width - pitchWidth) / 2, y: (height - pitchHeight) / 2, width: pitchWidth, height: pitchHeight };
  return {
    pitch,
    toAbs: (x, y) => [pitch.x + x * pitch.width, pitch.y + y * pitch.height],
    toRel: (x, y) => ({ x: clamp01((x - pitch.x) / pitch.width), y: clamp01((y - pitch.y) / pitch.height) }),
  };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 900, height: 1200 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      const next = { width: box.width, height: box.height };
      setSize(current => current.width === next.width && current.height === next.height ? current : next);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function PepZones({ mapper, landscape }: { mapper: Mapper; landscape: boolean }) {
  const { x, y, width, height } = mapper.pitch;
  const lanes = [0, 0.18, 0.38, 0.62, 0.82, 1];
  const bands = [0, 0.16, 0.33, 0.5, 0.67, 0.84, 1];

  return <Group listening={false}>
    {Array.from({ length: 5 }).flatMap((_, lane) => Array.from({ length: 6 }).map((__, band) => {
      const laneStart = lanes[lane];
      const laneEnd = lanes[lane + 1];
      const bandStart = bands[band];
      const bandEnd = bands[band + 1];
      const rx = landscape ? x + bandStart * width : x + laneStart * width;
      const ry = landscape ? y + laneStart * height : y + bandStart * height;
      const rw = landscape ? (bandEnd - bandStart) * width : (laneEnd - laneStart) * width;
      const rh = landscape ? (laneEnd - laneStart) * height : (bandEnd - bandStart) * height;
      const halfSpace = lane === 1 || lane === 3;
      const centralBox = lane === 2 && (band === 2 || band === 3);
      return <Rect key={`${lane}-${band}`} x={rx} y={ry} width={rw} height={rh} fill={centralBox ? '#fef3c7' : halfSpace ? '#bfdbfe' : '#ffffff'} opacity={centralBox ? 0.22 : halfSpace ? 0.13 : (band + lane) % 2 ? 0.045 : 0.08} stroke="#dbeafe" strokeWidth={0.8} />;
    }))}
    {lanes.slice(1, -1).map(v => landscape
      ? <Line key={`lane-${v}`} points={[x, y + v * height, x + width, y + v * height]} stroke="#dbeafe" strokeWidth={2.2} dash={[12, 9]} opacity={0.88} />
      : <Line key={`lane-${v}`} points={[x + v * width, y, x + v * width, y + height]} stroke="#dbeafe" strokeWidth={2.2} dash={[12, 9]} opacity={0.88} />)}
    {bands.slice(1, -1).map(v => landscape
      ? <Line key={`band-${v}`} points={[x + v * width, y, x + v * width, y + height]} stroke="#f8fbff" strokeWidth={1.8} dash={[16, 10]} opacity={0.72} />
      : <Line key={`band-${v}`} points={[x, y + v * height, x + width, y + v * height]} stroke="#f8fbff" strokeWidth={1.8} dash={[16, 10]} opacity={0.72} />)}
  </Group>;
}

function GridOverlay({ mapper, landscape }: { mapper: Mapper; landscape: boolean }) {
  const settings = useTacticsStore(s => s.project.settings);
  if (settings.grid === 'none') return null;
  const { x, y, width, height } = mapper.pitch;
  const dark = settings.theme === 'dark';
  const stroke = dark ? '#a7f3d0' : '#0f766e';
  const strongStroke = dark ? '#ecfdf5' : '#173b27';
  const lanes = [0, 0.18, 0.34, 0.66, 0.82, 1];
  const bands = [0, 1 / 3, 2 / 3, 1];
  const showLanes = settings.grid === 'five-lanes' || settings.grid === 'fifteen' || settings.grid === 'custom';
  const showBands = settings.grid === 'thirds' || settings.grid === 'fifteen' || settings.grid === 'custom';

  return <Group listening={false}>
    {showLanes && lanes.slice(1, -1).map(value => landscape
      ? <Line key={`grid-lane-${value}`} points={[x, y + value * height, x + width, y + value * height]} stroke={stroke} strokeWidth={1.8} dash={[10, 12]} opacity={dark ? 0.46 : 0.34} />
      : <Line key={`grid-lane-${value}`} points={[x + value * width, y, x + value * width, y + height]} stroke={stroke} strokeWidth={1.8} dash={[10, 12]} opacity={dark ? 0.46 : 0.34} />)}
    {showBands && bands.slice(1, -1).map(value => landscape
      ? <Line key={`grid-band-${value}`} points={[x + value * width, y, x + value * width, y + height]} stroke={strongStroke} strokeWidth={1.7} dash={[14, 12]} opacity={dark ? 0.44 : 0.28} />
      : <Line key={`grid-band-${value}`} points={[x, y + value * height, x + width, y + value * height]} stroke={strongStroke} strokeWidth={1.7} dash={[14, 12]} opacity={dark ? 0.44 : 0.28} />)}
  </Group>;
}

function PitchBackground({ width, height, mapper }: { width: number; height: number; mapper: Mapper }) {
  const settings = useTacticsStore(s => s.project.settings);
  const landscape = settings.format === 'landscape';
  const { x, y, width: pw, height: ph } = mapper.pitch;
  const lengthAxis = landscape ? pw : ph;
  const crossAxis = landscape ? ph : pw;
  const boxDepth = lengthAxis * 0.16;
  const boxSpan = crossAxis * 0.56;
  const sixDepth = lengthAxis * 0.065;
  const sixSpan = crossAxis * 0.28;
  const centerCircle = crossAxis * 0.16;
  const stripeCount = 12;
  const goalDepth = Math.max(12, lengthAxis * 0.028);
  const goalSpan = crossAxis * 0.2;

  const dark = settings.theme === 'dark';
  const pitchGoalStroke = settings.lineColor;
  const pitchGoalWidth = settings.lineThickness;
  return <Group listening={false}>
    <Rect
      x={8}
      y={8}
      width={width - 16}
      height={height - 16}
      cornerRadius={34}
      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
      fillLinearGradientEndPoint={{ x: width, y: height }}
      fillLinearGradientColorStops={dark
        ? [0, '#04130b', 0.46, '#0a2113', 0.76, '#0d2d1a', 1, '#06170e']
        : [0, '#0d2416', 0.42, '#173d25', 0.74, '#1b4b2d', 1, '#102719']}
      stroke={dark ? '#1f5c39' : '#3f7b55'}
      strokeWidth={2}
      shadowColor="#020617"
      shadowBlur={36}
      shadowOpacity={dark ? 0.38 : 0.25}
    />
    <Circle x={width * 0.12} y={height * 0.1} radius={Math.max(width, height) * 0.24} fill="#34d399" opacity={dark ? 0.055 : 0.08} />
    <Circle x={width * 0.9} y={height * 0.88} radius={Math.max(width, height) * 0.2} fill="#fbbf24" opacity={dark ? 0.035 : 0.05} />
    <Rect x={18} y={18} width={width - 36} height={height - 36} cornerRadius={27} stroke="#86efac" strokeWidth={1} opacity={dark ? 0.16 : 0.24} />
    <Rect x={x} y={y} width={pw} height={ph} fill={settings.grassColor} shadowBlur={34} shadowColor={settings.theme === 'dark' ? '#020617' : '#79a684'} shadowOpacity={settings.theme === 'dark' ? 0.3 : 0.18} />
    {Array.from({ length: stripeCount }).map((_, i) => landscape
      ? <Rect key={i} x={x + (pw / stripeCount) * i} y={y} width={pw / stripeCount} height={ph} fill={settings.grassColor} opacity={i % 2 ? 1 : 1 - settings.stripeIntensity} />
      : <Rect key={i} x={x} y={y + (ph / stripeCount) * i} width={pw} height={ph / stripeCount} fill={settings.grassColor} opacity={i % 2 ? 1 : 1 - settings.stripeIntensity} />)}
    {settings.pepZones && <PepZones mapper={mapper} landscape={landscape} />}
    <GridOverlay mapper={mapper} landscape={landscape} />
    <Rect x={x} y={y} width={pw} height={ph} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    {landscape ? <>
      <Line points={[x + pw / 2, y, x + pw / 2, y + ph]} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Circle x={x + pw / 2} y={y + ph / 2} radius={centerCircle} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Circle x={x + pw / 2} y={y + ph / 2} radius={5} fill={settings.lineColor} />
      <Rect x={x} y={y + (ph - boxSpan) / 2} width={boxDepth} height={boxSpan} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x} y={y + (ph - sixSpan) / 2} width={sixDepth} height={sixSpan} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + pw - boxDepth} y={y + (ph - boxSpan) / 2} width={boxDepth} height={boxSpan} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + pw - sixDepth} y={y + (ph - sixSpan) / 2} width={sixDepth} height={sixSpan} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x - goalDepth} y={y + (ph - goalSpan) / 2} width={goalDepth} height={goalSpan} stroke={pitchGoalStroke} strokeWidth={pitchGoalWidth} />
      <Rect x={x + pw} y={y + (ph - goalSpan) / 2} width={goalDepth} height={goalSpan} stroke={pitchGoalStroke} strokeWidth={pitchGoalWidth} />
      <Circle x={x + pw * 0.11} y={y + ph / 2} radius={5} fill={settings.lineColor} />
      <Circle x={x + pw * 0.89} y={y + ph / 2} radius={5} fill={settings.lineColor} />
    </> : <>
      <Line points={[x, y + ph / 2, x + pw, y + ph / 2]} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Circle x={x + pw / 2} y={y + ph / 2} radius={centerCircle} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Circle x={x + pw / 2} y={y + ph / 2} radius={5} fill={settings.lineColor} />
      <Rect x={x + (pw - boxSpan) / 2} y={y} width={boxSpan} height={boxDepth} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + (pw - sixSpan) / 2} y={y} width={sixSpan} height={sixDepth} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + (pw - boxSpan) / 2} y={y + ph - boxDepth} width={boxSpan} height={boxDepth} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + (pw - sixSpan) / 2} y={y + ph - sixDepth} width={sixSpan} height={sixDepth} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
      <Rect x={x + (pw - goalSpan) / 2} y={y - goalDepth} width={goalSpan} height={goalDepth} stroke={pitchGoalStroke} strokeWidth={pitchGoalWidth} />
      <Rect x={x + (pw - goalSpan) / 2} y={y + ph} width={goalSpan} height={goalDepth} stroke={pitchGoalStroke} strokeWidth={pitchGoalWidth} />
      <Circle x={x + pw / 2} y={y + ph * 0.11} radius={5} fill={settings.lineColor} />
      <Circle x={x + pw / 2} y={y + ph * 0.89} radius={5} fill={settings.lineColor} />
    </>}
  </Group>;
}

const Pitch = memo(PitchBackground);

function CountryFlag({ flagId, radius }: { flagId: string; radius: number }) {
  const preset = teamPresetById[flagId] ?? teamPresetById.iraq;
  const image = useLoadedImage(flagImageUrlByPresetId[preset.id]);
  const vertical = preset.flagDirection === 'vertical';
  const bandSize = (radius * 2) / preset.flagBands.length;
  return <Group clipFunc={(ctx) => { ctx.arc(0, 0, radius, 0, Math.PI * 2); }}>
    <Circle radius={radius} fill="#ffffff" />
    {!image && preset.flagBands.map((color, index) => vertical
      ? <Rect key={index} x={-radius + index * bandSize} y={-radius} width={bandSize + 1} height={radius * 2} fill={color} opacity={0.48} />
      : <Rect key={index} x={-radius} y={-radius + index * bandSize} width={radius * 2} height={bandSize + 1} fill={color} opacity={0.48} />)}
    {image && <KonvaImage image={image} crop={coverCrop(image)} x={-radius} y={-radius} width={radius * 2} height={radius * 2} />}
    <Circle radius={radius} fill="#ffffff" opacity={0.08} />
  </Group>;
}

function CustomBadge({ url, radius }: { url: string; radius: number }) {
  const image = useLoadedImage(url);
  if (!image) return null;
  return <Group clipFunc={(ctx) => { ctx.arc(0, 0, radius, 0, Math.PI * 2); }}>
    <KonvaImage image={image} crop={coverCrop(image)} x={-radius} y={-radius} width={radius * 2} height={radius * 2} />
    <Circle radius={radius} fill="#ffffff" opacity={0.06} />
  </Group>;
}

function readableTextColor(background: string) {
  const hex = background.match(/^#([\da-f]{6})$/i)?.[1];
  if (!hex) return '#0b172a';
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 155 ? '#0b172a' : '#ffffff';
}

const PlayerMarker = memo(function PlayerMarker({ player, mapper }: { player: Player; mapper: Mapper }) {
  const selected = useTacticsStore(state => state.selectedIds.includes(player.id));
  const playing = useTacticsStore(state => state.playing);
  const team = useTacticsStore(state => state.project.teams.find(item => item.id === player.teamId));
  const selectionColor = useTacticsStore(state => state.project.settings.selectionColor ?? '#facc15');
  const [x, y] = mapper.toAbs(player.x, player.y);
  const isSelected = !playing && selected;
  const markerRadius = baseMarkerRadius * clampRange(player.size ?? 1, 0.65, 1.65);
  const labelWidth = Math.max(88, 108 * clampRange(player.size ?? 1, 0.65, 1.65));
  const hasName = (team?.showNames ?? true) && player.displayName.trim().length > 0;
  const displayName = player.displayName.length > 14 ? `${player.displayName.slice(0, 13)}.` : player.displayName;
  const nameBackground = player.nameBackground ?? '#ffffff';
  const nameTextColor = readableTextColor(nameBackground);
  const badgeImage = team?.badge;
  const showPresetBadge = team?.showBadge ?? true;
  const preset = player.flag ? teamPresetById[player.flag] : undefined;
  const showCountryFlag = Boolean(showPresetBadge && player.flag && preset?.collection !== 'premier-league');
  const hasBadge = Boolean(badgeImage || showCountryFlag);
  const numberColor = hasBadge ? '#07111f' : readableTextColor(player.color);
  if (player.hidden || !player.starter) return null;

  return <Group id={`player-node-${player.id}`} x={x} y={y} listening={false}>
    <Group>
      {isSelected && <Circle radius={markerRadius + 13} fill={selectionColor} opacity={0.22} stroke={selectionColor} strokeWidth={4} />}
      <Circle radius={markerRadius + 5} fill="#071b12" opacity={0.94} shadowBlur={12} shadowColor="#020617" shadowOpacity={0.32} />
      <Circle radius={markerRadius} fill={player.color} stroke={isSelected ? selectionColor : player.secondaryColor} strokeWidth={isSelected ? 4 : 3} shadowBlur={5} shadowColor="#020617" shadowOpacity={0.32} opacity={player.opacity} />
      {showCountryFlag && player.flag && !badgeImage && <CountryFlag flagId={player.flag} radius={markerRadius} />}
      {badgeImage && <CustomBadge url={badgeImage} radius={markerRadius} />}
      {(team?.showNumbers ?? true) && (player.showNumber ?? true) && <Text text={String(player.number)} width={markerRadius * 2} height={markerRadius * 2} x={-markerRadius} y={-markerRadius} offsetY={1} align="center" verticalAlign="middle" fill={numberColor} fontFamily="Inter, Arial, sans-serif" fontStyle="bold" fontSize={clampRange(markerRadius * 0.76, 13, 25)} lineHeight={1} shadowColor={hasBadge ? '#ffffff' : numberColor === '#07111f' ? '#ffffff' : '#020617'} shadowBlur={4} shadowOpacity={0.96} />}
      {hasName && <Group x={-labelWidth / 2} y={markerRadius + 6} opacity={player.opacity}>
        <Rect width={labelWidth} height={25} fill={nameBackground} stroke={isSelected ? '#0f766e' : '#c7d8ee'} strokeWidth={1.4} cornerRadius={7} shadowBlur={6} shadowColor="#0b172a" shadowOpacity={0.18} />
        <Text text={displayName} width={labelWidth} height={25} align="center" verticalAlign="middle" fill={nameTextColor} fontFamily="Inter, Arial, sans-serif" fontSize={12} fontStyle="bold" />
      </Group>}
    </Group>
  </Group>;
});

type FieldPlayerDrag = { teamId: string; playerIds: string[] };

function BenchTray({ team, side, fieldPlayerDrag }: { team: Team; side: 'left' | 'right'; fieldPlayerDrag: FieldPlayerDrag | null }) {
  const { selectedIds, select, playing } = useTacticsStore(useShallow(state => ({ selectedIds: state.selectedIds, select: state.select, playing: state.playing })));
  const players = team.squad.filter(player => !player.starter || player.hidden);
  const sideClass = side === 'left' ? 'left-2 sm:left-3' : 'right-2 sm:right-3';
  const receiving = fieldPlayerDrag?.teamId === team.id;
  const teamTextColor = readableTextColor(team.primaryColor);
  return <aside
    data-bench-team={team.id}
    data-empty={players.length === 0}
    className={`bench-tray bench-tray-${side} pointer-events-auto absolute top-[4.25rem] z-30 flex max-h-[min(58dvh,27rem)] w-[4.5rem] flex-col overflow-hidden rounded-xl border bg-white/95 shadow-[0_12px_34px_rgba(11,23,42,.22)] backdrop-blur-md transition sm:w-24 ${receiving ? 'scale-[1.04] border-[#06b6d4] ring-4 ring-[#22d3ee]/30' : ''} ${sideClass}`}
    style={{ borderColor: receiving ? '#06b6d4' : team.primaryColor }}
  >
    <div className="shrink-0 border-b px-1.5 py-2 text-center" style={{ backgroundColor: team.primaryColor, borderColor: team.secondaryColor, color: teamTextColor }}>
      <span className="mx-auto mb-1 block h-1.5 w-8 rounded-full" style={{ backgroundColor: team.secondaryColor }} />
      <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px]">{team.shortName || team.name}</p>
      <p className="text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: receiving ? '#67e8f9' : teamTextColor, opacity: receiving ? 1 : 0.78 }}>{receiving ? 'Drop here' : `Bench ${players.length}`}</p>
    </div>
    <div className="grid min-h-0 gap-1 overflow-y-auto p-1.5">
      {players.length === 0 && <p className="px-1 py-3 text-center text-[8px] font-bold leading-tight text-slate-400">No substitutes</p>}
      {players.map(player => {
        const showBadge = team.showBadge ?? true;
        const playerPreset = player.flag ? teamPresetById[player.flag] : undefined;
        const badge = team.badge || (showBadge && playerPreset?.collection !== 'premier-league' && player.flag ? flagImageUrlByPresetId[player.flag] : undefined);
        const selected = selectedIds.includes(player.id);
        const playerTextColor = badge ? '#07111f' : readableTextColor(player.color);
        return <button
          key={player.id}
          type="button"
          draggable={!playing}
          title={`Drag ${player.displayName || `#${player.number}`} onto the pitch`}
          onClick={() => select(player.id)}
          onDragStart={event => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/player-id', player.id);
          }}
          className={`grid min-h-14 place-items-center gap-1 rounded-lg border px-1 py-1.5 transition ${selected ? 'border-[#2563eb] bg-[#dbeafe] ring-2 ring-[#2563eb]/30' : 'border-[#d7e5f6] bg-white/90 hover:border-[#60a5fa]'}`}
        >
          <span className="relative block h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-[0_3px_8px_rgba(11,23,42,.2)]" style={{ backgroundColor: player.color }}>
            {badge && <img src={badge} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
            <span className={`absolute inset-0 grid place-items-center text-[11px] font-black leading-none ${badge ? 'drop-shadow-[0_1px_2px_white]' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]'}`} style={{ color: playerTextColor }}>{player.number}</span>
          </span>
          <span className="block w-full truncate text-center text-[8px] font-black leading-none text-[#0b172a] sm:text-[9px]">{player.displayName || `#${player.number}`}</span>
        </button>;
      })}
    </div>
  </aside>;
}

function polygonPoints(radius: number, sides: number, rotation = -Math.PI / 2) {
  return Array.from({ length: sides }).flatMap((_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

function BallSkin({ radius, design }: { radius: number; design: BallDesign }) {
  return <Group clipFunc={(ctx) => { ctx.arc(0, 0, radius, 0, Math.PI * 2); }}>
    <FallbackBallSkin radius={radius} design={design} />
    <Circle x={-radius * 0.3} y={-radius * 0.34} radius={radius * 0.42} fill="#ffffff" opacity={0.16} />
    <Circle radius={Math.max(1, radius - 0.65)} stroke="#cbd5e1" strokeWidth={Math.max(0.55, radius * 0.06)} opacity={0.72} />
  </Group>;
}

function FallbackBallSkin({ radius, design }: { radius: number; design: BallDesign }) {
  const clip = (ctx: Konva.Context) => { ctx.arc(0, 0, radius, 0, Math.PI * 2); };

  if (design === 'jabulani') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f8f7ef" />
      <Line points={[-radius * 1.08, -radius * 0.72, -radius * 0.58, -radius * 0.92, -radius * 0.28, -radius * 0.5, -radius * 0.48, radius * 0.02]} tension={0.5} stroke="#171717" strokeWidth={radius * 0.34} lineCap="round" lineJoin="round" />
      <Line points={[-radius * 1.02, -radius * 0.7, -radius * 0.58, -radius * 0.84, -radius * 0.34, -radius * 0.48, -radius * 0.48, -radius * 0.02]} tension={0.5} stroke="#b79a55" strokeWidth={radius * 0.14} lineCap="round" />
      <Line points={[radius * 1.08, -radius * 0.72, radius * 0.58, -radius * 0.92, radius * 0.28, -radius * 0.5, radius * 0.48, radius * 0.02]} tension={0.5} stroke="#171717" strokeWidth={radius * 0.34} lineCap="round" lineJoin="round" />
      <Line points={[radius * 1.02, -radius * 0.7, radius * 0.58, -radius * 0.84, radius * 0.34, -radius * 0.48, radius * 0.48, -radius * 0.02]} tension={0.5} stroke="#b79a55" strokeWidth={radius * 0.14} lineCap="round" />
      <Line points={[-radius * 0.92, radius * 0.76, -radius * 0.5, radius * 0.38, -radius * 0.16, radius * 0.7]} tension={0.42} stroke="#111827" strokeWidth={radius * 0.18} lineCap="round" />
      <Line points={[radius * 0.92, radius * 0.76, radius * 0.5, radius * 0.38, radius * 0.16, radius * 0.7]} tension={0.42} stroke="#111827" strokeWidth={radius * 0.18} lineCap="round" />
      <Line points={[-radius * 0.18, -radius * 0.1, radius * 0.18, -radius * 0.1]} stroke="#202020" strokeWidth={radius * 0.06} lineCap="round" />
      <Line points={[-radius * 0.12, radius * 0.04, radius * 0.12, radius * 0.04]} stroke="#202020" strokeWidth={radius * 0.045} lineCap="round" />
    </Group>;
  }

  if (design === 'brazuca') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#ffffff" />
      <Line points={[-radius * 1.08, -radius * 0.4, -radius * 0.42, -radius * 0.72, -radius * 0.08, -radius * 0.2, radius * 0.42, -radius * 0.72, radius * 1.04, -radius * 0.35]} tension={0.62} stroke="#17202a" strokeWidth={radius * 0.34} lineCap="round" lineJoin="round" />
      <Line points={[-radius * 1.06, -radius * 0.4, -radius * 0.42, -radius * 0.68, -radius * 0.08, -radius * 0.18, radius * 0.42, -radius * 0.68, radius * 1.03, -radius * 0.34]} tension={0.62} stroke="#139db5" strokeWidth={radius * 0.17} lineCap="round" />
      <Line points={[-radius * 1.02, radius * 0.58, -radius * 0.42, radius * 0.2, radius * 0.02, radius * 0.68, radius * 0.58, radius * 0.2, radius * 1.06, radius * 0.52]} tension={0.62} stroke="#17202a" strokeWidth={radius * 0.34} lineCap="round" lineJoin="round" />
      <Line points={[-radius, radius * 0.56, -radius * 0.42, radius * 0.22, radius * 0.02, radius * 0.64, radius * 0.58, radius * 0.22, radius * 1.02, radius * 0.5]} tension={0.62} stroke="#69b93b" strokeWidth={radius * 0.17} lineCap="round" />
      <Line points={[radius * 0.7, -radius * 1.02, radius * 0.3, -radius * 0.4, radius * 0.7, radius * 0.02, radius * 0.36, radius * 1.04]} tension={0.58} stroke="#17202a" strokeWidth={radius * 0.28} lineCap="round" />
      <Line points={[radius * 0.7, -radius, radius * 0.32, -radius * 0.4, radius * 0.68, radius * 0.02, radius * 0.38, radius]} tension={0.58} stroke="#f07c32" strokeWidth={radius * 0.13} lineCap="round" />
      <Line points={[-radius * 0.7, -radius, -radius * 0.34, -radius * 0.38, -radius * 0.66, radius * 0.02, -radius * 0.38, radius]} tension={0.58} stroke="#cf405f" strokeWidth={radius * 0.12} lineCap="round" />
    </Group>;
  }

  if (design === 'telstar18') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f5f4ef" />
      <Line points={[-radius * 1.02, -radius * 0.74, -radius * 0.3, -radius * 0.72, -radius * 0.15, -radius * 0.14, -radius * 0.82, radius * 0.02]} closed fill="#151515" />
      <Line points={[radius * 0.2, -radius * 1.04, radius * 0.84, -radius * 0.72, radius * 0.62, -radius * 0.08, radius * 0.02, -radius * 0.22]} closed fill="#171717" />
      <Line points={[-radius * 0.88, radius * 0.22, -radius * 0.22, radius * 0.02, radius * 0.1, radius * 0.55, -radius * 0.42, radius * 0.9, -radius * 1.03, radius * 0.7]} closed fill="#202020" />
      <Line points={[radius * 0.28, radius * 0.12, radius * 0.96, -radius * 0.02, radius * 1.05, radius * 0.62, radius * 0.5, radius * 0.9, radius * 0.02, radius * 0.58]} closed fill="#111111" />
      {[
        [-.72, -.62], [-.58, -.5], [-.42, -.64], [.42, -.72], [.58, -.58], [.7, -.4],
        [-.66, .38], [-.48, .5], [-.62, .62], [.45, .3], [.62, .2], [.7, .48],
      ].map(([px, py], index) => <Rect key={index} x={px * radius} y={py * radius} width={radius * 0.1} height={radius * 0.1} fill={index % 3 ? '#f4f4ef' : '#8a8a86'} />)}
      <Line points={[-radius * 0.16, -radius * 0.08, radius * 0.16, -radius * 0.08]} stroke="#111827" strokeWidth={radius * 0.045} />
    </Group>;
  }

  if (design === 'al-rihla') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f8f8f4" />
      {Array.from({ length: 7 }).map((_, index) => {
        const angle = index * (Math.PI * 2 / 7) - 0.5;
        return <Line key={index} points={[Math.cos(angle) * radius * 0.16, Math.sin(angle) * radius * 0.16, Math.cos(angle - 0.18) * radius * 0.94, Math.sin(angle - 0.18) * radius * 0.94]} stroke="#d2d6d8" strokeWidth={radius * 0.035} />;
      })}
      <Line points={[-radius * 0.96, -radius * 0.55, -radius * 0.18, -radius * 0.22, radius * 0.32, -radius * 0.72]} closed fill="#e33942" opacity={0.94} />
      <Line points={[-radius * 0.62, -radius * 0.82, -radius * 0.08, -radius * 0.28, radius * 0.04, -radius * 0.88]} closed fill="#143d80" />
      <Line points={[radius * 0.12, -radius * 0.86, radius * 0.28, -radius * 0.2, radius * 0.9, -radius * 0.58]} closed fill="#17a5c7" />
      <Line points={[-radius * 0.9, radius * 0.08, -radius * 0.12, radius * 0.28, -radius * 0.62, radius * 0.72]} closed fill="#f1b82d" />
      <Line points={[radius * 0.02, radius * 0.18, radius * 0.82, radius * 0.02, radius * 0.58, radius * 0.72]} closed fill="#db3344" />
      <Line points={[-radius * 0.34, radius * 0.5, radius * 0.08, radius * 0.16, radius * 0.34, radius * 0.88]} closed fill="#285eb5" />
      <Line points={[-radius * 0.12, -radius * 0.08, radius * 0.12, -radius * 0.08]} stroke="#111827" strokeWidth={radius * 0.04} />
    </Group>;
  }

  if (design === 'premier-league') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f7f8f5" />
      <Line points={[-radius, -radius * 0.55, -radius * 0.16, -radius * 0.18, radius * 0.1, -radius * 0.78, radius, -radius * 0.46]} tension={0.42} stroke="#24114f" strokeWidth={radius * 0.24} lineCap="round" />
      <Line points={[-radius, radius * 0.5, -radius * 0.18, radius * 0.14, radius * 0.14, radius * 0.72, radius, radius * 0.38]} tension={0.42} stroke="#24114f" strokeWidth={radius * 0.24} lineCap="round" />
      <Line points={[-radius * 0.55, -radius, -radius * 0.1, -radius * 0.12, -radius * 0.62, radius]} tension={0.42} stroke="#00c6b7" strokeWidth={radius * 0.1} lineCap="round" />
      <Line points={[radius * 0.52, -radius, radius * 0.12, -radius * 0.08, radius * 0.62, radius]} tension={0.42} stroke="#ff3f8e" strokeWidth={radius * 0.09} lineCap="round" />
      <Circle radius={radius * 0.14} fill="#7c3aed" />
    </Group>;
  }

  if (design === 'trionda26') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f8f7f2" />
      <Line points={[-radius * 1.04, -radius * 0.6, -radius * 0.38, -radius * 0.84, -radius * 0.04, -radius * 0.24, -radius * 0.62, radius * 0.02]} closed fill="#cf3038" />
      <Line points={[-radius * 0.82, -radius * 0.62, -radius * 0.46, -radius * 0.7, -radius * 0.2, -radius * 0.26, -radius * 0.5, -radius * 0.08]} closed stroke="#ffffff" strokeWidth={radius * 0.06} />
      <Line points={[radius * 0.12, -radius * 0.92, radius * 0.88, -radius * 0.7, radius * 0.6, -radius * 0.06, radius * 0.02, -radius * 0.26]} closed fill="#2872a9" />
      <Line points={[radius * 0.28, -radius * 0.68, radius * 0.68, -radius * 0.56, radius * 0.5, -radius * 0.2]} stroke="#ffffff" strokeWidth={radius * 0.06} lineCap="round" />
      <Line points={[radius * 0.24, radius * 0.04, radius * 0.98, radius * 0.02, radius * 0.76, radius * 0.74, radius * 0.12, radius * 0.64]} closed fill="#237f53" />
      <Line points={[radius * 0.42, radius * 0.2, radius * 0.78, radius * 0.18, radius * 0.64, radius * 0.52]} stroke="#ffffff" strokeWidth={radius * 0.06} lineCap="round" />
      <Line points={[-radius * 0.82, radius * 0.22, -radius * 0.18, radius * 0.12, radius * 0.02, radius * 0.72, -radius * 0.56, radius * 0.96]} closed fill="#503b79" opacity={0.92} />
      <Line points={[-radius * 0.52, radius * 0.38, -radius * 0.22, radius * 0.3, -radius * 0.12, radius * 0.62]} stroke="#ffffff" strokeWidth={radius * 0.055} lineCap="round" />
      <Circle x={-radius * 0.04} y={-radius * 0.02} radius={radius * 0.1} fill="#f2bf34" stroke="#ffffff" strokeWidth={radius * 0.035} />
    </Group>;
  }

  if (design === 'laliga') {
    return <Group clipFunc={clip}>
      <Circle radius={radius} fill="#f8f8f5" />
      {Array.from({ length: 6 }).map((_, index) => {
        const angle = index * Math.PI / 3;
        return <Line key={index} points={[Math.cos(angle) * radius * 0.12, Math.sin(angle) * radius * 0.12, Math.cos(angle - 0.2) * radius * 0.92, Math.sin(angle - 0.2) * radius * 0.92]} stroke="#111827" strokeWidth={radius * 0.16} lineCap="round" />;
      })}
      <Line points={[-radius, -radius * 0.55, -radius * 0.1, -radius * 0.14, radius, -radius * 0.48]} tension={0.45} stroke="#f97316" strokeWidth={radius * 0.1} lineCap="round" />
      <Line points={[-radius, radius * 0.5, -radius * 0.08, radius * 0.12, radius, radius * 0.42]} tension={0.45} stroke="#ec4899" strokeWidth={radius * 0.09} lineCap="round" />
      <Line points={[-radius * 0.5, -radius, radius * 0.08, -radius * 0.08, radius * 0.5, radius]} tension={0.45} stroke="#7c3aed" strokeWidth={radius * 0.08} lineCap="round" />
      <Circle radius={radius * 0.15} fill="#ffffff" stroke="#111827" strokeWidth={radius * 0.06} />
    </Group>;
  }

  return <Group clipFunc={clip}>
    <Circle radius={radius} fill="#ffffff" />
    <Line points={polygonPoints(radius * 0.38, 5)} closed fill="#111827" />
    {Array.from({ length: 5 }).map((_, index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 5);
      const px = Math.cos(angle) * radius * 0.72;
      const py = Math.sin(angle) * radius * 0.72;
      return <Line key={index} x={px} y={py} points={polygonPoints(radius * 0.24, 5, angle)} closed fill="#111827" opacity={0.92} />;
    })}
    {Array.from({ length: 5 }).map((_, index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 5);
      return <Line key={index} points={[Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35, Math.cos(angle) * radius * 0.62, Math.sin(angle) * radius * 0.62]} stroke="#111827" strokeWidth={1.1} opacity={0.5} />;
    })}
  </Group>;
}

const BallMarker = memo(function BallMarker({ ball, mapper }: { ball: Ball; mapper: Mapper }) {
  const selected = useTacticsStore(state => state.selectedIds.includes('ball'));
  const playing = useTacticsStore(state => state.playing);
  const [x, y] = mapper.toAbs(ball.x, ball.y);
  const radius = ball.size / 2 + 0.5;
  return <Group id="ball-node" x={x} y={y} listening={false}>
    <BallSkin radius={radius} design={ball.design ?? 'classic'} />
    <Circle radius={radius + 0.55} stroke="#ffffff" strokeWidth={1} opacity={0.96} />
    {!playing && selected && <Circle radius={radius + 2.3} stroke="#ffffff" strokeWidth={1.6} opacity={1} />}
  </Group>;
});

function shortenLine(points: number[], amount: number) {
  const sx = points[0];
  const sy = points[1];
  const ex = points[points.length - 2];
  const ey = points[points.length - 1];
  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.hypot(dx, dy) || 1;
  return [ex - (dx / length) * amount, ey - (dy / length) * amount];
}

function movementCurvePoints(drawing: Drawing, mapper: Mapper) {
  const points = drawing.points;
  const start = mapper.toAbs(points[0], points[1]);
  const end = mapper.toAbs(points[points.length - 2], points[points.length - 1]);
  if (points.length >= 6) return [start, mapper.toAbs(points[2], points[3]), end] as const;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  const curve = drawing.type === 'long-pass' ? length * 0.16 : 0;
  return [start, [(start[0] + end[0]) / 2 - (dy / length) * curve, (start[1] + end[1]) / 2 + (dx / length) * curve] as [number, number], end] as const;
}

function drawingWithControlPoint(drawing: Drawing, x: number, y: number) {
  if (drawing.points.length >= 6) {
    const points = drawing.points.slice();
    points[2] = x;
    points[3] = y;
    return points;
  }
  return [drawing.points[0], drawing.points[1], x, y, drawing.points[2], drawing.points[3]];
}

function squigglePoints(drawing: Drawing, mapper: Mapper) {
  const [start, control, end] = movementCurvePoints(drawing, mapper);
  const length = Math.hypot(control[0] - start[0], control[1] - start[1]) + Math.hypot(end[0] - control[0], end[1] - control[1]) || 1;
  const waves = Math.max(4, Math.round(length / 46));
  const tMax = Math.max(0.08, 1 - 24 / length);
  const output: number[] = [];
  for (let i = 0; i <= waves * 8; i += 1) {
    const t = (i / (waves * 8)) * tMax;
    const inverse = 1 - t;
    const x = inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0];
    const y = inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1];
    const tangentX = 2 * inverse * (control[0] - start[0]) + 2 * t * (end[0] - control[0]);
    const tangentY = 2 * inverse * (control[1] - start[1]) + 2 * t * (end[1] - control[1]);
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    const amp = Math.sin(t * Math.PI * waves * 2) * 8;
    output.push(x - (tangentY / tangentLength) * amp, y + (tangentX / tangentLength) * amp);
  }
  return output;
}

type PatternBounds = { minX: number; minY: number; maxX: number; maxY: number };

function AreaPatternGraphic({ drawing, bounds, clipFunc, pattern, center, opacityScale = 1 }: { drawing: Drawing; bounds: PatternBounds; clipFunc: (ctx: Konva.Context) => void; pattern: FillPattern; center?: [number, number]; opacityScale?: number }) {
  if (pattern === 'none') return null;
  const color = drawing.stripeColor ?? '#ffffff';
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const centerX = center?.[0] ?? bounds.minX + width / 2;
  const centerY = center?.[1] ?? bounds.minY + height / 2;
  const spacing = 28;
  const stripeSpacing = 18;

  if (pattern === 'question') {
    const size = Math.min(38, Math.max(14, Math.min(width, height) * 0.16));
    return <Group clipFunc={clipFunc} opacity={opacityScale}>
      <Circle x={centerX} y={centerY} radius={size} fill="#4338ca" stroke="#c7d2fe" strokeWidth={Math.max(3, size * 0.08)} shadowColor="#312e81" shadowBlur={12} shadowOpacity={0.52} shadowOffsetY={3} />
      <Text x={centerX - size} y={centerY - size * 0.82} width={size * 2} height={size * 1.62} align="center" verticalAlign="middle" text="?" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontSize={size * 1.18} fontStyle="bold" />
    </Group>;
  }

  if (pattern === 'hazard') {
    const size = Math.min(38, Math.max(14, Math.min(width, height) * 0.16));
    return <Group clipFunc={clipFunc} opacity={opacityScale}>
      <Line points={[centerX, centerY - size, centerX - size * 0.92, centerY + size * 0.72, centerX + size * 0.92, centerY + size * 0.72]} closed fill="#facc15" stroke="#b45309" strokeWidth={Math.max(3.5, size * 0.1)} lineJoin="round" shadowColor="#78350f" shadowBlur={12} shadowOpacity={0.48} shadowOffsetY={3} />
      <Line points={[centerX, centerY - size * 0.42, centerX, centerY + size * 0.13]} stroke="#7c2d12" strokeWidth={Math.max(4, size * 0.13)} lineCap="round" />
      <Line points={[centerX, centerY + size * 0.38, centerX, centerY + size * 0.43]} stroke="#7c2d12" strokeWidth={Math.max(4, size * 0.13)} lineCap="round" />
    </Group>;
  }

  if (pattern === 'sad-face') {
    const size = Math.min(38, Math.max(14, Math.min(width, height) * 0.16));
    return <Group clipFunc={clipFunc} opacity={opacityScale}>
      <Circle x={centerX} y={centerY} radius={size} fill="#fb7185" stroke="#ffe4e6" strokeWidth={Math.max(3, size * 0.08)} shadowColor="#9f1239" shadowBlur={12} shadowOpacity={0.48} shadowOffsetY={3} />
      <Line points={[centerX - size * 0.43, centerY - size * 0.16, centerX - size * 0.24, centerY - size * 0.24]} stroke="#4c0519" strokeWidth={Math.max(3, size * 0.085)} lineCap="round" />
      <Line points={[centerX + size * 0.24, centerY - size * 0.24, centerX + size * 0.43, centerY - size * 0.16]} stroke="#4c0519" strokeWidth={Math.max(3, size * 0.085)} lineCap="round" />
      <Line points={[centerX - size * 0.42, centerY + size * 0.5, centerX, centerY + size * 0.27, centerX + size * 0.42, centerY + size * 0.5]} stroke="#4c0519" strokeWidth={Math.max(3.5, size * 0.1)} lineCap="round" lineJoin="round" tension={0.65} />
    </Group>;
  }

  const count = Math.ceil((width + height) / spacing) + 2;
  return <Group clipFunc={clipFunc} opacity={0.26 * opacityScale}>
    {pattern === 'vertical' && Array.from({ length: Math.ceil(width / stripeSpacing) + 1 }).map((_, index) => <Line key={index} points={[bounds.minX + index * stripeSpacing, bounds.minY, bounds.minX + index * stripeSpacing, bounds.maxY]} stroke={color} strokeWidth={3.5} />)}
    {pattern === 'horizontal' && Array.from({ length: Math.ceil(height / stripeSpacing) + 1 }).map((_, index) => <Line key={index} points={[bounds.minX, bounds.minY + index * stripeSpacing, bounds.maxX, bounds.minY + index * stripeSpacing]} stroke={color} strokeWidth={3.5} />)}
    {pattern === 'diagonal' && Array.from({ length: count }).map((_, index) => {
      const offset = index * spacing - height;
      return <Line key={index} points={[bounds.minX + offset, bounds.maxY, bounds.minX + offset + height, bounds.minY]} stroke={color} strokeWidth={7} />;
    })}
  </Group>;
}

function AreaPattern({ drawing, bounds, clipFunc, center }: { drawing: PlaybackDrawing; bounds: PatternBounds; clipFunc: (ctx: Konva.Context) => void; center?: [number, number] }) {
  const pattern = drawing.fillPattern ?? 'diagonal';
  const previousPattern = drawing.transitionFromFillPattern;
  const transition = clampRange(drawing.fillPatternTransition ?? 1, 0, 1);
  if (!previousPattern || previousPattern === pattern || transition >= 1) {
    return <AreaPatternGraphic drawing={drawing} bounds={bounds} clipFunc={clipFunc} pattern={pattern} center={center} />;
  }
  return <>
    <AreaPatternGraphic drawing={drawing} bounds={bounds} clipFunc={clipFunc} pattern={previousPattern} center={center} opacityScale={1 - transition} />
    <AreaPatternGraphic drawing={drawing} bounds={bounds} clipFunc={clipFunc} pattern={pattern} center={center} opacityScale={transition} />
  </>;
}

function polygonCentroid(points: number[]): [number, number] {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 2) {
    const next = (index + 2) % points.length;
    const cross = points[index] * points[next + 1] - points[next] * points[index + 1];
    twiceArea += cross;
    x += (points[index] + points[next]) * cross;
    y += (points[index + 1] + points[next + 1]) * cross;
  }
  if (Math.abs(twiceArea) < 0.0001) {
    const xs = points.filter((_, index) => index % 2 === 0);
    const ys = points.filter((_, index) => index % 2 === 1);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function MannequinFigure({ x, y, width, height, fill, stroke }: { x: number; y: number; width: number; height: number; fill: string; stroke: string }) {
  const frameColor = fill || '#facc15';
  const outlineColor = stroke || '#ca8a04';
  const torsoWidth = width * 0.78;
  const torsoHeight = height * 0.29;
  const torsoTop = y - height * 0.23;
  const torsoBottom = torsoTop + torsoHeight;
  const loopY = torsoTop - height * 0.13;
  const loopRadius = Math.max(4.5, width * 0.17);
  const poleBottom = y + height * 0.43;
  const baseWidth = width * 0.86;
  const holeColumns = 6;
  const holeRows = 5;
  return <Group>
    <Circle x={x} y={loopY} radius={loopRadius} scaleY={1.28} fill="rgba(0,0,0,0)" stroke={frameColor} strokeWidth={Math.max(3, width * 0.11)} shadowColor="#713f12" shadowBlur={3} shadowOpacity={0.2} />
    <Rect x={x - torsoWidth / 2} y={torsoTop} width={torsoWidth} height={torsoHeight} fill={frameColor} stroke={outlineColor} strokeWidth={1.1} cornerRadius={Math.max(3, width * 0.09)} shadowColor="#713f12" shadowBlur={4} shadowOpacity={0.18} />
    {Array.from({ length: holeColumns * holeRows }).map((_, index) => {
      const column = index % holeColumns;
      const row = Math.floor(index / holeColumns);
      return <Circle
        key={index}
        x={x - torsoWidth * 0.34 + column * (torsoWidth * 0.136)}
        y={torsoTop + torsoHeight * 0.2 + row * (torsoHeight * 0.15)}
        radius={Math.max(0.65, width * 0.018)}
        fill="#8a6500"
        opacity={0.5}
      />;
    })}
    {[-0.29, 0, 0.29].map((offset, index) => <Line
      key={index}
      points={[x + torsoWidth * offset, torsoBottom, x + baseWidth * offset * 0.92, poleBottom]}
      stroke={frameColor}
      strokeWidth={Math.max(2.2, width * 0.07)}
      lineCap="round"
      shadowColor="#713f12"
      shadowBlur={2}
      shadowOpacity={0.16}
    />)}
    <Rect x={x - baseWidth / 2} y={poleBottom - 1} width={baseWidth} height={Math.max(5, height * 0.055)} fill="#111827" cornerRadius={2} shadowColor="#020617" shadowBlur={3} shadowOpacity={0.32} />
  </Group>;
}

function DrawingShape({ drawing, mapper, interactive = true }: { drawing: PlaybackDrawing; mapper: Mapper; interactive?: boolean }) {
  const selectedIds = useTacticsStore(state => state.selectedIds);
  const pitchLineColor = useTacticsStore(state => state.project.settings.lineColor);
  const pitchLineWidth = useTacticsStore(state => state.project.settings.lineThickness);
  const selected = interactive && selectedIds.includes(drawing.id);
  const transitionVisibility = drawing.transitionVisibility ?? 1;
  const stageManaged = drawing.type === 'zone' || drawing.type === 'circle-zone' || drawing.type === 'polygon-zone';
  if (drawing.hidden) return null;
  const interactionProps = { name: 'board-item', listening: interactive && !stageManaged };
  const selectionStroke = '#2563eb';
  const stroke = drawing.color;
  const curvePoints = drawing.type === 'arrow' || drawing.type === 'long-pass' || drawing.type === 'curve'
    ? movementCurvePoints(drawing, mapper)
    : undefined;
  if (drawing.type === 'zone') {
    const [x, y, zoneWidth, zoneHeight] = drawing.points;
    const [absX, absY] = mapper.toAbs(x, y);
    const [absX2, absY2] = mapper.toAbs(x + zoneWidth, y + zoneHeight);
    const rx = Math.min(absX, absX2);
    const ry = Math.min(absY, absY2);
    const absWidth = Math.abs(absX2 - absX);
    const absHeight = Math.abs(absY2 - absY);
    const bounds = { minX: 0, minY: 0, maxX: absWidth, maxY: absHeight };
    return <>
      <Group id={`area-node-${drawing.id}`} x={rx} y={ry} opacity={transitionVisibility} {...interactionProps}>
        <Group key="area-visual" id={`area-visual-${drawing.id}`} listening={false}>
          <Rect width={absWidth} height={absHeight} fill={drawing.fill ?? drawing.color} cornerRadius={10} shadowBlur={10} shadowColor={drawing.fill ?? drawing.color} shadowOpacity={0.22} opacity={Math.max(0.08, drawing.opacity * 0.82)} />
          <AreaPattern drawing={drawing} bounds={bounds} clipFunc={ctx => { ctx.beginPath(); ctx.rect(0, 0, absWidth, absHeight); ctx.closePath(); }} />
          {selected && <Rect x={-2} y={-2} width={absWidth + 4} height={absHeight + 4} stroke={selectionStroke} strokeWidth={1.5} opacity={0.5} dash={[7, 6]} cornerRadius={12} />}
          <Rect width={absWidth} height={absHeight} stroke={stroke} strokeWidth={drawing.strokeWidth} opacity={Math.max(0.72, drawing.opacity)} dash={drawing.dashed ? [14, 10] : undefined} cornerRadius={10} />
        </Group>
      </Group>
    </>;
  }

  const start = mapper.toAbs(drawing.points[0], drawing.points[1]);
  if (drawing.type === 'circle-zone') {
    const edge = mapper.toAbs(drawing.points[2], drawing.points[3]);
    const centerX = (start[0] + edge[0]) / 2;
    const centerY = (start[1] + edge[1]) / 2;
    const radius = Math.max(8, Math.hypot(edge[0] - start[0], edge[1] - start[1]) / 2);
    const bounds = { minX: -radius, minY: -radius, maxX: radius, maxY: radius };
    return <>
      <Group id={`area-node-${drawing.id}`} x={centerX} y={centerY} opacity={transitionVisibility} {...interactionProps}>
        <Group key="area-visual" id={`area-visual-${drawing.id}`} listening={false}>
          <Circle radius={radius} fill={drawing.fill ?? drawing.color} opacity={Math.max(0.08, drawing.opacity * 0.82)} shadowBlur={9} shadowColor={drawing.fill ?? drawing.color} shadowOpacity={0.2} />
          <AreaPattern drawing={drawing} bounds={bounds} clipFunc={ctx => { ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.closePath(); }} />
          {selected && <Circle radius={radius + 2} stroke={selectionStroke} strokeWidth={1.5} opacity={0.5} dash={[7, 6]} />}
          <Circle radius={radius} stroke={stroke} strokeWidth={drawing.strokeWidth} opacity={Math.max(0.72, drawing.opacity)} dash={drawing.dashed ? [14, 10] : undefined} />
        </Group>
      </Group>
    </>;
  }

  if (drawing.type === 'goal-big' || drawing.type === 'goal-small') {
    const end = mapper.toAbs(drawing.points[2], drawing.points[3]);
    const centerX = (start[0] + end[0]) / 2;
    const centerY = (start[1] + end[1]) / 2;
    const width = Math.max(drawing.type === 'goal-big' ? 42 : 28, Math.abs(end[0] - start[0]));
    const height = Math.max(drawing.type === 'goal-big' ? 25 : 17, Math.abs(end[1] - start[1]));
    const gridSize = drawing.type === 'goal-big' ? 13 : 9;
    const propStroke = pitchLineColor;
    const frameWidth = pitchLineWidth;
    return <Group x={centerX} y={centerY} rotation={drawing.rotation ?? 0} {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
      <Rect x={-width / 2 - 10} y={-height / 2 - 10} width={width + 20} height={height + 24} fill="rgba(255,255,255,.001)" cornerRadius={6} />
      <Rect x={-width / 2} y={-height / 2} width={width} height={height} stroke={propStroke} strokeWidth={frameWidth} cornerRadius={2} />
      {Array.from({ length: Math.floor(width / gridSize) }).map((_, index) => <Line key={`v-${index}`} points={[-width / 2 + (index + 1) * gridSize, -height / 2, -width / 2 + (index + 1) * gridSize, height / 2]} stroke={propStroke} strokeWidth={Math.max(0.7, frameWidth * 0.45)} opacity={0.62} />)}
      {Array.from({ length: Math.floor(height / gridSize) }).map((_, index) => <Line key={`h-${index}`} points={[-width / 2, -height / 2 + (index + 1) * gridSize, width / 2, -height / 2 + (index + 1) * gridSize]} stroke={propStroke} strokeWidth={Math.max(0.7, frameWidth * 0.45)} opacity={0.62} />)}
      <Line points={[-width / 2, height / 2, -width * 0.42, height * 0.68, width * 0.42, height * 0.68, width / 2, height / 2]} stroke={propStroke} strokeWidth={frameWidth} lineJoin="round" />
      {selected && <Rect x={-width / 2 - 5} y={-height / 2 - 5} width={width + 10} height={height + 10} stroke={selectionStroke} strokeWidth={1.6} dash={[6, 5]} cornerRadius={4} />}
    </Group>;
  }

  if (drawing.type === 'cone-small' || drawing.type === 'cone-big') {
    const end = mapper.toAbs(drawing.points[2], drawing.points[3]);
    const radius = Math.max(drawing.type === 'cone-big' ? 7 : 4, Math.min(13, Math.hypot(end[0] - start[0], end[1] - start[1])));
    const coneFill = drawing.fill ?? '#f97316';
    const propStroke = '#9a3412';
    return <Group x={start[0]} y={start[1]} {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
      <Circle radius={Math.max(17, radius * 2)} fill="rgba(255,255,255,.001)" />
      {drawing.type === 'cone-small' ? <>
        <Circle radius={radius * 0.82} scaleY={0.72} fill={coneFill} stroke={propStroke} strokeWidth={0.8} />
        <Circle radius={Math.max(0.75, radius * 0.15)} fill="#fff7ed" stroke={propStroke} strokeWidth={0.55} />
      </> : <>
        <Rect x={-radius * 0.72} y={radius * 0.7} width={radius * 1.44} height={Math.max(2.5, radius * 0.28)} fill={coneFill} stroke={propStroke} strokeWidth={1} cornerRadius={1} />
        <Line points={[0, -radius * 1.55, -radius * 0.48, radius * 0.7, radius * 0.48, radius * 0.7]} closed fill={coneFill} stroke={propStroke} strokeWidth={1} lineJoin="round" />
        <Line points={[-radius * 0.31, -radius * 0.05, radius * 0.31, -radius * 0.05]} stroke="#fff7ed" strokeWidth={Math.max(1.5, radius * 0.2)} />
      </>}
      {selected && <Circle radius={radius * 1.85} stroke={selectionStroke} strokeWidth={1.4} dash={[5, 4]} />}
    </Group>;
  }

  if (drawing.type === 'mannequin' || drawing.type === 'mannequin-three') {
    const end = mapper.toAbs(drawing.points[2], drawing.points[3]);
    const centerX = (start[0] + end[0]) / 2;
    const centerY = (start[1] + end[1]) / 2;
    const width = Math.max(drawing.type === 'mannequin-three' ? 68 : 23, Math.abs(end[0] - start[0]));
    const height = Math.max(54, Math.abs(end[1] - start[1]));
    const figureWidth = drawing.type === 'mannequin-three' ? width * 0.31 : width;
    const offsets = drawing.type === 'mannequin-three' ? [-width * 0.33, 0, width * 0.33] : [0];
    const fill = drawing.fill ?? '#facc15';
    const propStroke = drawing.color || '#713f12';
    return <Group x={centerX} y={centerY} rotation={drawing.rotation ?? 0} {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
      <Rect x={-width / 2 - 8} y={-height / 2 - 8} width={width + 16} height={height + 16} fill="#ffffff" opacity={0.01} />
      {offsets.map((offset, index) => <MannequinFigure key={index} x={offset} y={0} width={figureWidth} height={height} fill={fill} stroke={propStroke} />)}
      {selected && <Rect x={-width / 2 - 6} y={-height / 2 - 8} width={width + 12} height={height + 16} stroke={selectionStroke} strokeWidth={1.6} dash={[6, 5]} cornerRadius={5} />}
    </Group>;
  }

  if (drawing.type === 'polygon-zone') {
    const points = drawing.points.flatMap((point, index, all) => index % 2 === 0 ? mapper.toAbs(point, all[index + 1]) : []);
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const localPoints = points.map((point, index) => point - (index % 2 === 0 ? minX : minY));
    const bounds = { minX: 0, minY: 0, maxX: maxX - minX, maxY: maxY - minY };
    const contentCenter = polygonCentroid(localPoints);
    const clipFunc = (ctx: Konva.Context) => {
      ctx.beginPath();
      for (let index = 0; index < localPoints.length; index += 2) {
        if (index === 0) ctx.moveTo(localPoints[index], localPoints[index + 1]);
        else ctx.lineTo(localPoints[index], localPoints[index + 1]);
      }
      ctx.closePath();
    };
    return <>
      <Group id={`area-node-${drawing.id}`} x={minX} y={minY} opacity={transitionVisibility} {...interactionProps}>
        <Group key="area-visual" id={`area-visual-${drawing.id}`} listening={false}>
          <Line points={localPoints} closed fill={drawing.fill ?? drawing.color} opacity={Math.max(0.08, drawing.opacity)} lineJoin="round" shadowBlur={10} shadowColor={drawing.fill ?? drawing.color} shadowOpacity={0.2} />
          <AreaPattern drawing={drawing} bounds={bounds} clipFunc={clipFunc} center={contentCenter} />
          {selected && <Line points={localPoints} closed stroke={selectionStroke} strokeWidth={drawing.strokeWidth + 3} opacity={0.38} dash={[7, 6]} lineJoin="round" />}
          <Line points={localPoints} closed stroke={stroke} strokeWidth={drawing.strokeWidth} opacity={Math.max(0.72, drawing.opacity)} dash={drawing.dashed ? [14, 10] : undefined} lineJoin="round" />
        </Group>
      </Group>
    </>;
  }

  if (drawing.type === 'text') {
    const text = drawing.text ?? 'Text';
    const textWidth = Math.max(88, text.length * 17);
    return <Group x={start[0]} y={start[1]} {...interactionProps} opacity={transitionVisibility}>
      <Rect x={-12} y={-9} width={textWidth + 12} height={48} fill="#ffffff" opacity={drawing.opacity} stroke={selected ? selectionStroke : '#d7e5f6'} strokeWidth={1.5} cornerRadius={8} />
      <Text text={text} fill={drawing.color} fontFamily="Inter, Arial, sans-serif" fontSize={28} fontStyle="bold" shadowBlur={5} shadowColor="#ffffff" />
    </Group>;
  }

  if (drawing.type === 'curve') {
    const points = squigglePoints(drawing, mapper);
    const end = curvePoints?.[2] ?? mapper.toAbs(drawing.points[drawing.points.length - 2], drawing.points[drawing.points.length - 1]);
    const lineEnd = [points[points.length - 2], points[points.length - 1]];
    return <Group {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
        <Line points={points} lineCap="round" lineJoin="round" stroke="#ffffff" strokeWidth={drawing.strokeWidth + 34} opacity={0.01} />
        {selected && <Line points={points} lineCap="round" lineJoin="round" stroke={selectionStroke} strokeWidth={drawing.strokeWidth + 6} dash={[9, 11]} opacity={0.42} />}
        <Line points={points} lineCap="round" lineJoin="round" stroke={stroke} strokeWidth={drawing.strokeWidth} dash={[9, 11]} shadowBlur={7} shadowColor={drawing.color} />
        {selected && <Arrow points={[lineEnd[0], lineEnd[1], end[0], end[1]]} pointerLength={12} pointerWidth={12} stroke={selectionStroke} fill={selectionStroke} strokeWidth={drawing.strokeWidth + 5} opacity={0.42} />}
        <Arrow points={[lineEnd[0], lineEnd[1], end[0], end[1]]} pointerLength={9} pointerWidth={9} stroke={stroke} fill={stroke} strokeWidth={drawing.strokeWidth} />
    </Group>;
  }

  const end = mapper.toAbs(drawing.points[drawing.points.length - 2], drawing.points[drawing.points.length - 1]);
  if (drawing.type === 'line') {
    const shortened = shortenLine([start[0], start[1], end[0], end[1]], 12);
    return <Group {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
      <Line points={[start[0], start[1], end[0], end[1]]} stroke="#ffffff" strokeWidth={drawing.strokeWidth + 30} opacity={0.01} />
      {selected && <Arrow points={[start[0], start[1], shortened[0], shortened[1], end[0], end[1]]} pointerLength={15} pointerWidth={15} lineCap="round" stroke={selectionStroke} fill={selectionStroke} strokeWidth={drawing.strokeWidth + 6} dash={[16, 11]} opacity={0.42} />}
      <Arrow points={[start[0], start[1], shortened[0], shortened[1], end[0], end[1]]} pointerLength={12} pointerWidth={12} lineCap="round" stroke={stroke} fill={stroke} strokeWidth={drawing.strokeWidth} dash={[16, 11]} shadowBlur={5} shadowColor={drawing.color} />
    </Group>;
  }
  if (drawing.type === 'long-pass') {
    const path = curvePoints?.flatMap(point => point) ?? [start[0], start[1], end[0], end[1]];
    return <Group {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
        <Line points={path} tension={0.45} lineCap="round" lineJoin="round" stroke="#ffffff" strokeWidth={drawing.strokeWidth + 34} opacity={0.01} />
        <Arrow x={5} y={7} points={path} pointerLength={10} pointerWidth={10} tension={0.45} lineCap="round" lineJoin="round" stroke={drawing.color} fill={drawing.color} strokeWidth={drawing.strokeWidth + 1} opacity={0.13} shadowBlur={7} shadowColor={drawing.color} />
        {selected && <Arrow points={path} pointerLength={16} pointerWidth={16} tension={0.45} lineCap="round" lineJoin="round" stroke={selectionStroke} fill={selectionStroke} strokeWidth={drawing.strokeWidth + 6} opacity={0.42} />}
        <Arrow points={path} pointerLength={13} pointerWidth={13} tension={0.45} lineCap="round" lineJoin="round" stroke={stroke} fill={stroke} strokeWidth={drawing.strokeWidth} shadowBlur={10} shadowColor={drawing.color} shadowOpacity={0.55} />
    </Group>;
  }

  const path = curvePoints?.flatMap(point => point) ?? [start[0], start[1], end[0], end[1]];
  return <Group {...interactionProps} opacity={drawing.opacity * transitionVisibility}>
      <Line points={path} tension={0.45} stroke="#ffffff" strokeWidth={drawing.strokeWidth + 34} opacity={0.01} />
      {selected && <Arrow points={path} tension={0.45} pointerLength={17} pointerWidth={17} lineCap="round" lineJoin="round" stroke={selectionStroke} fill={selectionStroke} strokeWidth={drawing.strokeWidth + 6} opacity={0.42} />}
      <Arrow points={path} tension={0.45} pointerLength={14} pointerWidth={14} lineCap="round" lineJoin="round" stroke={stroke} fill={stroke} strokeWidth={drawing.strokeWidth} dash={drawing.dashed ? [16, 10] : undefined} shadowBlur={8} shadowColor={drawing.color} />
  </Group>;
}

function buildDrawing(tool: string, start: number[], end: number[], style: ToolStyle, drawingId: string = crypto.randomUUID()): Drawing {
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const defaultSize = tool === 'goal-big' ? [0.12, 0.045]
    : tool === 'goal-small' ? [0.072, 0.03]
      : tool === 'cone-big' ? [0.009, 0.009]
        : tool === 'cone-small' ? [0.0048, 0.0048]
          : tool === 'mannequin' ? [0.02, 0.035]
            : tool === 'mannequin-three' ? [0.065, 0.035]
          : undefined;
  const usesDefaultSize = Boolean(defaultSize && distance < 0.006);
  const adjustedStart = usesDefaultSize && defaultSize
    ? [clampRange(start[0], 0, 1 - defaultSize[0]), clampRange(start[1], 0, 1 - defaultSize[1])]
    : start;
  const adjustedEnd = usesDefaultSize && defaultSize
    ? [adjustedStart[0] + defaultSize[0], adjustedStart[1] + defaultSize[1]]
    : end;
  const zoneX = Math.min(adjustedStart[0], adjustedEnd[0]);
  const zoneY = Math.min(adjustedStart[1], adjustedEnd[1]);
  const zoneW = Math.abs(adjustedEnd[0] - adjustedStart[0]);
  const zoneH = Math.abs(adjustedEnd[1] - adjustedStart[1]);
  const type: Drawing['type'] = tool === 'zone' ? 'zone'
    : tool === 'circle-zone' ? 'circle-zone'
      : tool === 'text' ? 'text'
        : tool === 'run' ? 'curve'
          : tool === 'long-pass' ? 'long-pass'
            : tool === 'goal-big' || tool === 'goal-small' || tool === 'cone-small' || tool === 'cone-big' || tool === 'mannequin' || tool === 'mannequin-three' ? tool
              : 'arrow';
  const isCone = tool === 'cone-small' || tool === 'cone-big';
  const isGoal = tool === 'goal-small' || tool === 'goal-big';
  const isMannequin = tool === 'mannequin' || tool === 'mannequin-three';
  return {
    id: drawingId,
    type,
    points: tool === 'zone' ? [zoneX, zoneY, zoneW, zoneH] : tool === 'text' ? [start[0], start[1]] : [adjustedStart[0], adjustedStart[1], adjustedEnd[0], adjustedEnd[1]],
    text: tool === 'text' ? 'Text' : undefined,
    color: isGoal ? '#f8fafc' : isMannequin ? '#713f12' : style.color,
    fill: isCone ? '#f97316' : isMannequin ? '#facc15' : style.fill,
    stripeColor: style.stripeColor,
    strokeWidth: style.strokeWidth,
    opacity: tool === 'zone' || tool === 'circle-zone' ? style.opacity : 1,
    dashed: tool === 'run' || tool === 'dashed-line',
    fillPattern: style.fillPattern,
    rotation: isGoal || isMannequin ? 0 : undefined,
    locked: false,
    hidden: false,
    zIndex: 10,
  };
}

function drawingBounds(drawing: Drawing) {
  if (drawing.type === 'zone') {
    const [x, y, width, height] = drawing.points;
    return { x1: x, y1: y, x2: x + width, y2: y + height };
  }
  if (drawing.type === 'circle-zone') {
    const [x, y, edgeX, edgeY] = drawing.points;
    const centerX = (x + edgeX) / 2;
    const centerY = (y + edgeY) / 2;
    const radius = Math.hypot(edgeX - x, edgeY - y) / 2;
    return { x1: centerX - radius, y1: centerY - radius, x2: centerX + radius, y2: centerY + radius };
  }
  const xs = drawing.points.filter((_, i) => i % 2 === 0);
  const ys = drawing.points.filter((_, i) => i % 2 === 1);
  const pad = drawing.type === 'text' ? 0.04 : 0.015;
  return { x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad, x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad };
}

function intersects(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
}

function pointInPolygon(x: number, y: number, points: number[]) {
  let inside = false;
  for (let index = 0, previous = points.length - 2; index < points.length; previous = index, index += 2) {
    const x1 = points[index];
    const y1 = points[index + 1];
    const x2 = points[previous];
    const y2 = points[previous + 1];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1 || 1) + x1) inside = !inside;
  }
  return inside;
}

function pointHitsArea(drawing: Drawing, rel: { x: number; y: number }, mapper: Mapper) {
  if (drawing.hidden) return false;
  const padX = 8 / mapper.pitch.width;
  const padY = 8 / mapper.pitch.height;
  if (drawing.type === 'zone') {
    const [x, y, width, height] = drawing.points;
    return rel.x >= x - padX && rel.x <= x + width + padX && rel.y >= y - padY && rel.y <= y + height + padY;
  }
  if (drawing.type === 'circle-zone') {
    const pointer = mapper.toAbs(rel.x, rel.y);
    const start = mapper.toAbs(drawing.points[0], drawing.points[1]);
    const end = mapper.toAbs(drawing.points[2], drawing.points[3]);
    const centerX = (start[0] + end[0]) / 2;
    const centerY = (start[1] + end[1]) / 2;
    const radius = Math.hypot(end[0] - start[0], end[1] - start[1]) / 2 + 8;
    return Math.hypot(pointer[0] - centerX, pointer[1] - centerY) <= radius;
  }
  return drawing.type === 'polygon-zone' && pointInPolygon(rel.x, rel.y, drawing.points);
}

type BoardDragSession = {
  ids: string[];
  start: { x: number; y: number };
  current: { x: number; y: number };
  fieldPlayers?: FieldPlayerDrag;
  moved: boolean;
  reactPreview: boolean;
  lifted: boolean;
  nodes: { node: Konva.Node; x: number; y: number; parent: Konva.Container | null; index: number }[];
};

function restoreDragNodes(session: BoardDragSession | null, offset = { x: 0, y: 0 }) {
  if (!session) return;
  const layers = new Set<Konva.Layer>();
  session.nodes.slice().sort((a, b) => a.index - b.index).forEach(({ node, x, y, parent, index }) => {
    const layer = node.getLayer();
    if (layer) layers.add(layer);
    // Drawing groups commit movement through their child geometry, whereas
    // players and the ball commit their node position.
    const nodeOffset = node.id().startsWith('drawing-node-') ? { x: 0, y: 0 } : offset;
    node.position({ x: x + nodeOffset.x, y: y + nodeOffset.y });
    if (parent && node.getParent() !== parent) {
      node.moveTo(parent);
      node.zIndex(index);
      const originalLayer = node.getLayer();
      if (originalLayer) layers.add(originalLayer);
    }
  });
  layers.forEach(layer => layer.batchDraw());
}

type BoardDragPreview = {
  ids: string[];
  dx: number;
  dy: number;
};

type CurveDragSession = {
  drawingId: string;
  basePoints: number[];
  current: { x: number; y: number };
};

function previewTranslatedDrawing(drawing: Drawing, dx: number, dy: number) {
  const points = drawing.points.slice();
  if (drawing.type === 'zone') {
    const width = points[2] ?? 0;
    const height = points[3] ?? 0;
    points[0] = clampRange(points[0] + dx, 0, Math.max(0, 1 - width));
    points[1] = clampRange(points[1] + dy, 0, Math.max(0, 1 - height));
    return { ...drawing, points };
  }
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);
  const safeDx = clampRange(dx, -Math.min(...xs), 1 - Math.max(...xs));
  const safeDy = clampRange(dy, -Math.min(...ys), 1 - Math.max(...ys));
  for (let index = 0; index < points.length; index += 2) {
    points[index] += safeDx;
    points[index + 1] += safeDy;
  }
  return { ...drawing, points };
}

export function PitchCanvas({ stageRef, onHome, onOpenVideo }: { stageRef: RefObject<Konva.Stage | null>; onHome?: () => void; onOpenVideo?: () => void }) {
  const { project, selectedIds, tool, toolStyle, viewZoom, dockPosition, dockTab, playbackFrame, playing, addDrawing, placePlayer, select, toggleSelection, setSelection, checkpointHistory, moveSelectedItems, commitDrawingUpdate, setPlayerStarter, setTool, setDockTab, setDockPosition, updateSettings } = useTacticsStore(useShallow(state => ({
    project: state.project,
    selectedIds: state.selectedIds,
    tool: state.tool,
    toolStyle: state.toolStyle,
    viewZoom: state.viewZoom,
    dockPosition: state.dockPosition,
    dockTab: state.dockTab,
    playbackFrame: state.playbackFrame,
    playing: state.playing,
    addDrawing: state.addDrawing,
    placePlayer: state.placePlayer,
    select: state.select,
    toggleSelection: state.toggleSelection,
    setSelection: state.setSelection,
    checkpointHistory: state.checkpointHistory,
    moveSelectedItems: state.moveSelectedItems,
    commitDrawingUpdate: state.commitDrawingUpdate,
    setPlayerStarter: state.setPlayerStarter,
    setTool: state.setTool,
    setDockTab: state.setDockTab,
    setDockPosition: state.setDockPosition,
    updateSettings: state.updateSettings,
  })));
  const [draft, setDraft] = useState<{ id: string; start: number[]; current: number[] } | null>(null);
  const [selection, setSelectionBox] = useState<{ start: number[]; current: number[] } | null>(null);
  const [boardDragPreview, setBoardDragPreview] = useState<BoardDragPreview | null>(null);
  const [curveDrag, setCurveDrag] = useState<CurveDragSession | null>(null);
  const [fieldPlayerDrag, setFieldPlayerDrag] = useState<FieldPlayerDrag | null>(null);
  const [shareDone, setShareDone] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const activePointerRef = useRef<number | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const boardDragFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pendingBoardDragRef = useRef<BoardDragPreview | null>(null);
  const boardDragRef = useRef<BoardDragSession | null>(null);
  const stopPointerTrackingRef = useRef<(() => void) | null>(null);
  const pointerCaptureRef = useRef<HTMLElement | null>(null);
  const dragLayerRef = useRef<Konva.Layer | null>(null);
  const curveDragRef = useRef<CurveDragSession | null>(null);
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const { width, height, format } = project.settings;
  const dark = project.settings.theme === 'dark';
  const touchCanvas = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const compactCanvas = useMediaQuery('(max-width: 640px)');
  const pitchScaleX = project.settings.pitchScaleX ?? 1;
  const pitchScaleY = project.settings.pitchScaleY ?? 1;
  const mapper = useMemo(() => makeMapper(width, height, pitchScaleX, pitchScaleY, format === 'landscape'), [format, height, pitchScaleX, pitchScaleY, width]);
  const scale = useMemo(() => {
    const edgePadding = compactCanvas ? 16 : 40;
    const usableWidth = Math.max(100, size.width - edgePadding);
    const usableHeight = Math.max(100, size.height - edgePadding);
    return Math.max(0.05, Math.min(usableWidth / width, usableHeight / height));
  }, [compactCanvas, height, size.height, size.width, width]);
  const stageScale = useMemo(() => ({ x: scale, y: scale }), [scale]);
  const magnification = viewZoom * boardZoomBaseline(format);
  const displayScale = scale * magnification;
  const canvasPixelRatio = boardCanvasPixelRatio(width * scale, height * scale, magnification, window.devicePixelRatio || 1, touchCanvas);

  useEffect(() => {
    // Zoom stays on the compositor while a slider is moving. Redraw vectors at
    // the displayed resolution once it settles, rather than stretching pixels.
    const timer = setTimeout(() => {
      stageRef.current?.getLayers().forEach(layer => {
        if (Math.abs(layer.getCanvas().getPixelRatio() - canvasPixelRatio) < .01) return;
        layer.getCanvas().setPixelRatio(canvasPixelRatio);
        layer.draw();
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [canvasPixelRatio, stageRef]);

  useEffect(() => {
    const viewport = containerRef.current;
    if (viewport) {
      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
    }
  }, [scale, magnification]);

  const pointerRel = (stage: Konva.Stage, bounded = true) => {
    const p = stage.getPointerPosition() ?? { x: 0, y: 0 };
    const rel = { x: (p.x / scale - mapper.pitch.x) / mapper.pitch.width, y: (p.y / scale - mapper.pitch.y) / mapper.pitch.height };
    return bounded ? { x: clamp01(rel.x), y: clamp01(rel.y) } : rel;
  };
  const canDraw = tool !== 'select';
  const boardInteractive = !canDraw && !playing;
  const playbackBall = playbackFrame?.ball ?? project.ball;
  const displayBall = boardDragPreview?.ids.includes('ball')
    ? { ...playbackBall, x: clamp01(playbackBall.x + boardDragPreview.dx), y: clamp01(playbackBall.y + boardDragPreview.dy) }
    : playbackBall;
  const displayPlayers = project.teams.flatMap(t => t.squad).map(player => {
    const playbackPosition = playbackFrame?.playerPositions[player.id];
    const displayed = playbackPosition ? { ...player, ...playbackPosition } : player;
    if (!boardDragPreview?.ids.includes(player.id)) return displayed;
    return {
      ...displayed,
      x: clamp01(displayed.x + boardDragPreview.dx),
      y: clamp01(displayed.y + boardDragPreview.dy),
    };
  }).sort((a, b) => a.zIndex - b.zIndex);
  const displayedPlayerPositions = new Map(displayPlayers.map(player => [player.id, { x: player.x, y: player.y }] as const));
  const displayDrawings = (playbackFrame?.drawings ?? project.drawings)
    .map(drawing => boardDragPreview?.ids.includes(drawing.id) && !(drawing.type === 'polygon-zone' && drawing.followPlayers)
      ? previewTranslatedDrawing(drawing, boardDragPreview.dx, boardDragPreview.dy)
      : drawing)
    .map(drawing => {
      if (drawing.type !== 'polygon-zone' || !drawing.followPlayers || !drawing.linkedPlayerIds?.length) return drawing;
      const points = drawing.linkedPlayerIds.flatMap(playerId => {
        const position = displayedPlayerPositions.get(playerId);
        return position ? [position.x, position.y] : [];
      });
      return points.length >= 6 ? { ...drawing, points } : drawing;
    })
    .map(drawing => curveDrag?.drawingId === drawing.id
      ? { ...drawing, points: drawingWithControlPoint({ ...drawing, points: curveDrag.basePoints }, curveDrag.current.x, curveDrag.current.y) }
      : drawing);
  const sortedDrawings = displayDrawings.slice().sort((a, b) => a.zIndex - b.zIndex);
  const selectedCurveDrawing = sortedDrawings
    .slice()
    .reverse()
    .find(drawing => selectedIds.includes(drawing.id) && (drawing.type === 'arrow' || drawing.type === 'long-pass' || drawing.type === 'curve') && !drawing.locked && !drawing.hidden);
  const selectedCurveControl = selectedCurveDrawing ? movementCurvePoints(selectedCurveDrawing, mapper)[1] : undefined;
  const draftDrawing = draft && canDraw ? buildDrawing(tool, draft.start, draft.current, toolStyle, draft.id) : null;

  useEffect(() => {
    stopPointerTrackingRef.current?.();
    stopPointerTrackingRef.current = null;
    restoreDragNodes(boardDragRef.current);
    activePointerRef.current = null;
    setDraft(null);
    setSelectionBox(null);
    setBoardDragPreview(null);
    setCurveDrag(null);
    curveDragRef.current = null;
    setFieldPlayerDrag(null);
    boardDragRef.current = null;
    if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
    if (boardDragFrameRef.current !== null) cancelAnimationFrame(boardDragFrameRef.current);
    pointerFrameRef.current = null;
    boardDragFrameRef.current = null;
    pendingPointerRef.current = null;
    pendingBoardDragRef.current = null;
    const stage = stageRef.current;
    if (stage) stage.container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
  }, [tool, playing, scale]);

  useEffect(() => {
    const cancelTool = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { cancelInteraction(); setTool('select'); }
    };
    window.addEventListener('keydown', cancelTool);
    return () => window.removeEventListener('keydown', cancelTool);
  }, [setTool]);

  useEffect(() => () => {
    stopPointerTrackingRef.current?.();
    if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
    if (boardDragFrameRef.current !== null) cancelAnimationFrame(boardDragFrameRef.current);
  }, []);

  const beginAt = (stage: Konva.Stage) => {
    const rel = pointerRel(stage);
    if (canDraw) setDraft({ id: crypto.randomUUID(), start: [rel.x, rel.y], current: [rel.x, rel.y] });
    else setSelectionBox({ start: [rel.x, rel.y], current: [rel.x, rel.y] });
  };
  const boardItemAt = (stage: Konva.Stage) => {
    const rel = pointerRel(stage, false);
    const pointer = mapper.toAbs(rel.x, rel.y);
    const ballCenter = mapper.toAbs(displayBall.x, displayBall.y);
    const ballRadius = Math.max((touchCanvas ? 16 : 12) / displayScale, displayBall.size / 2 + 10.5);
    const ball = Math.hypot(pointer[0] - ballCenter[0], pointer[1] - ballCenter[1]) <= ballRadius
      ? { id: 'ball', locked: displayBall.locked }
      : undefined;
    const player = ball ? undefined : displayPlayers
      .filter(candidate => candidate.starter && !candidate.hidden)
      .map(candidate => {
        const center = mapper.toAbs(candidate.x, candidate.y);
        const markerSize = clampRange(candidate.size ?? 1, 0.65, 1.65);
        const markerRadius = baseMarkerRadius * markerSize;
        const radius = Math.max((touchCanvas ? 20 : 12) / displayScale, markerRadius + 13);
        const team = project.teams.find(team => team.id === candidate.teamId);
        const nameHit = (team?.showNames ?? true) && candidate.displayName.trim().length > 0
          && Math.abs(pointer[0] - center[0]) <= Math.max(88, 108 * markerSize) / 2
          && pointer[1] >= center[1] + markerRadius + 6 && pointer[1] <= center[1] + markerRadius + 31;
        return { player: candidate, distance: Math.hypot(pointer[0] - center[0], pointer[1] - center[1]), radius, nameHit };
      })
      .filter(candidate => candidate.distance <= candidate.radius || candidate.nameHit)
      .sort((a, b) => a.distance - b.distance || b.player.zIndex - a.player.zIndex)[0]?.player;
    const area = ball || player ? undefined : sortedDrawings
      .slice()
      .reverse()
      .find(drawing => pointHitsArea(drawing, rel, mapper));
    const hit = ball || player ? undefined : stage.getIntersection(stage.getPointerPosition()!);
    const drawingNode = hit?.findAncestor((node: Konva.Node) => node.id().startsWith('drawing-node-'), true);
    const hitDrawing = drawingNode ? sortedDrawings.find(drawing => 'drawing-node-' + drawing.id === drawingNode.id()) : undefined;
    return { item: ball ?? player ?? hitDrawing ?? area, player, rel };
  };
  const beginBoardItemAt = (stage: Konva.Stage, native: PointerEvent) => {
    if (canDraw || playing) return false;
    const { item, player, rel } = boardItemAt(stage);
    if (!item) return false;

    const modifier = native.ctrlKey || native.metaKey || native.shiftKey;
    if (modifier) {
      toggleSelection(item.id);
      setSelectionBox(null);
      return true;
    }

    const state = useTacticsStore.getState();
    if (!state.selectedIds.includes(item.id)) select(item.id);
    setSelectionBox(null);
    const ids = constrainBoardMove(state.project, state.selectedIds.includes(item.id) ? state.selectedIds : [item.id], 0, 0).ids;
    if (item.locked || !ids.includes(item.id)) return true;
    const nodes = ids.flatMap(id => {
      const nodeId = id === 'ball' ? 'ball-node' : state.project.drawings.some(drawing => drawing.id === id) ? 'drawing-node-' + id : 'player-node-' + id;
      const node = stage.findOne((candidate: Konva.Node) => candidate.id() === nodeId);
      return node ? [{ node, x: node.x(), y: node.y(), parent: node.getParent(), index: node.zIndex() }] : [];
    });
    // Linked polygons need geometry updates; isolate this less common preview path.
    const reactPreview = state.project.drawings.some(drawing => drawing.followPlayers && drawing.linkedPlayerIds?.some(id => ids.includes(id)));
    const session: BoardDragSession = { ids, start: rel, current: rel, moved: false, nodes, reactPreview, lifted: false };
    boardDragRef.current = session;
    if (player) {
      const team = state.project.teams.find(candidate => candidate.id === player.teamId);
      const playerIds = team?.squad
        .filter(candidate => candidate.starter && !candidate.hidden && ids.includes(candidate.id))
        .map(candidate => candidate.id) ?? [player.id];
      session.fieldPlayers = { teamId: player.teamId, playerIds };
      setFieldPlayerDrag(session.fieldPlayers);
    } else {
      setFieldPlayerDrag(null);
    }
    stage.container().style.cursor = 'grab';
    return true;
  };
  const moveBoardItemAt = (stage: Konva.Stage, rel = pointerRel(stage, false)) => {
    const session = boardDragRef.current;
    if (!session) return false;
    session.current = rel;
    const delta = { dx: rel.x - session.start.x, dy: rel.y - session.start.y };
    if (boardDragMoved(session.start, rel, { width: mapper.pitch.width * displayScale, height: mapper.pitch.height * displayScale })) session.moved = true;
    if (!session.moved) return true;
    pendingBoardDragRef.current = constrainBoardMove(project, session.ids, delta.dx, delta.dy);
    if (boardDragFrameRef.current === null) {
      boardDragFrameRef.current = requestAnimationFrame(() => {
        boardDragFrameRef.current = null;
        const preview = pendingBoardDragRef.current;
        if (!preview || boardDragRef.current !== session) return;
        if (session.reactPreview) setBoardDragPreview(preview);
        else {
          const dragLayer = dragLayerRef.current;
          const autoDraw = Konva.autoDrawEnabled;
          const originalLayers = new Set<Konva.Layer>();
          // Move only the dragged objects into a separate layer, then paint in this
          // frame. A second batchDraw RAF would add another frame of input delay.
          Konva.autoDrawEnabled = false;
          try {
            if (!session.lifted && dragLayer) {
              session.nodes.forEach(({ node }) => {
                const originalLayer = node.getLayer();
                if (originalLayer) originalLayers.add(originalLayer);
                node.moveTo(dragLayer);
              });
              session.lifted = true;
            }
            session.nodes.forEach(({ node, x, y }) => node.position({ x: x + preview.dx * mapper.pitch.width, y: y + preview.dy * mapper.pitch.height }));
          } finally { Konva.autoDrawEnabled = autoDraw; }
          originalLayers.forEach(layer => layer.draw());
          if (dragLayer) dragLayer.draw();
        }
      });
    }
    stage.container().style.cursor = 'grabbing';
    return true;
  };
  const finishBoardItemAt = (stage: Konva.Stage, rel = boardDragRef.current?.current ?? pointerRel(stage, false)) => {
    const session = boardDragRef.current;
    if (!session) return false;
    boardDragRef.current = null;
    if (boardDragFrameRef.current !== null) cancelAnimationFrame(boardDragFrameRef.current);
    boardDragFrameRef.current = null;
    pendingBoardDragRef.current = null;
    setBoardDragPreview(null);
    setFieldPlayerDrag(null);
    // Fast gestures can reach pointerup before a pointermove is delivered.
    const dx = rel.x - session.start.x;
    const dy = rel.y - session.start.y;
    const moved = session.moved || boardDragMoved(session.start, rel, { width: mapper.pitch.width * displayScale, height: mapper.pitch.height * displayScale });
    const move = constrainBoardMove(useTacticsStore.getState().project, session.ids, moved ? dx : 0, moved ? dy : 0);
    // Put nodes back into their normal layer at the committed position. There
    // must not be an intermediate paint of the pre-drag position on release.
    restoreDragNodes(session, { x: move.dx * mapper.pitch.width, y: move.dy * mapper.pitch.height });
    if (moved) moveSelectedItems(move.ids, move.dx, move.dy);
    else stage.batchDraw();
    stage.container().style.cursor = 'default';
    return true;
  };
  const moveAt = (stage: Konva.Stage) => {
    if (!draft && !selection) return;
    const rel = pointerRel(stage);
    pendingPointerRef.current = rel;
    if (pointerFrameRef.current !== null) return;
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const pending = pendingPointerRef.current;
      if (!pending) return;
      setDraft(current => current && canDraw ? { ...current, current: [pending.x, pending.y] } : current);
      setSelectionBox(current => current && !canDraw ? { ...current, current: [pending.x, pending.y] } : current);
    });
  };
  const finishAt = (stage: Konva.Stage) => {
    const rel = pointerRel(stage);
    if (draft && canDraw) {
      const end = [rel.x, rel.y];
      const distance = Math.hypot(end[0] - draft.start[0], end[1] - draft.start[1]);
      const pointProp = tool === 'goal-big' || tool === 'goal-small' || tool === 'cone-small' || tool === 'cone-big' || tool === 'mannequin' || tool === 'mannequin-three';
      if (tool === 'text' || pointProp || distance > 0.006) {
        addDrawing(buildDrawing(tool, draft.start, end, toolStyle, draft.id));
        setTool('select');
        if (tool === 'zone' || tool === 'circle-zone' || pointProp) {
          setDockTab('style');
          if (dockPosition === 'hidden') setDockPosition('bottom');
        }
      }
      setDraft(null);
    }
    if (selection && !canDraw) {
      const x1 = Math.min(selection.start[0], rel.x);
      const y1 = Math.min(selection.start[1], rel.y);
      const x2 = Math.max(selection.start[0], rel.x);
      const y2 = Math.max(selection.start[1], rel.y);
      const moved = Math.hypot(x2 - x1, y2 - y1) > 0.01;
      if (!moved) setSelection([]);
      else {
        const box = { x1, y1, x2, y2 };
        const drawingIds = project.drawings.filter(drawing => intersects(box, drawingBounds(drawing))).map(drawing => drawing.id);
        const playerPadX = Math.max(0.018, 38 / mapper.pitch.width);
        const playerPadY = Math.max(0.018, 38 / mapper.pitch.height);
        const playerIds = project.teams.flatMap(team => team.squad).filter(player =>
          player.starter &&
          !player.hidden &&
          player.x >= x1 - playerPadX &&
          player.x <= x2 + playerPadX &&
          player.y >= y1 - playerPadY &&
          player.y <= y2 + playerPadY,
        ).map(player => player.id);
        setSelection([...playerIds, ...drawingIds]);
      }
      setSelectionBox(null);
    }
  };

  function cancelInteraction() {
    stopPointerTrackingRef.current?.();
    stopPointerTrackingRef.current = null;
    releasePointerCapture();
    const session = boardDragRef.current;
    restoreDragNodes(session);
    boardDragRef.current = null;
    activePointerRef.current = null;
    pendingPointerRef.current = null;
    pendingBoardDragRef.current = null;
    if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
    if (boardDragFrameRef.current !== null) cancelAnimationFrame(boardDragFrameRef.current);
    pointerFrameRef.current = null;
    boardDragFrameRef.current = null;
    setBoardDragPreview(null);
    setFieldPlayerDrag(null);
    setDraft(null);
    setSelectionBox(null);
    stageRef.current?.batchDraw();
    if (stageRef.current) stageRef.current.container().style.cursor = canDraw ? 'crosshair' : 'default';
  }
  useEffect(() => {
    const onBlur = () => { if (!boardDragRef.current) cancelInteraction(); };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);
  const boardPointFromClient = (event: { clientX: number; clientY: number }) => {
    const rect = stageRef.current!.container().getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / displayScale - mapper.pitch.x) / mapper.pitch.width,
      y: ((event.clientY - rect.top) / displayScale - mapper.pitch.y) / mapper.pitch.height,
    };
  };
  const releasePointerCapture = () => {
    const pointerId = activePointerRef.current;
    activePointerRef.current = null;
    const element = pointerCaptureRef.current;
    pointerCaptureRef.current = null;
    if (pointerId !== null && element?.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
  };
  const beginPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (playing || event.button !== 0 || !event.isPrimary) return;
    const stage = stageRef.current;
    if (!stage) return;
    // A new primary down always starts a new gesture, including after an
    // interrupted release outside the window. Never consume the next drag.
    if (activePointerRef.current !== null) cancelInteraction();
    event.preventDefault();
    stage.setPointersPositions(event.nativeEvent);
    activePointerRef.current = event.pointerId;
    pointerCaptureRef.current = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (beginBoardItemAt(stage, event.nativeEvent)) {
      if (boardDragRef.current) stopPointerTrackingRef.current = trackBoardPointer(window, event.pointerId, {
        move: native => moveBoardItemAt(stage, boardPointFromClient(native)),
        release: native => {
          stopPointerTrackingRef.current = null;
          const session = boardDragRef.current;
          const bench = document.elementFromPoint(native.clientX, native.clientY)?.closest<HTMLElement>('[data-bench-team]');
          const benchTeam = bench?.dataset.benchTeam;
          releasePointerCapture();
          if (session?.moved && benchTeam && benchTeam === session.fieldPlayers?.teamId) receivePlayersOnBench(benchTeam);
          else finishBoardItemAt(stage, boardPointFromClient(native));
        },
        interrupt: () => {
          stopPointerTrackingRef.current = null;
          releasePointerCapture();
          // Preserve the last preview if the browser interrupts capture. Escape
          // and explicit tool changes still cancel through cancelInteraction.
          finishBoardItemAt(stage);
        },
      });
      return;
    }
    if (canDraw) select(undefined);
    beginAt(stage);
  };
  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.setPointersPositions(event.nativeEvent);
    if (activePointerRef.current === null) {
      const item = !canDraw && !playing ? boardItemAt(stage).item : undefined;
      stage.container().style.cursor = canDraw ? 'crosshair' : item ? item.locked ? 'not-allowed' : 'grab' : 'default';
      return;
    }
    if (activePointerRef.current !== event.pointerId) return;
    if (!boardDragRef.current) moveAt(stage);
  };
  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId || !stageRef.current) return;
    const stage = stageRef.current;
    stage.setPointersPositions(event.nativeEvent);
    if (!finishBoardItemAt(stage, boardPointFromClient(event))) finishAt(stage);
    releasePointerCapture();
  };

  const selectionRect = selection ? {
    x: Math.min(selection.start[0], selection.current[0]),
    y: Math.min(selection.start[1], selection.current[1]),
    width: Math.abs(selection.current[0] - selection.start[0]),
    height: Math.abs(selection.current[1] - selection.start[1]),
  } : null;
  const selectionOverlay = selectionRect ? {
    start: mapper.toAbs(selectionRect.x, selectionRect.y),
    end: mapper.toAbs(selectionRect.x + selectionRect.width, selectionRect.y + selectionRect.height),
  } : null;

  const dropPlayer = (event: React.DragEvent<HTMLDivElement>) => {
    const playerId = event.dataTransfer.getData('text/player-id');
    if (!playerId || !stageRef.current) return;
    event.preventDefault();
    const rect = stageRef.current.container().getBoundingClientRect();
    const rel = mapper.toRel((event.clientX - rect.left) / displayScale, (event.clientY - rect.top) / displayScale);
    checkpointHistory();
    placePlayer(playerId, rel.x, rel.y);
  };
  const curvePointerRel = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = stageRef.current?.container().getBoundingClientRect();
    if (!rect) return undefined;
    return mapper.toRel((event.clientX - rect.left) / displayScale, (event.clientY - rect.top) / displayScale);
  };
  const beginCurveOverlayDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!selectedCurveDrawing || !selectedCurveControl) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const control = mapper.toRel(selectedCurveControl[0], selectedCurveControl[1]);
    const session = { drawingId: selectedCurveDrawing.id, basePoints: [...selectedCurveDrawing.points], current: control };
    curveDragRef.current = session;
    setCurveDrag(session);
  };
  const moveCurveOverlayDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const session = curveDragRef.current;
    const rel = curvePointerRel(event);
    if (!session || !rel) return;
    event.preventDefault();
    event.stopPropagation();
    const next = { ...session, current: rel };
    curveDragRef.current = next;
    setCurveDrag(next);
  };
  const finishCurveOverlayDrag = (event: React.PointerEvent<HTMLButtonElement>, commit: boolean) => {
    const session = curveDragRef.current;
    if (!session) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const rel = curvePointerRel(event) ?? session.current;
    const drawing = project.drawings.find(candidate => candidate.id === session.drawingId);
    if (commit && drawing) commitDrawingUpdate(drawing.id, { points: drawingWithControlPoint({ ...drawing, points: session.basePoints }, rel.x, rel.y) });
    curveDragRef.current = null;
    setCurveDrag(null);
  };
  const receivePlayersOnBench = (teamId: string) => {
    const fieldPlayers = boardDragRef.current?.fieldPlayers;
    if (!fieldPlayers || fieldPlayers.teamId !== teamId || !fieldPlayers.playerIds.length) return;
    restoreDragNodes(boardDragRef.current);
    checkpointHistory();
    fieldPlayers.playerIds.forEach(playerId => setPlayerStarter(playerId, false));
    boardDragRef.current = null;
    if (boardDragFrameRef.current !== null) cancelAnimationFrame(boardDragFrameRef.current);
    boardDragFrameRef.current = null;
    pendingBoardDragRef.current = null;
    setBoardDragPreview(null);
    setFieldPlayerDrag(null);
    const stage = stageRef.current;
    if (stage) stage.container().style.cursor = 'default';
  };
  const shareBoard = async () => {
    const url = window.location.href;
    const title = 'ZaidTacticsBoard';
    try {
      if (navigator.share) await navigator.share({ title, text: 'Open my tactics board.', url });
      else await navigator.clipboard?.writeText(url);
      setShareDone(true);
      window.setTimeout(() => setShareDone(false), 1800);
    } catch {
      setShareDone(false);
    }
  };
  const copyContactEmail = async () => {
    try {
      await navigator.clipboard?.writeText('zaidtacticsboard@outlook.com');
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      setEmailCopied(false);
    }
  };
  const toggleTheme = () => updateSettings({
    theme: dark ? 'portfolio-light' : 'dark',
    backgroundColor: dark ? '#edf7ef' : '#071b12',
    grassColor: dark ? '#69a873' : '#2f7a4f',
    lineColor: '#f8fafc',
  });

  return <div className="board-workspace relative flex h-full w-full flex-col overflow-hidden">
    <header className={`board-header relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 backdrop-blur-xl sm:px-4 ${dark ? 'border-emerald-950/80 bg-[#04130b]/70' : 'border-white/70 bg-white/60'}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <StudioLogo />
        <div className="min-w-0">
          <h1 className="truncate board-brand text-lg font-bold leading-none sm:text-xl" style={{ fontFamily: '"Segoe UI Variable Display", "Aptos Display", Inter, system-ui, sans-serif' }}>ZaidTacticsBoard</h1>
          <p className={`mt-0.5 hidden text-[8px] font-black uppercase tracking-[0.24em] sm:block ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Tactics board</p>
        </div>
      </div>
      <div className="relative flex shrink-0 items-center gap-1.5">
        {onHome && <button type="button" aria-label="Studio home" title="Studio home" onClick={onHome} className={`grid h-9 w-9 place-items-center rounded-lg border transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb] hover:bg-white'}`}>
          <Home size={14} />
        </button>}
        {onOpenVideo && <button type="button" aria-label="Open video analysis" title="Video analysis" onClick={onOpenVideo} className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb] hover:bg-white'}`}>
          <Video size={14} />
          <span className="hidden sm:inline">Video</span>
        </button>}
        <button type="button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} className={`grid h-9 w-9 place-items-center rounded-lg border transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb] hover:bg-white'}`}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button type="button" aria-label="Share tactics board" onClick={() => void shareBoard()} className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb] hover:bg-white'}`}>
          <Share2 size={14} />
          <span className="hidden sm:inline">{shareDone ? 'Copied' : 'Share'}</span>
        </button>
        <button type="button" aria-label="Contact ZaidTacticsBoard" aria-expanded={contactOpen} onClick={() => setContactOpen(open => !open)} className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black transition ${dark ? 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-900' : 'border-[#d7e5f6] bg-white/80 text-[#0b172a] hover:border-[#2563eb] hover:bg-white'}`}>
          <Mail size={14} />
          <span className="hidden md:inline">Contact</span>
        </button>
        {contactOpen && <div className={`absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border p-3 shadow-[0_18px_50px_rgba(11,23,42,.22)] backdrop-blur-xl ${dark ? 'border-slate-700 bg-slate-950/95 text-slate-100' : 'border-[#bfdbfe] bg-white/95 text-[#0b172a]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">Contact ZaidTacticsBoard</p>
              <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Questions, feedback, or partnership enquiries.</p>
            </div>
            <button type="button" aria-label="Close contact details" onClick={() => setContactOpen(false)} className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${dark ? 'bg-slate-800 text-slate-200' : 'bg-[#eff6ff] text-[#1d4ed8]'}`}><X size={14} /></button>
          </div>
          <div className={`mt-3 rounded-lg border px-3 py-2 font-mono text-[11px] font-bold sm:text-xs ${dark ? 'border-slate-700 bg-slate-900' : 'border-[#d7e5f6] bg-[#f8fbff]'}`}>zaidtacticsboard@outlook.com</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void copyContactEmail()} className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-black ${dark ? 'border-slate-700 bg-slate-900' : 'border-[#d7e5f6] bg-white'}`}><Copy size={14} /> {emailCopied ? 'Copied' : 'Copy email'}</button>
            <a href="mailto:zaidtacticsboard@outlook.com" className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2563eb] text-xs font-black text-white"><Mail size={14} /> Open email app</a>
          </div>
        </div>}
      </div>
    </header>
    {dockTab !== 'squad' && project.teams[0] && <BenchTray team={project.teams[0]} side="left" fieldPlayerDrag={fieldPlayerDrag} />}
    {dockTab !== 'squad' && project.teams[1] && <BenchTray team={project.teams[1]} side="right" fieldPlayerDrag={fieldPlayerDrag} />}
    <div className="board-workarea relative flex min-h-0 flex-1">
    <BoardToolbox />
    <div ref={containerRef} onDragOver={e => e.preventDefault()} onDrop={dropPlayer} className="board-viewport relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
      <div className="board-center relative z-10 grid min-h-full min-w-full place-items-center">
        <div role="application" aria-label="Tactics board canvas. Drag players to move them. Shift-click to select multiple items." onPointerDownCapture={event => { if (!(event.target instanceof Element && event.target.closest('button'))) beginPointer(event); }} onPointerMove={movePointer} onPointerUp={finishPointer} onPointerCancel={() => { if (activePointerRef.current !== null) cancelInteraction(); }} onLostPointerCapture={() => { if (activePointerRef.current !== null && !boardDragRef.current) cancelInteraction(); }} className="board-stage-wrap relative shrink-0 touch-none" style={{ width: width * displayScale, height: height * displayScale }}>
          <div style={{ width: width * scale, height: height * scale, transform: `scale(${magnification})`, transformOrigin: 'top left', willChange: 'transform' }}>
          <Stage ref={stageRef} width={width * scale} height={height * scale} scale={stageScale}>
          <Layer listening={false}><Pitch width={width} height={height} mapper={mapper} /></Layer>
          <Layer listening={boardInteractive}>{sortedDrawings.map(d => <Group key={d.id} id={`drawing-node-${d.id}`} x={0} y={0}><DrawingShape drawing={d} mapper={mapper} interactive={boardInteractive} /></Group>)}</Layer>
          <Layer listening={boardInteractive}>
            {displayPlayers.map(p => <PlayerMarker key={p.id} player={p} mapper={mapper} />)}
            <BallMarker ball={displayBall} mapper={mapper} />
          </Layer>
          <Layer listening={false}>
            {draftDrawing && <DrawingShape drawing={draftDrawing} mapper={mapper} interactive={false} />}
            {selectionOverlay && <Rect
              x={Math.min(selectionOverlay.start[0], selectionOverlay.end[0])}
              y={Math.min(selectionOverlay.start[1], selectionOverlay.end[1])}
              width={Math.abs(selectionOverlay.end[0] - selectionOverlay.start[0])}
              height={Math.abs(selectionOverlay.end[1] - selectionOverlay.start[1])}
              fill="#2563eb"
              opacity={0.1}
              stroke="#2563eb"
              strokeWidth={1.25}
              dash={[8, 10]}
              cornerRadius={4}
            />}
          </Layer>
          <Layer ref={dragLayerRef} listening={false} />
          </Stage>
          </div>
          {boardInteractive && selectedCurveDrawing && selectedCurveControl && <button
            type="button"
            aria-label="Reshape selected arrow"
            title="Drag to reshape the arrow"
            onClick={event => { event.preventDefault(); event.stopPropagation(); }}
            onPointerDown={beginCurveOverlayDrag}
            onPointerMove={moveCurveOverlayDrag}
            onPointerUp={event => finishCurveOverlayDrag(event, true)}
            onPointerCancel={event => finishCurveOverlayDrag(event, false)}
            className="absolute z-40 h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-crosshair touch-none rounded-full border-0 bg-transparent p-0 outline-none"
            style={{ left: selectedCurveControl[0] * displayScale, top: selectedCurveControl[1] * displayScale }}
          >
            <span className="pointer-events-none absolute inset-4 rounded-full bg-cyan-400/20 ring-1 ring-cyan-300/40" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-cyan-500 shadow-[0_4px_12px_rgba(8,145,178,.55)]" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </button>}
        </div>
      </div>
    </div>
    </div>
    <div className="board-statusbar">
      <div className="board-status-copy"><span className="board-live-dot" /><span>{playing ? 'Playing scenes' : selectedIds.length ? selectedIds.length + ' selected' : 'Ready to create'}</span><span className="board-status-hint">{tool === 'select' ? 'Drag to move · Shift-click to select' : 'Drag on the pitch to draw · Esc to cancel'}</span></div>
      <div className="board-status-actions"><QuickActions embedded /><button className="board-fit-button" onClick={() => useTacticsStore.getState().setViewZoom(boardFitZoom(format))} title="Fit entire board to the available space">Fit</button><PitchScaleControl embedded /></div>
    </div>
  </div>;
}
