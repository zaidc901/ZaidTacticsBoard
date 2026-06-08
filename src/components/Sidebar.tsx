import { motion } from 'framer-motion';
import { formations, FormationKey } from '../data/formations';
import { useTacticsStore } from '../store/tacticsStore';
import { exportProject } from '../utils/exporters';

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) => (
  <label className="space-y-1 text-xs uppercase tracking-[0.18em] text-slate-400">
    <span>{label}</span>
    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-accent/70" type={type} value={value} onChange={e => onChange(e.target.value)} />
  </label>
);

export function LeftSidebar() {
  const { project, leftOpen, updateTeam, addPlayer, applyFormation, updatePlayer, selectedId } = useTacticsStore();
  if (!leftOpen) return null;
  return <motion.aside initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden w-80 shrink-0 overflow-y-auto border-r border-white/10 bg-panel/80 p-4 backdrop-blur xl:block">
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Squad room</p>
      <h2 className="text-2xl font-semibold text-white">Teams & formations</h2>
    </div>
    <div className="space-y-4">
      {project.teams.map(team => <section key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl border border-white/20" style={{ background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})` }} />
          <div className="min-w-0 flex-1">
            <input className="w-full bg-transparent font-semibold text-white outline-none" value={team.name} onChange={e => updateTeam(team.id, { name: e.target.value })} />
            <input className="w-16 bg-transparent text-xs uppercase text-slate-400 outline-none" value={team.shortName} onChange={e => updateTeam(team.id, { shortName: e.target.value })} />
          </div>
          <input type="color" value={team.primaryColor} onChange={e => updateTeam(team.id, { primaryColor: e.target.value })} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select className="rounded-xl border border-white/10 bg-slate-950 px-2 py-2 text-sm text-white" value={team.formation} onChange={e => applyFormation(team.id, e.target.value as FormationKey)}>
            {Object.keys(formations).map(f => <option key={f}>{f}</option>)}
          </select>
          <button onClick={() => addPlayer(team.id)} className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-ink">Add player</button>
        </div>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {team.squad.map(player => <div key={player.id} className={`grid grid-cols-[2.2rem_1fr_3rem] items-center gap-2 rounded-xl border px-2 py-1.5 ${selectedId === player.id ? 'border-accent/70 bg-accent/10' : 'border-white/10 bg-black/20'}`}>
            <input className="rounded-lg bg-white/10 px-1 py-1 text-center text-sm text-white outline-none" type="number" value={player.number} onChange={e => updatePlayer(player.id, { number: Number(e.target.value) })} />
            <input className="bg-transparent text-sm text-white outline-none" value={player.displayName} onChange={e => updatePlayer(player.id, { displayName: e.target.value.toUpperCase() })} />
            <span className="text-xs text-slate-400">{player.position}</span>
          </div>)}
        </div>
      </section>)}
    </div>
  </motion.aside>;
}

export function RightSidebar({ onExportImage, onExportVideo }: { onExportImage: () => void; onExportVideo: () => void }) {
  const { project, selectedId, rightOpen, updatePlayer, updateDrawing, removeDrawing, updateSettings, clearDrawings } = useTacticsStore();
  if (!rightOpen) return null;
  const selectedPlayer = project.teams.flatMap(t => t.squad).find(p => p.id === selectedId);
  const selectedDrawing = project.drawings.find(d => d.id === selectedId);
  return <motion.aside initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden w-80 shrink-0 overflow-y-auto border-l border-white/10 bg-panel/80 p-4 backdrop-blur xl:block">
    <p className="text-xs uppercase tracking-[0.25em] text-accent">Control deck</p>
    <h2 className="mb-4 text-2xl font-semibold text-white">Style, layers, export</h2>
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <h3 className="mb-3 font-semibold text-white">Board format</h3>
      <div className="grid grid-cols-2 gap-2">
        {[['portrait',1080,1920],['landscape',1920,1080],['square',1080,1080]].map(([name,w,h]) => <button key={name} onClick={() => updateSettings({ format: name as any, width: w as number, height: h as number })} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm capitalize text-white hover:border-accent/70">{name}</button>)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Grass" type="color" value={project.settings.grassColor} onChange={v => updateSettings({ grassColor: v })} />
        <Field label="Lines" type="color" value={project.settings.lineColor} onChange={v => updateSettings({ lineColor: v })} />
      </div>
      <label className="mt-3 block text-xs uppercase tracking-[0.18em] text-slate-400">Grid
        <select className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case text-white" value={project.settings.grid} onChange={e => updateSettings({ grid: e.target.value as any })}>
          {['none','thirds','five-lanes','fifteen','custom'].map(g => <option key={g}>{g}</option>)}
        </select>
      </label>
    </section>
    {selectedPlayer && <section className="mb-4 space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
      <h3 className="font-semibold text-white">Selected player</h3>
      <Field label="Name" value={selectedPlayer.displayName} onChange={v => updatePlayer(selectedPlayer.id, { displayName: v })} />
      <Field label="Number" type="number" value={selectedPlayer.number} onChange={v => updatePlayer(selectedPlayer.id, { number: Number(v) })} />
      <div className="grid grid-cols-2 gap-2"><Field label="Fill" type="color" value={selectedPlayer.color} onChange={v => updatePlayer(selectedPlayer.id, { color: v })} /><Field label="Outline" type="color" value={selectedPlayer.outline} onChange={v => updatePlayer(selectedPlayer.id, { outline: v })} /></div>
      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Opacity<input type="range" min="0.2" max="1" step="0.05" value={selectedPlayer.opacity} onChange={e => updatePlayer(selectedPlayer.id, { opacity: Number(e.target.value) })} className="w-full" /></label>
    </section>}
    {selectedDrawing && <section className="mb-4 space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
      <h3 className="font-semibold text-white">Selected drawing</h3>
      <Field label="Color" type="color" value={selectedDrawing.color} onChange={v => updateDrawing(selectedDrawing.id, { color: v })} />
      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Thickness<input type="range" min="1" max="16" value={selectedDrawing.strokeWidth} onChange={e => updateDrawing(selectedDrawing.id, { strokeWidth: Number(e.target.value) })} className="w-full" /></label>
      <button onClick={() => removeDrawing(selectedDrawing.id)} className="w-full rounded-xl bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100">Delete drawing</button>
    </section>}
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <h3 className="mb-3 font-semibold text-white">Export</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onExportImage} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-ink">PNG</button>
        <button onClick={onExportVideo} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white">WebM</button>
        <button onClick={() => exportProject(project)} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white">JSON</button>
        <button onClick={clearDrawings} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white">Clear</button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">Video export uses the browser MediaRecorder pipeline; MP4/GIF can be added through the documented FFmpeg.wasm hook.</p>
    </section>
  </motion.aside>;
}
