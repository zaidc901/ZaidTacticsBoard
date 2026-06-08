import { RefObject, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Arrow, Label, Tag } from 'react-konva';
import Konva from 'konva';
import { useTacticsStore } from '../store/tacticsStore';
import { Drawing } from '../types/domain';

const pitchMargin = 54;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const toAbs = (points: number[], w: number, h: number) => points.map((point, i) => (i % 2 ? pitchMargin + point * (h - pitchMargin * 2) : pitchMargin + point * (w - pitchMargin * 2)));
const toRel = (x: number, y: number, w: number, h: number) => ({ x: clamp((x - pitchMargin) / (w - pitchMargin * 2)), y: clamp((y - pitchMargin) / (h - pitchMargin * 2)) });

function Pitch({ width, height }: { width: number; height: number }) {
  const settings = useTacticsStore(s => s.project.settings);
  const pw = width - pitchMargin * 2;
  const ph = height - pitchMargin * 2;
  const x = pitchMargin;
  const y = pitchMargin;
  const boxW = pw * 0.56;
  const boxH = ph * 0.16;
  const sixW = pw * 0.28;
  const sixH = ph * 0.065;
  const stripeCount = 12;
  return <Group>
    <Rect x={0} y={0} width={width} height={height} fill={settings.backgroundColor} cornerRadius={34} />
    <Rect x={x - 16} y={y - 16} width={pw + 32} height={ph + 32} fill="#071b13" opacity={0.55} cornerRadius={24} shadowBlur={24} shadowColor={settings.accentColor} />
    {Array.from({ length: stripeCount }).map((_, i) => <Rect key={i} x={x} y={y + (ph / stripeCount) * i} width={pw} height={ph / stripeCount} fill={settings.grassColor} opacity={i % 2 ? 1 : 1 - settings.stripeIntensity} />)}
    <Rect x={x} y={y} width={pw} height={ph} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Line points={[x, y + ph / 2, x + pw, y + ph / 2]} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Circle x={x + pw / 2} y={y + ph / 2} radius={pw * 0.16} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Circle x={x + pw / 2} y={y + ph / 2} radius={5} fill={settings.lineColor} />
    <Rect x={x + (pw - boxW) / 2} y={y} width={boxW} height={boxH} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Rect x={x + (pw - sixW) / 2} y={y} width={sixW} height={sixH} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Rect x={x + (pw - boxW) / 2} y={y + ph - boxH} width={boxW} height={boxH} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Rect x={x + (pw - sixW) / 2} y={y + ph - sixH} width={sixW} height={sixH} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Rect x={x + pw * 0.4} y={y - 18} width={pw * 0.2} height={18} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Rect x={x + pw * 0.4} y={y + ph} width={pw * 0.2} height={18} stroke={settings.lineColor} strokeWidth={settings.lineThickness} />
    <Circle x={x + pw / 2} y={y + ph * 0.11} radius={5} fill={settings.lineColor} />
    <Circle x={x + pw / 2} y={y + ph * 0.89} radius={5} fill={settings.lineColor} />
    <Line points={[x, y + 18, x + 18, y, x + pw - 18, y, x + pw, y + 18, x + pw, y + ph - 18, x + pw - 18, y + ph, x + 18, y + ph, x, y + ph - 18]} stroke={settings.lineColor} strokeWidth={settings.lineThickness} opacity={0.9} />
    {settings.grid !== 'none' && <Group opacity={0.24}>
      {[1/3, 2/3].map(v => <Line key={`h-${v}`} points={[x, y + ph * v, x + pw, y + ph * v]} stroke={settings.lineColor} dash={[8, 16]} />)}
      {[0.2, 0.4, 0.6, 0.8].map(v => <Line key={`v-${v}`} points={[x + pw * v, y, x + pw * v, y + ph]} stroke={settings.lineColor} dash={[8, 16]} />)}
    </Group>}
  </Group>;
}

function PlayerMarker({ player, width, height }: { player: any; width: number; height: number }) {
  const { selectedId, select, movePlayer, updatePlayer, removePlayer, duplicatePlayer } = useTacticsStore();
  const abs = toAbs([player.x, player.y], width, height);
  const selected = selectedId === player.id;
  if (player.hidden) return null;
  return <Group x={abs[0]} y={abs[1]} draggable={!player.locked} onClick={() => select(player.id)} onTap={() => select(player.id)}
    onDblClick={() => updatePlayer(player.id, { locked: !player.locked })}
    onDragEnd={(e) => { const p = toRel(e.target.x(), e.target.y(), width, height); movePlayer(player.id, p.x, p.y); }}>
    <Circle radius={22} fill={player.color} stroke={selected ? '#61f4a2' : player.outline} strokeWidth={selected ? 5 : 3} shadowBlur={selected ? 18 : 8} shadowColor="#000" opacity={player.opacity} />
    <Circle radius={17} stroke={player.secondaryColor} strokeWidth={2} opacity={0.6} />
    <Text text={String(player.number)} width={44} x={-22} y={-9} align="center" fill="#fff" fontStyle="bold" fontSize={17} />
    <Label x={-42} y={27} opacity={player.opacity}>
      <Tag fill={player.color} stroke={player.outline} strokeWidth={1.5} cornerRadius={5} pointerDirection="up" pointerWidth={10} pointerHeight={6} shadowBlur={8} shadowColor="#000" />
      <Text text={player.displayName} width={84} height={22} align="center" verticalAlign="middle" fill="#fff" fontSize={10} fontStyle="bold" letterSpacing={0.6} />
    </Label>
    {selected && <Group y={58}>
      <Text text="⧉" x={-18} y={0} fontSize={18} fill="#d1fae5" onClick={() => duplicatePlayer(player.id)} />
      <Text text="×" x={8} y={0} fontSize={22} fill="#fecaca" onClick={() => removePlayer(player.id)} />
    </Group>}
  </Group>;
}

function BallMarker({ width, height }: { width: number; height: number }) {
  const { project, moveBall, select, selectedId } = useTacticsStore();
  const abs = toAbs([project.ball.x, project.ball.y], width, height);
  return <Group x={abs[0]} y={abs[1]} draggable={!project.ball.locked} onClick={() => select('ball')} onDragEnd={e => { const p = toRel(e.target.x(), e.target.y(), width, height); moveBall(p.x, p.y); }}>
    <Circle radius={project.ball.size / 2} fill="#f8fafc" stroke={selectedId === 'ball' ? '#61f4a2' : '#0f172a'} strokeWidth={2} shadowBlur={12} />
    <Text text="⚽" x={-10} y={-10} fontSize={18} />
  </Group>;
}

function DrawingShape({ drawing, width, height }: { drawing: Drawing; width: number; height: number }) {
  const { select, selectedId } = useTacticsStore();
  if (drawing.hidden) return null;
  const points = toAbs(drawing.points, width, height);
  const common = { stroke: selectedId === drawing.id ? '#61f4a2' : drawing.color, strokeWidth: drawing.strokeWidth, opacity: drawing.opacity, dash: drawing.dashed ? [16, 10] : undefined, onClick: () => select(drawing.id) };
  if (drawing.type === 'zone') return <Rect x={points[0]} y={points[1]} width={points[2] * (width - pitchMargin * 2)} height={points[3] * (height - pitchMargin * 2)} fill={drawing.fill} {...common} />;
  if (drawing.type === 'text') return <Text x={points[0]} y={points[1]} text={drawing.text ?? 'Tactical note'} fill={drawing.color} fontSize={30} fontStyle="bold" />;
  return <Arrow points={points} pointerLength={18} pointerWidth={18} tension={drawing.type === 'curve' ? 0.45 : 0} lineCap="round" lineJoin="round" {...common} />;
}

export function PitchCanvas({ stageRef }: { stageRef: RefObject<Konva.Stage | null> }) {
  const { project, tool, addDrawing, select } = useTacticsStore();
  const [draft, setDraft] = useState<number[] | null>(null);
  const { width, height } = project.settings;
  const scale = useMemo(() => Math.max(0.25, Math.min(1, Math.min((window.innerWidth - 520) / width, (window.innerHeight - 190) / height))), [width, height]);
  const pointerRel = (stage: Konva.Stage) => { const p = stage.getPointerPosition() ?? { x: 0, y: 0 }; return toRel(p.x / scale, p.y / scale, width, height); };
  return <div className="rounded-[2rem] border border-white/10 bg-black/30 p-3 shadow-2xl">
    <Stage ref={stageRef} width={width * scale} height={height * scale} scale={{ x: scale, y: scale }} onMouseDown={(e) => {
      if (e.target === e.target.getStage()) select(undefined);
      if (tool !== 'select') { const rel = pointerRel(e.target.getStage()!); setDraft([rel.x, rel.y]); }
    }} onMouseUp={(e) => {
      if (!draft || tool === 'select') return;
      const rel = pointerRel(e.target.getStage()!);
      const drawing: Drawing = { id: crypto.randomUUID(), type: tool === 'zone' ? 'zone' : tool === 'text' ? 'text' : tool === 'run' ? 'curve' : 'arrow', points: tool === 'zone' ? [draft[0], draft[1], rel.x - draft[0], rel.y - draft[1]] : [draft[0], draft[1], rel.x, rel.y], text: 'New insight', color: tool === 'run' ? '#f59e0b' : '#61f4a2', fill: '#61f4a2', strokeWidth: 6, opacity: 0.8, dashed: tool === 'run', locked: false, hidden: false, zIndex: 10 };
      addDrawing(drawing); setDraft(null);
    }}>
      <Layer><Pitch width={width} height={height} /></Layer>
      <Layer>{project.drawings.map(d => <DrawingShape key={d.id} drawing={d} width={width} height={height} />)}</Layer>
      <Layer>{project.teams.flatMap(t => t.squad).sort((a,b) => a.zIndex - b.zIndex).map(p => <PlayerMarker key={p.id} player={p} width={width} height={height} />)}<BallMarker width={width} height={height} /></Layer>
      <Layer><Text text="TACTICAL STUDIO" x={pitchMargin + 20} y={pitchMargin + 24} fill="#eafff4" fontSize={28} fontStyle="bold" opacity={0.5} /><Text text="Phase • Build-up to final third" x={pitchMargin + 20} y={pitchMargin + 58} fill="#61f4a2" fontSize={18} opacity={0.8} /></Layer>
    </Stage>
  </div>;
}
