import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import type { Heatmap, PitchMatch, PlayerStats } from '../../types/stats';
import type { PitchApiClient } from '../../utils/pitchApi';
export function HeatmapDialog({player,matches,client,onClose}:{player:PlayerStats|null;matches:PitchMatch[];client:PitchApiClient|null;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [matchId,setMatchId]=useState(''),[heatmap,setHeatmap]=useState<Heatmap|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const eligible=matches.filter(m=>player?.club.split(' / ').some(c=>c===m.home_team.name||c===m.away_team.name)).slice().reverse();
  useEffect(()=>{if(player){setMatchId(eligible[0]?.id??'');dialog.current?.showModal();}else dialog.current?.close();},[player]);
  useEffect(()=>{
    if(!player || !matchId || !client)return;
    const controller=new AbortController();setBusy(true);setError('');setHeatmap(null);
    client.heatmap(matchId,controller.signal).then(result=>{
      if(result.grid?.length!==16||result.grid?.width!==12||result.grid?.frame!=='acting_ltr'||!Array.isArray(result.players))throw new Error('This heatmap uses an unsupported coordinate frame.');
      if(!controller.signal.aborted)setHeatmap(result);
    }).catch(e=>{if(!controller.signal.aborted)setError((e as Error).message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return ()=>controller.abort();
  },[player,matchId,client]);
  const entry=heatmap?.players.find(p=>p.player.id===player?.id),cells=entry?.cells.filter(c=>c.length===3&&c.every(Number.isFinite)&&c[0]>=0&&c[0]<16&&c[1]>=0&&c[1]<12&&c[2]>0)??[];
  const maximum=Math.max(1,...cells.map(c=>c[2]));
  return <dialog ref={dialog} className="stats-dialog stats-heatmap-dialog" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="heatmap-title">
    <div className="stats-dialog-head"><div><span className="stats-overline">ON-BALL INVOLVEMENT</span><h2 id="heatmap-title">{player?.name}’s heatmap</h2></div><button className="stats-icon-button" aria-label="Close heatmap" onClick={onClose}><X size={18}/></button></div>
    <label className="stats-field">Match<select value={matchId} onChange={e=>setMatchId(e.target.value)}>{eligible.map(m=><option key={m.id} value={m.id}>{m.date} · {m.home_team.name} vs {m.away_team.name}</option>)}</select></label>
    {busy?<div className="stats-heatmap-loading" role="status"><LoaderCircle className="stats-spin"/> Loading match heatmap…</div>:error?<p role="alert" className="stats-error">{error}</p>:!entry?<p className="stats-heatmap-loading">No recorded actions for this player in this match.</p>:<>
      <div className="stats-heatmap-pitch"><svg viewBox="0 0 520 360" role="img" aria-label={`${player?.name}: ${entry.actions} recorded actions, attacking from left to right`}>
        <rect x="20" y="20" width="480" height="320" fill="#163a32"/>
        {cells.map(([x,y,count])=><rect key={`${x}-${y}`} x={20+x*30} y={20+y*320/12} width="30" height={320/12} fill="#d7e69c" opacity={.1+.85*Math.sqrt(count/maximum)}><title>{count} recorded actions</title></rect>)}
        <g fill="none" stroke="#e2efe3" strokeOpacity=".65" strokeWidth="1.2"><rect x="20" y="20" width="480" height="320"/><path d="M260 20v320M20 104h72v152H20M500 104h-72v152h72M20 146h26v68H20M500 146h-26v68h26"/><circle cx="260" cy="180" r="45"/></g>
      </svg></div><div className="stats-chart-foot"><span>{entry.actions} recorded actions</span><span>Attacking direction →</span></div>
    </>}
    <p className="stats-helper">Match-level action density from PitchAPI, on a 16 × 12 grid. This shows recorded ball actions, not every movement or distance run. Compare minutes played when comparing players.</p>
  </dialog>;
}
