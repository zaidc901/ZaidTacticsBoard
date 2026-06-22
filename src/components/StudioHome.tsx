import { AlertTriangle, ArrowRight, Film, PenTool, Video } from 'lucide-react';

type StudioHomeProps = {
  onOpenBoard: () => void;
  onOpenVideo: () => void;
};

export function StudioHome({ onOpenBoard, onOpenVideo }: StudioHomeProps) {
  return <div className="tactics-shell h-full min-h-[100dvh] overflow-y-auto bg-slate-950 text-slate-100">
    <div className="relative flex min-h-[100dvh] flex-col bg-[linear-gradient(90deg,rgba(34,211,238,.06)_1px,transparent_1px),linear-gradient(0deg,rgba(96,165,250,.055)_1px,transparent_1px),radial-gradient(circle_at_18%_12%,rgba(37,99,235,.24),transparent_32%),linear-gradient(135deg,#020617,#0b1220_48%,#101827)] bg-[size:70px_70px,70px_70px,auto,auto]">
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/ZTBLogo.png" alt="ZaidTacticsBoard logo" className="h-10 w-10 shrink-0 rounded-full bg-white object-cover p-0.5 shadow-[0_5px_18px_rgba(37,99,235,.28)] ring-1 ring-white/80" />
          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-white via-[#93c5fd] to-[#5eead4] bg-clip-text text-xl font-black leading-none text-transparent sm:text-2xl" style={{ fontFamily: '"Segoe UI Variable Display", "Aptos Display", Inter, system-ui, sans-serif' }}>ZaidTacticsBoard</h1>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Tactical studio</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
        <section className="grid w-full max-w-5xl gap-4 md:grid-cols-2">
          <button type="button" onClick={onOpenBoard} className="group min-h-[14rem] rounded-2xl border border-slate-700 bg-slate-900/82 p-4 text-left shadow-[0_20px_58px_rgba(2,6,23,.26)] backdrop-blur transition hover:-translate-y-1 hover:border-[#60a5fa] hover:bg-slate-900 sm:min-h-[18rem] sm:p-6">
            <span className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-[#2563eb] text-white shadow-[0_14px_30px_rgba(37,99,235,.24)]">
              <PenTool size={26} />
            </span>
            <span className="block text-2xl font-black tracking-normal text-white">Tactics Board</span>
            <span className="mt-3 block max-w-md text-sm font-semibold leading-6 text-slate-400">Build football shapes, players, scenes, and animated tactical boards.</span>
            <span className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-black text-white transition group-hover:bg-[#1d4ed8]">
              Open board <ArrowRight size={16} />
            </span>
          </button>

          <button type="button" onClick={onOpenVideo} className="group min-h-[14rem] rounded-2xl border border-slate-700 bg-slate-900/82 p-4 text-left shadow-[0_20px_58px_rgba(2,6,23,.24)] backdrop-blur transition hover:-translate-y-1 hover:border-[#2dd4bf] hover:bg-slate-900 sm:min-h-[18rem] sm:p-6">
            <span className="mb-5 flex items-start justify-between gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-[#0f766e] text-white shadow-[0_14px_30px_rgba(15,118,110,.22)]">
                <Video size={27} />
              </span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/12 px-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                <AlertTriangle size={13} /> WIP
              </span>
            </span>
            <span className="block text-2xl font-black tracking-normal text-white">Video Analysis</span>
            <span className="mt-3 block max-w-md text-sm font-semibold leading-6 text-slate-400">Early preview for match clips, analyst overlays, freeze frames, keyframes, and export. It is not final yet, so bugs and rough edges are expected.</span>
            <span className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-black text-white transition group-hover:bg-[#0d9488]">
              Open WIP tool <Film size={16} />
            </span>
          </button>
        </section>
      </main>
    </div>
  </div>;
}
