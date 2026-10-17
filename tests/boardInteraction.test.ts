import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boardDragMoved, constrainBoardMove } from '../src/utils/boardInteraction';
import { boardCanvasPixelRatio, boardFitZoom, boardZoomBaseline, clampBoardZoom } from '../src/utils/boardZoom';
import { trackBoardPointer } from '../src/utils/boardPointer';
const memory = new Map<string, string>();
let storageWrites = 0;
globalThis.sessionStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { storageWrites += 1; memory.set(key, value); }, removeItem: key => { memory.delete(key); }, clear: () => memory.clear(), key: index => [...memory.keys()][index] ?? null, get length() { return memory.size; } };
const { useTacticsStore } = await import('../src/store/tacticsStore');
import type { Drawing } from '../src/types/domain';

const freshProject = () => structuredClone(useTacticsStore.getState().project);
const area = (patch: Partial<Drawing> = {}): Drawing => ({ id: 'area', type: 'zone', points: [.2, .2, .3, .2], color: '#fff', strokeWidth: 2, opacity: .5, dashed: false, locked: false, hidden: false, zIndex: 1, ...patch });

test('portrait percentages use a closer baseline and Fit still shows the full board', () => {
  assert.equal(boardZoomBaseline('portrait'), 1.5);
  assert.equal(boardFitZoom('portrait') * boardZoomBaseline('portrait'), 1);
  assert.equal(boardZoomBaseline('landscape'), 1);
  assert.equal(boardFitZoom('landscape'), 1);
  assert.equal(clampBoardZoom(.1, 'portrait'), .5);
  assert.equal(clampBoardZoom(.1, 'landscape'), .8);
});

test('zoomed pieces receive display-resolution pixels within the canvas memory budget', () => {
  assert.equal(boardCanvasPixelRatio(300, 400, 3, 2, false), 6);
  assert.equal(boardCanvasPixelRatio(400, 600, 1.5, 2, true), 3);
  const capped = boardCanvasPixelRatio(900, 600, 4.5, 3, true);
  assert.ok(900 * 600 * capped ** 2 <= 4_000_001);
});

test('a quick release can commit a drag without a preceding move event', () => {
  const start = { x: .3, y: .4 };
  assert.equal(boardDragMoved(start, { x: .32, y: .4 }, { width: 800, height: 500 }), true);
  assert.equal(boardDragMoved(start, { x: .301, y: .4 }, { width: 800, height: 500 }), false);
});

function fixture() {
  const project = freshProject();
  project.teams[0].squad[0] = { ...project.teams[0].squad[0], x: .1, y: .3, locked: false, hidden: false, starter: true };
  project.teams[0].squad[1] = { ...project.teams[0].squad[1], x: .7, y: .6, locked: false, hidden: false, starter: true };
  project.ball = { ...project.ball, x: .5, y: .5, locked: false };
  project.drawings = [];
  return project;
}

function pointerEvent(type: string, pointerId: number, clientX = 0, clientY = 0) {
  const event = new Event(type);
  Object.assign(event, { pointerId, clientX, clientY });
  return event;
}

test('losing canvas capture before release still saves the player position exactly once', () => {
  const target = new EventTarget();
  const project = fixture();
  const playerId = project.teams[0].squad[0].id;
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  let preview = { x: 0, y: 0 };
  trackBoardPointer(target, 7, {
    move: event => { preview = { x: event.clientX / 1000, y: event.clientY / 1000 }; },
    release: event => useTacticsStore.getState().moveSelectedItems([playerId], event.clientX / 1000, event.clientY / 1000),
    interrupt: () => assert.fail('Capture loss must not cancel the gesture'),
  });
  target.dispatchEvent(pointerEvent('pointermove', 7, 80, 50));
  target.dispatchEvent(pointerEvent('lostpointercapture', 7));
  target.dispatchEvent(pointerEvent('pointerup', 7, 80, 50));
  target.dispatchEvent(pointerEvent('pointerup', 7, 80, 50));
  assert.deepEqual(preview, { x: .08, y: .05 });
  assert.equal(useTacticsStore.getState().project.teams[0].squad[0].x, .18);
  assert.equal(useTacticsStore.getState().project.teams[0].squad[0].y, .35);
  assert.equal(useTacticsStore.getState().project.teams[0].squad[0].starter, true);
  assert.equal(useTacticsStore.getState().historyPast.length, 1);
});

for (const interruption of ['pointercancel', 'blur']) test(`${interruption} keeps the last preview and ignores later release events`, () => {
  const target = new EventTarget();
  let lastPosition = 0;
  let savedPosition = 0;
  let finishes = 0;
  trackBoardPointer(target, 3, {
    move: event => { lastPosition = event.clientX; },
    release: () => { finishes += 1; },
    interrupt: () => { savedPosition = lastPosition; finishes += 1; },
  });
  target.dispatchEvent(pointerEvent('pointermove', 3, 200));
  target.dispatchEvent(pointerEvent('pointermove', 4, 800));
  target.dispatchEvent(interruption === 'blur' ? new Event('blur') : pointerEvent(interruption, 3));
  target.dispatchEvent(pointerEvent('pointerup', 3, 200));
  assert.equal(savedPosition, 200);
  assert.equal(finishes, 1);
});

test('Escape cleanup removes drag listeners without saving or restoring another gesture', () => {
  const target = new EventTarget();
  let callbacks = 0;
  const stop = trackBoardPointer(target, 9, {
    move: () => { callbacks += 1; }, release: () => { callbacks += 1; }, interrupt: () => { callbacks += 1; },
  });
  stop();
  target.dispatchEvent(pointerEvent('pointermove', 9, 100));
  target.dispatchEvent(pointerEvent('pointerup', 9, 100));
  target.dispatchEvent(new Event('blur'));
  assert.equal(callbacks, 0);
});

test('group dragging stops at the edge without changing the formation', () => {
  const project = fixture();
  const ids = project.teams[0].squad.slice(0, 2).map(player => player.id);
  const move = constrainBoardMove(project, ids, 5, -4);
  assert.ok(Math.abs(move.dx - .3) < 1e-10);
  assert.equal(move.dy, -.3);
  assert.deepEqual(move.ids, ids);
});

test('locked, hidden, and substitute players cannot move with a selection', () => {
  const project = fixture();
  const players = project.teams[0].squad.slice(0, 3);
  players[0].locked = true;
  players[1].hidden = true;
  players[2].starter = false;
  project.ball.locked = true;
  project.drawings = [area({ locked: true }), area({ id: 'hidden', hidden: true }), area({ id: 'linked', type: 'polygon-zone', points: [.1,.1,.2,.2,.3,.1], followPlayers: true })];
  assert.deepEqual(constrainBoardMove(project, [...players.map(player => player.id), 'ball', 'area', 'hidden', 'linked'], .2, .2).ids, []);
});

test('rectangle and multi-point drawings use their full bounds', () => {
  const project = fixture();
  project.drawings = [area(), area({ id: 'arrow', type: 'arrow', points: [.3,.1,.8,.4,.5,.3] })];
  const move = constrainBoardMove(project, ['area', 'arrow'], 2, -2);
  assert.ok(Math.abs(move.dx - .2) < 1e-10);
  assert.equal(move.dy, -.1);
});

test('non-finite pointer coordinates never corrupt a board', () => {
  const project = fixture();
  const move = constrainBoardMove(project, ['ball'], NaN, Infinity);
  assert.equal(move.dx, 0);
  assert.equal(move.dy, 0);
});

test('a committed multi-player move is exactly one reversible history entry', () => {
  const project = fixture();
  const ids = project.teams[0].squad.slice(0, 2).map(player => player.id);
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  useTacticsStore.getState().moveSelectedItems(ids, .08, .06);
  const moved = structuredClone(useTacticsStore.getState().project);
  assert.equal(useTacticsStore.getState().historyPast.length, 1);
  assert.equal(moved.teams[0].squad[0].x, .18);
  useTacticsStore.getState().undoLastDrawing();
  assert.deepEqual(useTacticsStore.getState().project.teams, project.teams);
  useTacticsStore.getState().redoLastDrawing();
  assert.deepEqual(useTacticsStore.getState().project.teams, moved.teams);
});

test('preview constraints match committed positions, including locked players', () => {
  const project = fixture();
  project.teams[0].squad[1].locked = true;
  const ids = [...project.teams[0].squad.slice(0,2).map(player => player.id), 'ball'];
  const preview = constrainBoardMove(project, ids, 2, 2);
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  useTacticsStore.getState().moveSelectedItems(ids, 2, 2);
  const committed = useTacticsStore.getState().project;
  assert.equal(committed.teams[0].squad[0].x, project.teams[0].squad[0].x + preview.dx);
  assert.equal(committed.ball.y, project.ball.y + preview.dy);
  assert.deepEqual(committed.teams[0].squad[1], project.teams[0].squad[1]);
});

test('linked areas follow their players and restore with undo', () => {
  const project = fixture();
  const players = project.teams[0].squad.slice(0,3);
  project.drawings = [area({ type: 'polygon-zone', followPlayers: true, linkedPlayerIds: players.map(p => p.id), points: players.flatMap(p => [p.x,p.y]) })];
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  useTacticsStore.getState().moveSelectedItems([players[0].id], .03, .02);
  assert.equal(useTacticsStore.getState().project.drawings[0].points[0], .13);
  useTacticsStore.getState().undoLastDrawing();
  assert.deepEqual(useTacticsStore.getState().project.drawings, project.drawings);
});

test('clicks and blocked movement do not create undo entries', () => {
  const project = fixture();
  project.ball.x = 1;
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  useTacticsStore.getState().moveSelectedItems(['ball'], .2, 0);
  useTacticsStore.getState().moveSelectedItems(['ball'], 0, 0);
  assert.equal(useTacticsStore.getState().historyPast.length, 0);
});

test('scenes and project JSON retain moved player positions', () => {
  const project = fixture();
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [] });
  const playerId = project.teams[0].squad[0].id;
  useTacticsStore.getState().moveSelectedItems([playerId], .1, .1);
  useTacticsStore.getState().addScene();
  const saved = JSON.parse(JSON.stringify(useTacticsStore.getState().project));
  const scene = saved.scenes.at(-1);
  assert.deepEqual(scene.playerPositions[playerId], { x: .2, y: .4 });
  useTacticsStore.getState().moveSelectedItems([playerId], .2, .1);
  useTacticsStore.getState().applyScene(scene.id);
  assert.equal(useTacticsStore.getState().project.teams[0].squad[0].x, .2);
});


test('selection and playback do not serialize the project on every frame', () => {
  const project = fixture();
  useTacticsStore.setState({ project, historyPast: [], historyFuture: [], playing: false });
  const before = storageWrites;
  const state = useTacticsStore.getState();
  state.select(project.teams[0].squad[0].id);
  for (let frame = 0; frame < 60; frame += 1) state.setPlaybackFrame({ playerPositions: {}, ball: project.ball, drawings: [] });
  state.clearPlaybackFrame();
  assert.equal(storageWrites, before);
  state.moveSelectedItems(['ball'], .1, .1);
  assert.equal(storageWrites, before + 1);
});

test('returning zoom to its saved value cancels a pending stale write', async () => {
  useTacticsStore.setState({ project: fixture(), viewZoom: 1 });
  const before = storageWrites;
  useTacticsStore.getState().setViewZoom(2);
  useTacticsStore.getState().setViewZoom(1);
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.equal(storageWrites, before);
  assert.equal(JSON.parse(memory.get('tactical-studio-session-v5')!).state.viewZoom, 1);
});
