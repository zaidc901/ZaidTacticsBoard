import { MousePointer2, MoveRight, Route, Square, Type, Trash2, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { useTacticsStore } from '../store/tacticsStore';
import { Tool } from '../types/domain';

const tools: { id: Tool; label: string; icon: any }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pass', label: 'Pass', icon: MoveRight },
  { id: 'run', label: 'Run', icon: Route },
  { id: 'zone', label: 'Zone', icon: Square },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'erase', label: 'Erase', icon: Trash2 },
];

export function Toolbar() {
  const { tool, setTool, toggleLeft, toggleRight } = useTacticsStore();
  return <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-panel/80 p-2 shadow-xl backdrop-blur">
    <button onClick={toggleLeft} className="rounded-xl p-3 text-slate-300 hover:bg-white/10"><PanelLeftClose size={18} /></button>
    {tools.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTool(id)} className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${tool === id ? 'bg-accent text-ink shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
      <Icon size={17} /><span className="hidden sm:inline">{label}</span>
    </button>)}
    <button onClick={toggleRight} className="rounded-xl p-3 text-slate-300 hover:bg-white/10"><PanelRightClose size={18} /></button>
  </div>;
}
