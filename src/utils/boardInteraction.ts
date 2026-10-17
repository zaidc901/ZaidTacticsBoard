import type { Project } from '../types/domain';

/** Check the final pointer position as well as moves, including quick releases. */
export function boardDragMoved(start: { x: number; y: number }, end: { x: number; y: number }, displayedPitch: { width: number; height: number }) {
  return Math.hypot((end.x - start.x) * displayedPitch.width, (end.y - start.y) * displayedPitch.height) >= 3;
}

/** A single shared constraint keeps the preview and committed move identical. */
export function constrainBoardMove(project: Project, requestedIds: string[], dx: number, dy: number) {
  const requested = new Set(requestedIds);
  const ids: string[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  const include = (id: string, points: number[]) => {
    ids.push(id);
    points.forEach((point, index) => (index % 2 === 0 ? xs : ys).push(point));
  };
  project.teams.forEach(team => team.squad.forEach(player => {
    if (requested.has(player.id) && player.starter && !player.hidden && !player.locked) include(player.id, [player.x, player.y]);
  }));
  if (requested.has('ball') && !project.ball.locked) include('ball', [project.ball.x, project.ball.y]);
  project.drawings.forEach(drawing => {
    if (!requested.has(drawing.id) || drawing.locked || drawing.hidden || (drawing.type === 'polygon-zone' && drawing.followPlayers)) return;
    const points = drawing.type === 'zone'
      ? [drawing.points[0], drawing.points[1], drawing.points[0] + drawing.points[2], drawing.points[1] + drawing.points[3]]
      : drawing.points;
    if (points.length) include(drawing.id, points);
  });
  const bound = (delta: number, values: number[]) => values.length && Number.isFinite(delta)
    ? Math.max(-Math.min(...values), Math.min(1 - Math.max(...values), delta))
    : 0;
  return { ids, dx: bound(dx, xs), dy: bound(dy, ys) };
}
