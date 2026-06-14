import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { formations, FormationKey } from '../data/formations';
import { teamPresetById } from '../data/teamPresets';
import worldCupSquadsByPresetId from '../data/worldCupSquads.generated.json';
import { Ball, BoardFormat, BoardSettings, DockPosition, DockTab, Drawing, PlaybackFrame, Player, Project, Scene, Team, Tool, ToolStyle } from '../types/domain';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampRange = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const boardViews: Record<BoardFormat, Pick<BoardSettings, 'format' | 'width' | 'height' | 'crop'>> = {
  portrait: { format: 'portrait', width: 1280, height: 1920, crop: 'full' },
  landscape: { format: 'landscape', width: 1920, height: 1080, crop: 'full' },
};

const isLandscape = (format: BoardFormat) => format === 'landscape';
const rotateToLandscape = ({ x, y }: { x: number; y: number }) => ({ x: clamp01(1 - y), y: clamp01(x) });
const rotateToPortrait = ({ x, y }: { x: number; y: number }) => ({ x: clamp01(y), y: clamp01(1 - x) });
const transformPoint = (point: { x: number; y: number }, from: BoardFormat, to: BoardFormat) => {
  if (from === to) return point;
  return to === 'landscape' ? rotateToLandscape(point) : rotateToPortrait(point);
};

function pitchDimensions(settings: Pick<BoardSettings, 'format' | 'width' | 'height' | 'pitchScaleX' | 'pitchScaleY'>) {
  const margin = 56;
  const maxWidth = settings.width - margin * 2;
  const maxHeight = settings.height - margin * 2;
  const baseRatio = settings.format === 'landscape' ? 105 / 68 : 68 / 105;
  const availableRatio = maxWidth / maxHeight;
  const baseWidth = availableRatio > baseRatio ? maxHeight * baseRatio : maxWidth;
  const baseHeight = availableRatio > baseRatio ? maxHeight : maxWidth / baseRatio;
  return {
    width: Math.min(maxWidth, baseWidth * clampRange(settings.pitchScaleX || 1, 0.5, 1.24)),
    height: Math.min(maxHeight, baseHeight * clampRange(settings.pitchScaleY || 1, 0.5, 1.24)),
  };
}

const transformDrawing = (drawing: Drawing, fromSettings: BoardSettings, toSettings: BoardSettings): Drawing => {
  const from = fromSettings.format;
  const to = toSettings.format;
  if (from === to) return drawing;
  const rotationStep = to === 'landscape' ? 90 : -90;
  const rotation = drawing.rotation === undefined
    ? undefined
    : ((drawing.rotation + rotationStep + 360) % 360) as Drawing['rotation'];
  const fromPitch = pitchDimensions(fromSettings);
  const toPitch = pitchDimensions(toSettings);
  if (drawing.type === 'goal-big' || drawing.type === 'goal-small' || drawing.type === 'mannequin' || drawing.type === 'mannequin-three') {
    const [x1, y1, x2, y2] = drawing.points;
    const center = transformPoint({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, from, to);
    const width = Math.abs(x2 - x1) * fromPitch.width / toPitch.width;
    const height = Math.abs(y2 - y1) * fromPitch.height / toPitch.height;
    return {
      ...drawing,
      rotation,
      points: [
        clamp01(center.x - width / 2),
        clamp01(center.y - height / 2),
        clamp01(center.x + width / 2),
        clamp01(center.y + height / 2),
      ],
    };
  }
  if (drawing.type === 'cone-small' || drawing.type === 'cone-big') {
    const [x1, y1, x2, y2] = drawing.points;
    const anchor = transformPoint({ x: x1, y: y1 }, from, to);
    const pixelSize = Math.hypot((x2 - x1) * fromPitch.width, (y2 - y1) * fromPitch.height);
    const dx = pixelSize / Math.SQRT2 / toPitch.width;
    const dy = pixelSize / Math.SQRT2 / toPitch.height;
    return { ...drawing, rotation, points: [anchor.x, anchor.y, clamp01(anchor.x + dx), clamp01(anchor.y + dy)] };
  }
  if (drawing.type === 'zone') {
    const [x, y, width, height] = drawing.points;
    const a = transformPoint({ x, y }, from, to);
    const b = transformPoint({ x: x + width, y: y + height }, from, to);
    return { ...drawing, rotation, points: [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)] };
  }
  const points = drawing.points.slice();
  for (let index = 0; index < points.length; index += 2) {
    const next = transformPoint({ x: points[index], y: points[index + 1] }, from, to);
    points[index] = next.x;
    points[index + 1] = next.y;
  }
  return { ...drawing, rotation, points };
};

function translateDrawing(drawing: Drawing, dx: number, dy: number): Drawing {
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
  return { ...drawing, points, followPlayers: drawing.type === 'polygon-zone' ? false : drawing.followPlayers };
}

const transformScene = (scene: Scene, fromSettings: BoardSettings, toSettings: BoardSettings): Scene => ({
  ...scene,
  playerPositions: Object.fromEntries(Object.entries(scene.playerPositions).map(([playerId, position]) => [playerId, transformPoint(position, fromSettings.format, toSettings.format)])),
  ball: { ...scene.ball, ...transformPoint(scene.ball, fromSettings.format, toSettings.format) },
  drawings: scene.drawings.map(drawing => transformDrawing(drawing, fromSettings, toSettings)),
});

const defaultSettings: BoardSettings = {
  ...boardViews.portrait,
  customWidth: 1280,
  customHeight: 1920,
  grassColor: '#73ad7a',
  lineColor: '#f8fbff',
  lineThickness: 4,
  stripeIntensity: 0.1,
  backgroundColor: '#edf6ff',
  border: true,
  pitchScaleX: 1,
  pitchScaleY: 1,
  grid: 'five-lanes',
  flipDirection: false,
  pepZones: false,
  linkedAreasFollowPlayers: true,
  selectionColor: '#facc15',
  theme: 'portfolio-light',
  accentColor: '#2563eb',
};

const defaultToolStyle: ToolStyle = {
  color: '#2563eb',
  fill: '#2563eb',
  stripeColor: '#ffffff',
  strokeWidth: 5,
  opacity: 0.34,
  dashed: false,
  fillPattern: 'diagonal',
};

const roleNames = ['Keeper', 'Left Back', 'Left Centre Back', 'Right Centre Back', 'Right Back', 'Left 8', 'Six', 'Right 8', 'Left Wing', 'Striker', 'Right Wing'];
const generatedRoleLabels = new Set(roleNames.map(name => name.toUpperCase()));
const defaultPositions = ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'DM', 'RCM', 'LW', 'ST', 'RW'];
type PresetSquadPlayer = { no: number; pos: string; name?: string };
const worldCupSquads = worldCupSquadsByPresetId as Record<string, PresetSquadPlayer[] | undefined>;

function ownHalfPoint(point: { x: number; y: number }, away = false) {
  return {
    x: away ? 1 - point.x : point.x,
    y: away ? 0.47 - point.y * 0.42 : 0.53 + point.y * 0.42,
  };
}

function customSidePoint(index: number, count: number, away: boolean, format: BoardFormat) {
  if (index === 0) return transformPoint(ownHalfPoint({ x: 0.5, y: 0.9 }, away), 'portrait', format);
  const outfieldCount = Math.max(1, count - 1);
  const rowCount = Math.max(1, Math.ceil(outfieldCount / 5));
  const row = Math.floor((index - 1) / 5);
  const firstIndexInRow = row * 5;
  const playersInRow = Math.min(5, outfieldCount - firstIndexInRow);
  const indexInRow = index - 1 - firstIndexInRow;
  const spread = playersInRow === 1 ? 0 : Math.min(0.76, 0.18 * (playersInRow - 1));
  const x = playersInRow === 1 ? 0.5 : 0.5 - spread / 2 + indexInRow * (spread / (playersInRow - 1));
  const y = rowCount === 1 ? 0.48 : 0.74 - row * (0.5 / (rowCount - 1));
  return transformPoint(ownHalfPoint({ x, y }, away), 'portrait', format);
}

function makeBaseplateSquad(teamId: string, seed: number, primaryColor: string, secondaryColor: string, formation: FormationKey, format: BoardFormat, away = false, goalkeeperColor = seed === 1 ? '#f59e0b' : '#7c3aed'): Player[] {
  const coords = formations[formation];
  return coords.map((point, index) => {
    const placed = transformPoint(ownHalfPoint(point, away), 'portrait', format);
    return {
      id: id(),
      teamId,
      fullName: '',
      displayName: '',
      number: index + 1,
      position: defaultPositions[index] ?? 'SUB',
      ...placed,
      color: index === 0 ? goalkeeperColor : primaryColor,
      secondaryColor: index === 0 ? '#fef3c7' : secondaryColor,
      outline: '#ffffff',
      opacity: 1,
      labelPosition: 'bottom',
      markerStyle: 'circle',
      showNumber: true,
      starter: true,
      locked: false,
      hidden: false,
      zIndex: index + seed * 20,
    };
  });
}

function makeTeam(seed: number, name: string, primaryColor: string, secondaryColor: string, formation: FormationKey, invert = false): Team {
  const teamId = `team-${seed}`;
  const goalkeeperColor = seed === 1 ? '#f59e0b' : '#7c3aed';
  return {
    id: teamId, name, shortName: seed === 1 ? 'HOM' : 'AWY', primaryColor, secondaryColor, goalkeeperColor, formation, showBadge: true, showNumbers: true, showNames: true,
    squad: makeBaseplateSquad(teamId, seed, primaryColor, secondaryColor, formation, 'portrait', invert, goalkeeperColor),
  };
}

function labelFromName(name = '') {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const particles = new Set(['al', 'bin', 'de', 'del', 'der', 'di', 'el', 'la', 'van', 'von']);
  const parts = cleaned.split(' ').filter(Boolean);
  let label = parts[parts.length - 1] ?? cleaned;
  if (parts.length > 1 && particles.has(parts[parts.length - 2].toLowerCase())) label = `${parts[parts.length - 2]} ${label}`;
  return label.toUpperCase();
}

function placeholderSquad() {
  return Array.from({ length: 26 }, (_, index): PresetSquadPlayer => ({
    no: index + 1,
    pos: index === 0 || index === 11 || index === 22 ? 'GK' : index < 8 ? 'DF' : index < 16 ? 'MF' : 'FW',
  }));
}

function orderRosterForFormation(roster: PresetSquadPlayer[], formation: string) {
  const parts = formation.split('-').map(value => Number(value)).filter(Boolean);
  const defenderCount = parts[0] ?? 4;
  const forwardCount = parts[parts.length - 1] ?? 3;
  const midfieldCount = Math.max(0, 10 - defenderCount - forwardCount);
  const used = new Set<PresetSquadPlayer>();
  const take = (pos: string, count: number) => {
    const group = roster.filter(player => player.pos === pos && !used.has(player)).slice(0, count);
    group.forEach(player => used.add(player));
    return group;
  };
  const starters = [
    ...take('GK', 1),
    ...take('DF', defenderCount),
    ...take('MF', midfieldCount),
    ...take('FW', forwardCount),
  ];
  roster.filter(player => !used.has(player)).slice(0, 11 - starters.length).forEach(player => {
    used.add(player);
    starters.push(player);
  });
  return [...starters, ...roster.filter(player => !used.has(player))];
}

function makePresetSquad(teamId: string, presetId: string, format: BoardFormat, away = false): Player[] {
  const preset = teamPresetById[presetId] ?? teamPresetById.iraq;
  const coords = formations[preset.formation] ?? formations['4-3-3'];
  const base = orderRosterForFormation(worldCupSquads[preset.id] ?? placeholderSquad(), preset.formation);
  return base.map((item, index) => {
    const fullName = item.name ?? '';
    const displayName = labelFromName(fullName);
    const number = item.no;
    const position = item.pos;
    const starter = index < 11;
    const basePoint = starter
      ? coords[index] ?? coords[coords.length - 1]
      : { x: 0.08, y: 0.1 + (index - 11) * 0.05 };
    const point = transformPoint(starter ? ownHalfPoint(basePoint, away) : basePoint, 'portrait', format);
    return {
      id: id(),
      teamId,
      fullName,
      displayName,
      number,
      position,
      x: point.x,
      y: point.y,
      color: index === 0 ? (preset.secondaryColor === '#ffffff' ? '#f59e0b' : preset.secondaryColor) : preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      outline: '#f8fbff',
      opacity: 1,
      labelPosition: 'bottom',
      markerStyle: 'circle',
      flag: preset.id,
      showNumber: true,
      starter,
      locked: false,
      hidden: false,
      zIndex: index + 10,
    };
  });
}

function entryPlaybackFrame(project: Project, teamId: string, entryX: number): PlaybackFrame {
  return {
    playerPositions: Object.fromEntries(project.teams.flatMap(team => team.squad.map(player => [
      player.id,
      team.id === teamId && player.starter && !player.hidden ? { x: entryX, y: player.y } : { x: player.x, y: player.y },
    ]))),
    ball: project.ball,
    drawings: [],
  };
}

const initialBall: Ball = { x: 0.5, y: 0.5, size: 15, design: 'trionda26', locked: false };
const createInitialProject = (): Project => ({
  id: id(), name: 'Sample vertical match analysis', settings: defaultSettings, ball: initialBall,
  teams: [makeTeam(1, 'Aurora FC', '#1d4ed8', '#eff6ff', '4-3-3'), makeTeam(2, 'North City', '#0b172a', '#bfdbfe', '4-3-3', true)],
  drawings: [],
  scenes: [], updatedAt: now(),
});

type BoardSnapshot = Pick<Project, 'teams' | 'ball' | 'drawings'>;

function snapshotBoard(project: Project): BoardSnapshot {
  return {
    teams: project.teams.map(team => ({ ...team, squad: team.squad.map(player => ({ ...player })) })),
    ball: { ...project.ball },
    drawings: project.drawings.map(drawing => ({ ...drawing, points: [...drawing.points], linkedPlayerIds: drawing.linkedPlayerIds ? [...drawing.linkedPlayerIds] : undefined })),
  };
}

function restoreBoard(project: Project, snapshot: BoardSnapshot): Project {
  const restored = snapshotBoard({ ...project, ...snapshot });
  return { ...project, ...restored, updatedAt: now() };
}

interface Store {
  project: Project;
  selectedId?: string;
  selectedIds: string[];
  tool: Tool;
  toolStyle: ToolStyle;
  viewZoom: number;
  dockPosition: DockPosition;
  dockTab: DockTab;
  playing: boolean;
  playbackFrame?: PlaybackFrame;
  historyPast: BoardSnapshot[];
  historyFuture: BoardSnapshot[];
  setTool: (tool: Tool) => void;
  setToolStyle: (patch: Partial<ToolStyle>) => void;
  setViewZoom: (zoom: number) => void;
  setBoardFormat: (format: BoardFormat) => void;
  setDockPosition: (position: DockPosition) => void;
  setDockTab: (tab: DockTab) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackFrame: (frame?: PlaybackFrame) => void;
  clearPlaybackFrame: () => void;
  checkpointHistory: () => void;
  select: (id?: string) => void;
  toggleSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  updateSettings: (patch: Partial<BoardSettings>) => void;
  updatePlayer: (playerId: string, patch: Partial<Player>) => void;
  setPlayerStarter: (playerId: string, starter: boolean) => void;
  setTeamPlayerCount: (teamId: string, count: number) => void;
  resetElevenAside: () => void;
  placePlayer: (playerId: string, x: number, y: number) => void;
  addPlayer: (teamId: string) => void;
  removePlayer: (playerId: string) => void;
  duplicatePlayer: (playerId: string) => void;
  applyFormation: (teamId: string, formation: FormationKey) => void;
  applyTeamPreset: (teamId: string, presetId: string, entryX?: number) => void;
  applyBaseplate: (teamId: string, entryX?: number) => void;
  applyIraqPreset: (teamId: string) => void;
  updateTeam: (teamId: string, patch: Partial<Team>) => void;
  moveBall: (x: number, y: number) => void;
  updateBall: (patch: Partial<Ball>) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (drawingId: string, patch: Partial<Drawing>) => void;
  commitDrawingUpdate: (drawingId: string, patch: Partial<Drawing>) => void;
  moveSelectedItems: (itemIds: string[], dx: number, dy: number) => void;
  removeDrawing: (drawingId: string) => void;
  removeSelectedDrawings: () => void;
  duplicateSelectedDrawings: () => void;
  undoLastDrawing: () => void;
  redoLastDrawing: () => void;
  clearDrawings: () => void;
  addScene: () => void;
  updateScene: (sceneId: string, patch: Partial<Scene>) => void;
  duplicateScene: (sceneId: string) => void;
  renameScene: (sceneId: string, name: string) => void;
  deleteScene: (sceneId: string) => void;
  applyScene: (sceneId: string) => void;
  importProject: (project: Project) => void;
}

export const useTacticsStore = create<Store>()(persist((set, get) => ({
  project: createInitialProject(), selectedIds: [], tool: 'select', toolStyle: defaultToolStyle, viewZoom: 1.08, dockPosition: 'bottom', dockTab: 'page', playing: false, historyPast: [], historyFuture: [],
  setTool: (tool) => set({ tool }),
  setToolStyle: (patch) => set(s => ({ toolStyle: { ...s.toolStyle, ...patch } })),
  setViewZoom: (viewZoom) => set({ viewZoom }),
  setDockPosition: (dockPosition) => set({ dockPosition }),
  setDockTab: (dockTab) => set({ dockTab }),
  setBoardFormat: (format) => set(({ project }) => {
    const from = project.settings.format;
    const view = boardViews[format];
    if (from === format) return {};
    const nextSettings: BoardSettings = {
      ...project.settings,
      ...view,
      pitchScaleX: project.settings.pitchScaleY,
      pitchScaleY: project.settings.pitchScaleX,
    };
    return {
      project: {
        ...project,
        settings: nextSettings,
        ball: { ...project.ball, ...transformPoint(project.ball, from, format) },
        teams: project.teams.map(team => ({
          ...team,
          squad: team.squad.map(player => ({ ...player, ...transformPoint(player, from, format) })),
        })),
        drawings: project.drawings.map(drawing => transformDrawing(drawing, project.settings, nextSettings)),
        scenes: project.scenes.map(scene => transformScene(scene, project.settings, nextSettings)),
        updatedAt: now(),
      },
      historyPast: [],
      historyFuture: [],
    };
  }),
  setPlaying: (playing) => set({ playing }),
  setPlaybackFrame: (playbackFrame) => set({ playbackFrame }),
  clearPlaybackFrame: () => set({ playbackFrame: undefined, playing: false }),
  checkpointHistory: () => set(({ project, historyPast }) => ({
    historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
    historyFuture: [],
  })),
  select: (selectedId) => set({ selectedId, selectedIds: selectedId ? [selectedId] : [] }),
  toggleSelection: (idToToggle) => set(({ selectedIds }) => {
    const selected = selectedIds.includes(idToToggle) ? selectedIds.filter(id => id !== idToToggle) : [...selectedIds, idToToggle];
    return { selectedIds: selected, selectedId: selected[0] };
  }),
  setSelection: (selectedIds) => set({ selectedIds, selectedId: selectedIds[0] }),
  updateSettings: (patch) => set(({ project }) => ({ project: { ...project, settings: { ...project.settings, ...patch }, updatedAt: now() } })),
  updatePlayer: (playerId, patch) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => ({ ...t, squad: t.squad.map(p => p.id === playerId ? { ...p, ...patch } : p) })), updatedAt: now() } })),
  setPlayerStarter: (playerId, starter) => set(({ project }) => ({
    project: {
      ...project,
      teams: project.teams.map(team => {
        const playerIndex = team.squad.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return team;
        const activeCount = team.squad.filter(p => p.starter).length;
        return {
          ...team,
          squad: team.squad.map((player, index) => {
            if (index !== playerIndex) return player;
            if (!starter) return { ...player, starter: false };
            const lane = activeCount % 5;
            const row = Math.floor(activeCount / 5);
            const away = team.id === project.teams[1]?.id;
            const basePoint = isLandscape(project.settings.format)
              ? { x: away ? 0.78 - row * 0.08 : 0.22 + row * 0.08, y: 0.2 + lane * 0.15 }
              : { x: 0.2 + lane * 0.15, y: away ? 0.78 - row * 0.08 : 0.22 + row * 0.08 };
            return { ...player, starter: true, hidden: false, ...basePoint };
          }),
        };
      }),
      updatedAt: now(),
    },
  })),
  setTeamPlayerCount: (teamId, requestedCount) => set(({ project }) => {
    const count = Math.max(1, Math.min(30, Math.round(requestedCount || 1)));
    return {
      project: {
        ...project,
        teams: project.teams.map((team, teamIndex) => {
          if (team.id !== teamId) return team;
          const additions = Array.from({ length: Math.max(0, count - team.squad.length) }, (_, additionIndex) => {
            const number = team.squad.length + additionIndex + 1;
            return {
              id: id(), teamId, fullName: '', displayName: '', number, position: 'SUB', x: 0.5, y: 0.5,
              color: team.primaryColor, secondaryColor: team.secondaryColor, outline: '#fff', opacity: 1,
              labelPosition: 'bottom' as const, markerStyle: 'circle' as const, showNumber: true,
              starter: false, locked: false, hidden: false, zIndex: 90 + additionIndex,
            };
          });
          const squad = [...team.squad, ...additions];
          const away = teamIndex === 1;
          const formationPoints = count === 11 ? formations[team.formation as FormationKey] : undefined;
          return {
            ...team,
            squad: squad.map((player, index) => {
              const starter = index < count;
              if (!starter) return { ...player, starter: false };
              const position = formationPoints?.[index]
                ? transformPoint(ownHalfPoint(formationPoints[index], away), 'portrait', project.settings.format)
                : customSidePoint(index, count, away, project.settings.format);
              return { ...player, starter: true, hidden: false, ...position };
            }),
          };
        }),
        updatedAt: now(),
      },
    };
  }),
  resetElevenAside: () => set(({ project, historyPast }) => ({
    project: {
      ...project,
      settings: { ...project.settings, pitchScaleX: 1, pitchScaleY: 1 },
      teams: project.teams.map((team, index) => {
        const seed = index + 1;
        const primaryColor = seed === 1 ? '#1d4ed8' : '#0b172a';
        const secondaryColor = seed === 1 ? '#eff6ff' : '#bfdbfe';
        const goalkeeperColor = seed === 1 ? '#f59e0b' : '#7c3aed';
        const formation: FormationKey = '4-3-3';
        return {
          ...team,
          name: `Team ${seed}`,
          shortName: seed === 1 ? 'T1' : 'T2',
          primaryColor,
          secondaryColor,
          goalkeeperColor,
          formation,
          preset: undefined,
          badge: undefined,
          showBadge: true,
          showNumbers: true,
          showNames: true,
          squad: makeBaseplateSquad(team.id, seed, primaryColor, secondaryColor, formation, project.settings.format, index === 1, goalkeeperColor),
        };
      }),
      updatedAt: now(),
    },
    selectedId: undefined,
    selectedIds: [],
    historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
    historyFuture: [],
  })),
  placePlayer: (playerId, x, y) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(team => ({ ...team, squad: team.squad.map(player => player.id === playerId ? { ...player, starter: true, hidden: false, x, y } : player) })), updatedAt: now() } })),
  addPlayer: (teamId) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === teamId ? { ...t, squad: [...t.squad, { id: id(), teamId, fullName: '', displayName: '', number: t.squad.length + 1, position: 'SUB', x: 0.5, y: 0.5, color: t.primaryColor, secondaryColor: t.secondaryColor, outline: '#fff', opacity: 1, labelPosition: 'bottom', markerStyle: 'circle', showNumber: true, starter: false, locked: false, hidden: false, zIndex: 99 }] } : t), updatedAt: now() } })),
  removePlayer: (playerId) => set(({ project, selectedIds }) => ({ project: { ...project, teams: project.teams.map(t => ({ ...t, squad: t.squad.filter(p => p.id !== playerId) })), updatedAt: now() }, selectedId: undefined, selectedIds: selectedIds.filter(id => id !== playerId) })),
  duplicatePlayer: (playerId) => { const player = get().project.teams.flatMap(t => t.squad).find(p => p.id === playerId); if (!player) return; set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === player.teamId ? { ...t, squad: [...t.squad, { ...player, id: id(), x: Math.min(0.95, player.x + 0.04), y: Math.min(0.95, player.y + 0.04), displayName: player.displayName ? `${player.displayName} 2` : '', fullName: player.fullName ? `${player.fullName} 2` : '' }] } : t), updatedAt: now() } })); },
  applyFormation: (teamId, formation) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => { if (t.id !== teamId) return t; const invert = t.id === project.teams[1]?.id; const coords = formations[formation]; return { ...t, formation, squad: t.squad.map((p, i) => {
    if (!coords[i]) return p;
    const point = ownHalfPoint(coords[i], invert);
    const hasManualName = Boolean(p.displayName && !generatedRoleLabels.has(p.displayName));
    return { ...p, ...transformPoint(point, 'portrait', project.settings.format), displayName: hasManualName ? p.displayName : '', fullName: hasManualName ? p.fullName : '', position: defaultPositions[i] ?? p.position, starter: i < 11 };
  }) }; }), updatedAt: now() } })),
  applyTeamPreset: (teamId, presetId, entryX) => set(({ project }) => {
    const nextTeams = project.teams.map((team, index) => {
      if (team.id !== teamId) return team;
      const preset = teamPresetById[presetId] ?? teamPresetById.iraq;
      const goalkeeperColor = preset.secondaryColor === '#ffffff' ? '#f59e0b' : preset.secondaryColor;
      return { ...team, name: preset.name, shortName: preset.initials, primaryColor: preset.primaryColor, secondaryColor: preset.secondaryColor, goalkeeperColor, formation: preset.formation, preset: preset.id, showBadge: team.showBadge ?? true, squad: makePresetSquad(team.id, preset.id, project.settings.format, index === 1) };
    });
    const nextProject = { ...project, teams: nextTeams, updatedAt: now() };
    return { project: nextProject, selectedId: undefined, selectedIds: [], playbackFrame: entryX === undefined ? undefined : entryPlaybackFrame(nextProject, teamId, entryX) };
  }),
  applyBaseplate: (teamId, entryX) => set(({ project }) => {
    const nextTeams = project.teams.map((team, index) => {
      if (team.id !== teamId) return team;
      const seed = index + 1;
      const primaryColor = seed === 1 ? '#1d4ed8' : '#0b172a';
      const secondaryColor = seed === 1 ? '#eff6ff' : '#bfdbfe';
      const goalkeeperColor = seed === 1 ? '#f59e0b' : '#7c3aed';
      const formation: FormationKey = '4-3-3';
      return {
        ...team,
        name: `Team ${seed}`,
        shortName: seed === 1 ? 'T1' : 'T2',
        primaryColor,
        secondaryColor,
        goalkeeperColor,
        formation,
        preset: undefined,
        badge: undefined,
        showBadge: true,
        squad: makeBaseplateSquad(team.id, seed, primaryColor, secondaryColor, formation, project.settings.format, index === 1, goalkeeperColor),
      };
    });
    const nextProject = { ...project, teams: nextTeams, updatedAt: now() };
    return { project: nextProject, selectedId: undefined, selectedIds: [], playbackFrame: entryX === undefined ? undefined : entryPlaybackFrame(nextProject, teamId, entryX) };
  }),
  applyIraqPreset: (teamId) => get().applyTeamPreset(teamId, 'iraq'),
  updateTeam: (teamId, patch) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === teamId ? { ...t, ...patch, squad: t.squad.map(p => ({
    ...p,
    color: p.position === 'GK' ? (patch.goalkeeperColor ?? p.color) : (patch.primaryColor ?? p.color),
    secondaryColor: patch.secondaryColor ?? p.secondaryColor,
  })) } : t), updatedAt: now() } })),
  moveBall: (x, y) => set(({ project, historyPast }) => ({
    project: { ...project, ball: { ...project.ball, x, y }, updatedAt: now() },
    historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
    historyFuture: [],
  })),
  updateBall: (patch) => set(({ project }) => ({ project: { ...project, ball: { ...project.ball, ...patch }, updatedAt: now() } })),
  addDrawing: (drawing) => set(({ project, historyPast }) => ({ project: { ...project, drawings: [...project.drawings, drawing], updatedAt: now() }, selectedId: drawing.id, selectedIds: [drawing.id], historyPast: [...historyPast.slice(-49), snapshotBoard(project)], historyFuture: [] })),
  updateDrawing: (drawingId, patch) => set(({ project }) => ({ project: { ...project, drawings: project.drawings.map(d => d.id === drawingId ? { ...d, ...patch } : d), updatedAt: now() }, historyFuture: [] })),
  commitDrawingUpdate: (drawingId, patch) => set(({ project, historyPast }) => ({
    project: { ...project, drawings: project.drawings.map(d => d.id === drawingId ? { ...d, ...patch } : d), updatedAt: now() },
    historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
    historyFuture: [],
  })),
  moveSelectedItems: (itemIds, dx, dy) => set(({ project, historyPast }) => {
    const fixedFollowAreaIds = new Set(project.drawings
      .filter(drawing => drawing.type === 'polygon-zone' && drawing.followPlayers)
      .map(drawing => drawing.id));
    const movableItemIds = itemIds.filter(itemId => !fixedFollowAreaIds.has(itemId));
    if (!movableItemIds.length) return {};
    const nextTeams = project.teams.map(team => ({
      ...team,
      squad: team.squad.map(player => movableItemIds.includes(player.id)
        ? { ...player, x: clamp01(player.x + dx), y: clamp01(player.y + dy) }
        : player),
    }));
    const playerPositions = new Map(nextTeams.flatMap(team => team.squad.map(player => [player.id, { x: player.x, y: player.y }] as const)));
    const movedDrawings = project.drawings.map(drawing => movableItemIds.includes(drawing.id) ? translateDrawing(drawing, dx, dy) : drawing);
    const nextDrawings = movedDrawings.map(drawing => {
      if (drawing.type !== 'polygon-zone' || !drawing.followPlayers || !drawing.linkedPlayerIds?.length) return drawing;
      const points = drawing.linkedPlayerIds.flatMap(playerId => {
        const point = playerPositions.get(playerId);
        return point ? [point.x, point.y] : [];
      });
      return points.length >= 6 ? { ...drawing, points } : drawing;
    });
    return {
      project: {
        ...project,
        ball: movableItemIds.includes('ball')
          ? { ...project.ball, x: clamp01(project.ball.x + dx), y: clamp01(project.ball.y + dy) }
          : project.ball,
        teams: nextTeams,
        drawings: nextDrawings,
        updatedAt: now(),
      },
      historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
      historyFuture: [],
    };
  }),
  removeDrawing: (drawingId) => set(({ project, selectedIds, historyPast }) => ({ project: { ...project, drawings: project.drawings.filter(d => d.id !== drawingId), updatedAt: now() }, selectedId: undefined, selectedIds: selectedIds.filter(id => id !== drawingId), historyPast: [...historyPast.slice(-49), snapshotBoard(project)], historyFuture: [] })),
  removeSelectedDrawings: () => set(({ project, selectedIds, historyPast }) => ({ project: { ...project, drawings: project.drawings.filter(d => !selectedIds.includes(d.id)), updatedAt: now() }, selectedId: undefined, selectedIds: selectedIds.filter(id => !project.drawings.some(d => d.id === id)), historyPast: [...historyPast.slice(-49), snapshotBoard(project)], historyFuture: [] })),
  duplicateSelectedDrawings: () => set(({ project, selectedIds, historyPast }) => {
    const highestZIndex = project.drawings.reduce((highest, drawing) => Math.max(highest, drawing.zIndex), 0);
    const copies = project.drawings
      .filter(drawing => selectedIds.includes(drawing.id))
      .map((drawing, index) => {
        const translated = translateDrawing(drawing, 0.035 + index * 0.008, 0.028 + index * 0.008);
        return {
          ...translated,
          id: id(),
          points: [...translated.points],
          linkedPlayerIds: translated.linkedPlayerIds ? [...translated.linkedPlayerIds] : undefined,
          followPlayers: translated.type === 'polygon-zone' ? false : translated.followPlayers,
          zIndex: highestZIndex + index + 1,
        };
      });
    if (!copies.length) return {};
    return {
      project: { ...project, drawings: [...project.drawings, ...copies], updatedAt: now() },
      selectedId: copies[0].id,
      selectedIds: copies.map(drawing => drawing.id),
      historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
      historyFuture: [],
    };
  }),
  undoLastDrawing: () => set(({ project, historyPast, historyFuture }) => {
    const previous = historyPast.at(-1);
    if (!previous) return {};
    return {
      project: restoreBoard(project, previous),
      selectedId: undefined,
      selectedIds: [],
      historyPast: historyPast.slice(0, -1),
      historyFuture: [...historyFuture.slice(-49), snapshotBoard(project)],
    };
  }),
  redoLastDrawing: () => set(({ project, historyPast, historyFuture }) => {
    const next = historyFuture.at(-1);
    if (!next) return {};
    return {
      project: restoreBoard(project, next),
      selectedId: undefined,
      selectedIds: [],
      historyPast: [...historyPast.slice(-49), snapshotBoard(project)],
      historyFuture: historyFuture.slice(0, -1),
    };
  }),
  clearDrawings: () => set(({ project, historyPast }) => ({ project: { ...project, drawings: [], updatedAt: now() }, selectedId: undefined, selectedIds: [], historyPast: [...historyPast.slice(-49), snapshotBoard(project)], historyFuture: [] })),
  addScene: () => set(({ project }) => {
    const scene: Scene = {
      id: id(),
      name: `Scene ${project.scenes.length + 1}`,
      duration: 2,
      transition: 'ease-in-out',
      playerPositions: Object.fromEntries(project.teams.flatMap(team => team.squad).map(player => [player.id, { x: player.x, y: player.y }])),
      ball: { ...project.ball },
      drawings: project.drawings.map(drawing => ({ ...drawing, points: [...drawing.points] })),
      camera: { x: 0, y: 0, zoom: 1 },
    };
    return { project: { ...project, scenes: [...project.scenes, scene], updatedAt: now() } };
  }),
  updateScene: (sceneId, patch) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.map(s => s.id === sceneId ? { ...s, ...patch } : s), updatedAt: now() } })),
  duplicateScene: (sceneId) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.flatMap(s => s.id === sceneId ? [s, { ...s, id: id(), name: `${s.name} copy` }] : [s]), updatedAt: now() } })),
  renameScene: (sceneId, name) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.map(s => s.id === sceneId ? { ...s, name } : s), updatedAt: now() } })),
  deleteScene: (sceneId) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.filter(s => s.id !== sceneId), updatedAt: now() } })),
  applyScene: (sceneId) => {
    const scene = get().project.scenes.find(candidate => candidate.id === sceneId);
    if (!scene) return;
    set(({ project }) => ({
      project: {
        ...project,
        ball: { ...scene.ball },
        drawings: scene.drawings.map(drawing => ({ ...drawing, points: [...drawing.points] })),
        teams: project.teams.map(team => ({
          ...team,
          squad: team.squad.map(player => scene.playerPositions[player.id] ? { ...player, ...scene.playerPositions[player.id] } : player),
        })),
      },
      historyPast: [],
      historyFuture: [],
    }));
  },
  importProject: (project) => set({ project: { ...project, updatedAt: now() }, historyPast: [], historyFuture: [] }),
}), {
  name: 'tactical-studio-session-v5',
  version: 9,
  storage: createJSONStorage(() => sessionStorage),
  migrate: (persisted) => {
    const state = persisted as Partial<Store>;
    if (!state.project) return state as Store;
    return {
      ...state,
      project: {
        ...state.project,
        settings: { ...defaultSettings, ...state.project.settings },
        ball: { ...state.project.ball, size: 15 },
        teams: state.project.teams.map(team => ({
          ...team,
          goalkeeperColor: team.goalkeeperColor ?? team.squad.find(player => player.position === 'GK')?.color ?? '#f59e0b',
          showBadge: team.showBadge ?? true,
          showNumbers: team.showNumbers ?? true,
          showNames: team.showNames ?? true,
          squad: team.squad.map(player => ({ ...player, showNumber: player.showNumber ?? true })),
        })),
        drawings: state.project.drawings.map(drawing => ({ ...drawing, fillPattern: drawing.fillPattern ?? 'diagonal' })),
      },
      tool: 'select',
      toolStyle: { ...defaultToolStyle, ...state.toolStyle, dashed: false },
      dockPosition: state.dockPosition ?? 'bottom',
      dockTab: state.dockTab ?? 'page',
      historyPast: [],
      historyFuture: [],
    } as Store;
  },
  partialize: (state) => ({
    project: state.project,
    toolStyle: state.toolStyle,
    viewZoom: state.viewZoom,
    dockPosition: state.dockPosition,
    dockTab: state.dockTab,
  }),
}));
