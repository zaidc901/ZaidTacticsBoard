import { useRef } from 'react';
import Konva from 'konva';
import { LeftSidebar, RightSidebar } from './components/Sidebar';
import { PitchCanvas } from './components/PitchCanvas';
import { Toolbar } from './components/Toolbar';
import { Timeline } from './components/Timeline';
import { exportStageImage, recordCanvas } from './utils/exporters';

export default function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const exportImage = () => stageRef.current && exportStageImage(stageRef.current, 'png');
  const exportVideo = () => {
    const canvas = stageRef.current?.content.querySelector('canvas');
    if (canvas) void recordCanvas(canvas, 4, 30);
  };
  return <div className="flex h-screen flex-col overflow-hidden bg-ink text-white">
    <header className="flex items-center justify-between border-b border-white/10 bg-panel/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent font-black text-ink shadow-glow">TS</div>
        <div><h1 className="text-lg font-bold tracking-tight">Tactical Studio</h1><p className="text-xs text-slate-400">Vertical football analysis, scenes, animation and exports</p></div>
      </div>
      <div className="hidden items-center gap-2 md:flex"><span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Autosaved</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">9:16 • Broadcast theme</span></div>
    </header>
    <main className="flex min-h-0 flex-1">
      <LeftSidebar />
      <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-auto bg-[radial-gradient(circle_at_50%_10%,rgba(97,244,162,.18),transparent_36%),linear-gradient(135deg,#071015,#0b1117)] p-4">
        <div className="absolute top-4 z-10"><Toolbar /></div>
        <div className="pt-20"><PitchCanvas stageRef={stageRef} /></div>
      </section>
      <RightSidebar onExportImage={exportImage} onExportVideo={exportVideo} />
    </main>
    <Timeline />
  </div>;
}
