import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formations, FormationKey } from '../data/formations';
import { Ball, BoardSettings, Drawing, Player, Project, Scene, Team, Tool } from '../types/domain';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const defaultSettings: BoardSettings = {
  format: 'portrait', width: 1080, height: 1920, customWidth: 1080, customHeight: 1920,
  grassColor: '#177536', lineColor: '#e9fff0', lineThickness: 4, stripeIntensity: 0.16,
  backgroundColor: '#071015', border: true, grid: 'five-lanes', crop: 'full', flipDirection: false,
  theme: 'broadcast', accentColor: '#61f4a2',
};

const names = ['Keeper', 'Fullback', 'Stopper', 'Anchor', 'Centre Back', 'Six', 'Winger', 'Creator', 'Striker', 'Runner', 'Wide Forward'];

function makeTeam(seed: number, name: string, primaryColor: string, secondaryColor: string, formation: FormationKey, invert = false): Team {
  const coords = formations[formation];
  return {
    id: `team-${seed}`, name, shortName: seed === 1 ? 'HOM' : 'AWY', primaryColor, secondaryColor, formation,
    squad: coords.map((p, index) => ({
      id: `p-${seed}-${index + 1}`, teamId: `team-${seed}`, fullName: `${name} ${names[index]}`,
      displayName: names[index].toUpperCase(), number: index + 1, position: ['GK','DF','DF','DF','DF','MF','MF','MF','FW','FW','FW'][index] ?? 'SUB',
      x: p.x, y: invert ? 1 - p.y : p.y, color: primaryColor, secondaryColor, outline: '#ffffff', opacity: 1,
      labelPosition: 'bottom', markerStyle: 'circle', starter: true, locked: false, hidden: false, zIndex: index + seed * 20,
    })),
  };
}

const initialBall: Ball = { x: 0.5, y: 0.5, size: 20, locked: false };
const createInitialProject = (): Project => ({
  id: id(), name: 'Sample vertical match analysis', settings: defaultSettings, ball: initialBall,
  teams: [makeTeam(1, 'Aurora FC', '#ef3b2d', '#ffffff', '4-2-3-1'), makeTeam(2, 'North City', '#1f2937', '#d1fae5', '4-3-3', true)],
  drawings: [
    { id: id(), type: 'zone', points: [0.22, 0.28, 0.56, 0.22], color: '#f7d154', fill: '#f7d154', strokeWidth: 3, opacity: 0.25, dashed: false, locked: false, hidden: false, zIndex: 2 },
    { id: id(), type: 'arrow', points: [0.42, 0.62, 0.52, 0.44, 0.62, 0.3], color: '#61f4a2', strokeWidth: 5, opacity: 0.95, dashed: false, locked: false, hidden: false, zIndex: 3 },
  ],
  scenes: [], updatedAt: now(),
});

interface Store {
  project: Project;
  selectedId?: string;
  tool: Tool;
  leftOpen: boolean;
  rightOpen: boolean;
  playing: boolean;
  setTool: (tool: Tool) => void;
  select: (id?: string) => void;
  updateSettings: (patch: Partial<BoardSettings>) => void;
  updatePlayer: (playerId: string, patch: Partial<Player>) => void;
  movePlayer: (playerId: string, x: number, y: number) => void;
  addPlayer: (teamId: string) => void;
  removePlayer: (playerId: string) => void;
  duplicatePlayer: (playerId: string) => void;
  applyFormation: (teamId: string, formation: FormationKey) => void;
  updateTeam: (teamId: string, patch: Partial<Team>) => void;
  moveBall: (x: number, y: number) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (drawingId: string, patch: Partial<Drawing>) => void;
  removeDrawing: (drawingId: string) => void;
  clearDrawings: () => void;
  addScene: () => void;
  duplicateScene: (sceneId: string) => void;
  renameScene: (sceneId: string, name: string) => void;
  deleteScene: (sceneId: string) => void;
  applyScene: (sceneId: string) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  importProject: (project: Project) => void;
}

export const useTacticsStore = create<Store>()(persist((set, get) => ({
  project: createInitialProject(), tool: 'select', leftOpen: true, rightOpen: true, playing: false,
  setTool: (tool) => set({ tool }), select: (selectedId) => set({ selectedId }),
  updateSettings: (patch) => set(({ project }) => ({ project: { ...project, settings: { ...project.settings, ...patch }, updatedAt: now() } })),
  updatePlayer: (playerId, patch) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => ({ ...t, squad: t.squad.map(p => p.id === playerId ? { ...p, ...patch } : p) })), updatedAt: now() } })),
  movePlayer: (playerId, x, y) => get().updatePlayer(playerId, { x, y }),
  addPlayer: (teamId) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === teamId ? { ...t, squad: [...t.squad, { id: id(), teamId, fullName: 'New Player', displayName: 'NEW', number: t.squad.length + 1, position: 'SUB', x: 0.1, y: 0.1 + (t.squad.length % 8) * 0.08, color: t.primaryColor, secondaryColor: t.secondaryColor, outline: '#fff', opacity: 1, labelPosition: 'bottom', markerStyle: 'circle', starter: false, locked: false, hidden: false, zIndex: 99 }] } : t), updatedAt: now() } })),
  removePlayer: (playerId) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => ({ ...t, squad: t.squad.filter(p => p.id !== playerId) })), updatedAt: now() }, selectedId: undefined })),
  duplicatePlayer: (playerId) => { const player = get().project.teams.flatMap(t => t.squad).find(p => p.id === playerId); if (!player) return; set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === player.teamId ? { ...t, squad: [...t.squad, { ...player, id: id(), x: Math.min(0.95, player.x + 0.04), y: Math.min(0.95, player.y + 0.04), displayName: `${player.displayName} 2` }] } : t), updatedAt: now() } })); },
  applyFormation: (teamId, formation) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => { if (t.id !== teamId) return t; const invert = t.id === 'team-2'; const coords = formations[formation]; return { ...t, formation, squad: t.squad.map((p, i) => coords[i] ? { ...p, x: coords[i].x, y: invert ? 1 - coords[i].y : coords[i].y, starter: i < 11 } : p) }; }), updatedAt: now() } })),
  updateTeam: (teamId, patch) => set(({ project }) => ({ project: { ...project, teams: project.teams.map(t => t.id === teamId ? { ...t, ...patch, squad: t.squad.map(p => ({ ...p, color: patch.primaryColor ?? p.color, secondaryColor: patch.secondaryColor ?? p.secondaryColor })) } : t), updatedAt: now() } })),
  moveBall: (x, y) => set(({ project }) => ({ project: { ...project, ball: { ...project.ball, x, y }, updatedAt: now() } })),
  addDrawing: (drawing) => set(({ project }) => ({ project: { ...project, drawings: [...project.drawings, drawing], updatedAt: now() } })),
  updateDrawing: (drawingId, patch) => set(({ project }) => ({ project: { ...project, drawings: project.drawings.map(d => d.id === drawingId ? { ...d, ...patch } : d), updatedAt: now() } })),
  removeDrawing: (drawingId) => set(({ project }) => ({ project: { ...project, drawings: project.drawings.filter(d => d.id !== drawingId), updatedAt: now() }, selectedId: undefined })),
  clearDrawings: () => set(({ project }) => ({ project: { ...project, drawings: [], updatedAt: now() } })),
  addScene: () => set(({ project }) => { const scene: Scene = { id: id(), name: `Scene ${project.scenes.length + 1}`, duration: 2, transition: 'ease-in-out', playerPositions: Object.fromEntries(project.teams.flatMap(t => t.squad).map(p => [p.id, { x: p.x, y: p.y }])), ball: project.ball, drawings: project.drawings, camera: { x: 0, y: 0, zoom: 1 } }; return { project: { ...project, scenes: [...project.scenes, scene], updatedAt: now() } }; }),
  duplicateScene: (sceneId) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.flatMap(s => s.id === sceneId ? [s, { ...s, id: id(), name: `${s.name} copy` }] : [s]), updatedAt: now() } })),
  renameScene: (sceneId, name) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.map(s => s.id === sceneId ? { ...s, name } : s), updatedAt: now() } })),
  deleteScene: (sceneId) => set(({ project }) => ({ project: { ...project, scenes: project.scenes.filter(s => s.id !== sceneId), updatedAt: now() } })),
  applyScene: (sceneId) => { const scene = get().project.scenes.find(s => s.id === sceneId); if (!scene) return; set(({ project }) => ({ project: { ...project, ball: scene.ball, drawings: scene.drawings, teams: project.teams.map(t => ({ ...t, squad: t.squad.map(p => scene.playerPositions[p.id] ? { ...p, ...scene.playerPositions[p.id] } : p) })) } })); },
  toggleLeft: () => set(s => ({ leftOpen: !s.leftOpen })), toggleRight: () => set(s => ({ rightOpen: !s.rightOpen })),
  importProject: (project) => set({ project: { ...project, updatedAt: now() } }),
}), { name: 'tactical-studio-project' }));
