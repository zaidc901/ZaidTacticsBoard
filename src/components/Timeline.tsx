import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Play, Plus, Trash } from 'lucide-react';
import { useTacticsStore } from '../store/tacticsStore';

export function Timeline() {
  const { project, addScene, duplicateScene, deleteScene, applyScene } = useTacticsStore();
  return <footer className="border-t border-white/10 bg-panel/90 p-3 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center gap-3">
      <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-ink shadow-glow"><Play size={18} fill="currentColor" /></button>
      <button onClick={addScene} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-accent/60"><Plus size={16} /> Add scene</button>
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
        <AnimatePresence initial={false}>
          {project.scenes.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-400">Capture your current board as Scene 1, then move players and add Scene 2 to animate tactical movement.</div>}
          {project.scenes.map((scene, index) => <motion.div key={scene.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="min-w-56 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <button onClick={() => applyScene(scene.id)} className="text-left font-semibold text-white">{index + 1}. {scene.name}</button>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400"><span>{scene.duration}s • {scene.transition}</span><span>{Object.keys(scene.playerPositions).length} objects</span></div>
            <div className="mt-2 flex gap-2"><button onClick={() => duplicateScene(scene.id)} className="rounded-lg bg-white/10 p-1.5 text-slate-200"><Copy size={14} /></button><button onClick={() => deleteScene(scene.id)} className="rounded-lg bg-red-500/20 p-1.5 text-red-100"><Trash size={14} /></button></div>
          </motion.div>)}
        </AnimatePresence>
      </div>
    </div>
  </footer>;
}
