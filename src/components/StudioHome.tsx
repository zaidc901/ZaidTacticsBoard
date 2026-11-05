import { ArrowDown, ArrowRight, BarChart3, Gamepad2, Layers3, Moon, MoveUpRight, Palette, PenTool, Play, Sun, Video } from 'lucide-react';
import { useStudioTheme } from '../hooks/useStudioTheme';

type StudioHomeProps = {
  onOpenBoard: () => void;
  onOpenVideo: () => void;
  onOpenStats: () => void;
  onPersonalize: () => void;
};

const previewPlayers = [
  [55, 160, 1], [125, 65, 3], [123, 125, 4], [123, 195, 5], [125, 255, 2],
  [205, 160, 6], [245, 91, 8], [245, 229, 10], [335, 58, 11], [357, 160, 9], [335, 262, 7],
];
const previewOpponents = [[468, 160], [408, 70], [405, 130], [405, 193], [408, 251], [317, 103], [313, 213], [285, 160], [216, 52], [202, 270], [164, 169]];

// A decorative, resolution-independent preview; the live board opens from the CTA.
function BoardPreview() {
  return <div className="home-board-preview" aria-hidden="true">
    <div className="home-preview-header">
      <span><span className="home-preview-dot" /> Match plan</span>
      <span className="home-preview-formation">4–3–3 <span> / </span> Attacking shape</span>
    </div>
    <div className="home-preview-pitch">
      <svg viewBox="0 0 520 320" fill="none">
        <defs>
          <pattern id="home-pitch-stripes" width="104" height="320" patternUnits="userSpaceOnUse">
            <rect width="52" height="320" fill="currentColor" opacity=".035" />
          </pattern>
          <marker id="home-pass-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M1 1 8 5 1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <rect width="520" height="320" fill="url(#home-pitch-stripes)" />
        <g className="home-pitch-lines" strokeWidth="1.2">
          <rect x="20" y="20" width="480" height="280" rx="2" />
          <path d="M260 20v280M20 88h68v144H20M500 88h-68v144h68M20 126h26v68H20M500 126h-26v68h26M20 147H9v26h11M500 147h11v26h-11" />
          <circle cx="260" cy="160" r="41" />
          <path d="M88 130a36 36 0 0 1 0 60M432 130a36 36 0 0 0 0 60" />
          <circle cx="260" cy="160" r="2" /><circle cx="68" cy="160" r="2" /><circle cx="452" cy="160" r="2" />
          <path d="M20 29a9 9 0 0 0 9-9M491 20a9 9 0 0 0 9 9M20 291a9 9 0 0 1 9 9M491 300a9 9 0 0 1 9-9" />
        </g>
        <path className="home-tactical-zone" d="m205 160 40-69 90-33 22 102-22 102-90-33Z" />
        <g className="home-pass-lines" strokeWidth="1.7" strokeLinecap="round" markerEnd="url(#home-pass-arrow)">
          <path d="m218 153 16-42" strokeDasharray="5 5" />
          <path d="M261 85q31-20 57-23" />
          <path d="M349 63q39 25 16 78" strokeDasharray="5 5" />
        </g>
        {previewOpponents.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="9" className="home-opponent" />)}
        {previewPlayers.map(([x, y, number]) => <g key={number}>
          <circle cx={x} cy={y + 2} r="13" fill="#163f35" opacity=".1" />
          <circle cx={x} cy={y} r="12" className="home-player" />
          <text x={x} y={y + .5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="650">{number}</text>
        </g>)}
        <circle cx="260" cy="101" r="5" fill="#fff" stroke="#29483d" strokeWidth="1.3" />
        <path d="m258 99 3 1-1 3-3-1Z" fill="#29483d" />
      </svg>
    </div>
    <div className="home-preview-footer">
      <span><span className="home-preview-team" /> Your next move, mapped out.</span>
      <span><Layers3 size={14} /> Scene 01</span>
    </div>
  </div>;
}

export function StudioHome({ onOpenBoard, onOpenVideo, onOpenStats, onPersonalize }: StudioHomeProps) {
  const { dark, toggleTheme } = useStudioTheme();

  return <div className={`studio-home ${dark ? 'studio-home-dark' : ''}`}>
    <header className="home-header">
      <div className="home-header-inner">
        <a className="home-brand" href="#" aria-label="ZaidTacticsBoard home">
          <img src="/ZTBLogo.png" alt="" width="38" height="38" />
          <span>Zaid<span className="home-brand-light">TacticsBoard</span><small>THE FOOTBALL WORKSPACE</small></span>
        </a>
        <div className="home-header-actions">
          <span className="home-header-note">A different view of the game.</span>
          <button className="home-theme-toggle" type="button" onClick={onPersonalize} aria-label="Personalize workspace"><Palette size={16}/><span>Personalize</span></button>
          <button className="home-theme-toggle" type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}<span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
    </header>

    <main className="home-main">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span /> TACTICS BOARD</p>
          <h1 id="home-title">See the game.<br /><span>Shape the play.</span></h1>
          <p className="home-hero-description">A clear canvas for your football ideas. Build your line-up, draw the movement, and bring every phase of play to life.</p>
          <button className="home-primary-action" type="button" onClick={onOpenBoard}>Open tactics board <ArrowRight size={18} /></button>
          <ul className="home-features" aria-label="Tactics board features">
            <li><PenTool size={14} /> Draw</li><li><Play size={14} /> Animate</li><li><MoveUpRight size={14} /> Export</li>
          </ul>
        </div>
        <BoardPreview />
      </section>

      <section className="home-projects" aria-labelledby="home-projects-title">
        <div className="home-section-heading">
          <div><p className="home-section-eyebrow">BEYOND THE BOARD</p><h2 id="home-projects-title">More in the making</h2></div>
          <p>Experiments from the studio <ArrowDown size={15} /></p>
        </div>
        <div className="home-project-grid">
          <article className="home-project-card">
            <div className="home-project-top"><span className="home-project-icon home-icon-video"><Video size={21} /></span><span className="home-wip">Work in progress</span></div>
            <h3>Video Analysis</h3>
            <p>Break down match footage with annotations, freeze frames, and tactical overlays.</p>
            <button type="button" className="home-project-link" onClick={onOpenVideo}>Explore video analysis <ArrowRight size={16} /></button>
          </article>
          <article className="home-project-card">
            <div className="home-project-top"><span className="home-project-icon home-icon-game"><Gamepad2 size={21} /></span><span className="home-wip">Work in progress</span></div>
            <h3>The Stretford Gauntlet</h3>
            <p>Your all-time United XI. Ten historic opponents. One shot at going all the way.</p>
            <a className="home-project-link" href="/stretfordgauntlet/">Play the gauntlet <ArrowRight size={16} /></a>
          </article>
          <article className="home-project-card">
            <div className="home-project-top"><span className="home-project-icon home-icon-stats"><BarChart3 size={21} /></span><span className="home-wip">Work in progress</span></div>
            <h3>Stats Analysis</h3>
            <p>Compare players, explore the patterns, and build your own view of Premier League data.</p>
            <button type="button" className="home-project-link" onClick={onOpenStats}>Explore the data hub <ArrowRight size={16} /></button>
          </article>
        </div>
      </section>
      <footer className="home-footer"><span>ZaidTacticsBoard</span><span>Made for the way you see football.</span></footer>
    </main>
  </div>;
}
