import { MapPin, Pin, X } from 'lucide-react';
import type { MetricKey, PlayerStats } from '../../types/stats';
import { formatStat, metricLabel, metricValue, ROLE_COLORS } from '../../utils/statsMetrics';
import { benchmarkPercentile } from '../../utils/personalStats';

type Props={player:PlayerStats|undefined;players:PlayerStats[];allPlayers:PlayerStats[];xKey:MetricKey;yKey:MetricKey;per90:boolean;pinned:string[];onPin:(id:string)=>void;onSelect:(id:string)=>void;onClear:()=>void;onHeatmap:(player:PlayerStats)=>void;canHeatmap:boolean;onEdit:()=>void};
export function PlayerSpotlight({player,players,allPlayers,xKey,yKey,per90,pinned,onPin,onSelect,onClear,onHeatmap,canHeatmap,onEdit}:Props) {
  return <aside className="stats-spotlight stats-panel"><div className="stats-panel-heading"><h2>Player spotlight</h2>{player&&<button className="stats-icon-button" aria-label="Clear player selection" onClick={onClear}><X size={14}/></button>}</div>
    {player?<>
      <div key={player.id} className="stats-player-avatar" style={{background:ROLE_COLORS[player.role]+'1a',color:ROLE_COLORS[player.role]}}>{player.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
      <h3>{player.name}</h3><p className="stats-player-club">{player.club}</p>
      {player.personal&&<div className="stats-personal-caption"><span className="stats-yours-label">Your player</span><span>{player.sampleLabel}</span><button className="stats-text-button" onClick={onEdit}>Edit my statistics →</button></div>}
      <div className="stats-player-meta"><span><i style={{background:ROLE_COLORS[player.role]}}/>{player.role}</span><span>{player.minutes.toLocaleString()} min</span></div>
      <div className="stats-player-values">{[...new Set([xKey,yKey])].map(key=>{
        const value=metricValue(player,key,per90);
        const percentile=benchmarkPercentile(player,players,key,per90);
        return <div key={key}><span>{metricLabel(key,per90)}</span><strong>{formatStat(value,key)}</strong><div className="stats-percentile-track"><i style={{width:`${percentile??0}%`}}/></div><small>{percentile===null?'Unavailable for this sample':`Percentile ${Math.round(percentile)} · benchmark`}</small></div>;
      })}</div>
      <button className={`stats-button stats-pin-button ${pinned.includes(player.id)?'is-pinned':''}`} onClick={()=>onPin(player.id)} disabled={pinned.length>=5&&!pinned.includes(player.id)}><Pin size={14}/>{pinned.includes(player.id)?'Unpin player':pinned.length>=5?'5 players pinned':'Pin on chart'}</button>
      {canHeatmap&&<button className="stats-text-button stats-heatmap-link" onClick={()=>onHeatmap(player)}><MapPin size={14}/> View match heatmap</button>}
      <p className="stats-helper">Percentiles show rank, not quality. A higher value is not always better.</p>
    </>:<div className="stats-spotlight-empty"><div className="stats-selection-art"><span/><span/><span/></div><h3>Find your standout.</h3><p>Select a dot or a table row to explore a player’s numbers.</p><small>You can pin up to five players.</small></div>}
    {pinned.length>0&&<div className="stats-pinned-list"><span className="stats-overline">PINNED PLAYERS · {pinned.length}/5</span>{pinned.map(id=>{const p=allPlayers.find(p=>p.id===id);return p?<div key={id}><button className="stats-text-button" onClick={()=>onSelect(id)}><i style={{background:ROLE_COLORS[p.role]}}/>{p.name}</button><button className="stats-icon-button" aria-label={`Unpin ${p.name}`} onClick={()=>onPin(id)}><X size={12}/></button></div>:null;})}</div>}
  </aside>;
}
