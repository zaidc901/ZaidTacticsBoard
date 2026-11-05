import { useMemo, useState } from 'react';
import { useElementSize } from '../../hooks/useElementSize';
import type { StudioPreferences } from '../../utils/studioPreferences';
import type { MetricKey, PlayerStats } from '../../types/stats';
import { correlation, formatStat, metricLabel, metricValue, niceDomain, ROLE_COLORS } from '../../utils/statsMetrics';

type Props={players:PlayerStats[];xKey:MetricKey;yKey:MetricKey;per90:boolean;selectedId:string|null;pinned:string[];onSelect:(id:string)=>void;averages:boolean;labels:boolean;source:string;season:string;preferences:StudioPreferences};
export function ScatterPlot({players,xKey,yKey,per90,selectedId,pinned,onSelect,averages,labels,source,season,preferences}:Props) {
  const {ref,size}=useElementSize<HTMLDivElement>();
  const [hover,setHover]=useState<string|null>(null);
  const width=Math.max(280,size.width),height=width<480?Math.min(380,preferences.chartHeight):preferences.chartHeight;
  const margin={left:58,right:27,top:28,bottom:58},plotWidth=width-margin.left-margin.right,plotHeight=height-margin.top-margin.bottom;
  const points=useMemo(()=>players.flatMap(player=>{const x=metricValue(player,xKey,per90),y=metricValue(player,yKey,per90);return x===null||y===null?[]:[{player,x,y}];}),[players,xKey,yKey,per90]);
  const [xMin,xMax]=niceDomain(points.map(p=>p.x)),[yMin,yMax]=niceDomain(points.map(p=>p.y));
  const sx=(v:number)=>margin.left+(v-xMin)/(xMax-xMin)*plotWidth;
  const sy=(v:number)=>margin.top+plotHeight-(v-yMin)/(yMax-yMin)*plotHeight;
  const benchmarkPoints=points.filter(p=>!p.player.personal);
  const mx=benchmarkPoints.reduce((s,p)=>s+p.x,0)/(benchmarkPoints.length||1),my=benchmarkPoints.reduce((s,p)=>s+p.y,0)/(benchmarkPoints.length||1);
  const priority=new Set([...points].sort((a,b)=>(b.x/(xMax||1)+b.y/(yMax||1))-(a.x/(xMax||1)+a.y/(yMax||1))).slice(0,width<480?3:6).map(p=>p.player.id));
  const active=points.find(p=>p.player.id===hover);
  const r=correlation(benchmarkPoints);
  const labelledRects:{x:number;y:number;width:number;height:number}[]=[];
  const placedLabels=points.filter(p=>labels&&priority.has(p.player.id)||pinned.includes(p.player.id)||p.player.id===selectedId||p.player.personal).sort((a,b)=>Number(b.player.id===selectedId)-Number(a.player.id===selectedId)).flatMap(p=>{
    const name=p.player.personal?(p.player.name.length>18?p.player.name.slice(0,17)+'…':p.player.name):p.player.name.split(' ').at(-1)??p.player.name,w=Math.min(120,name.length*6.3+10),x=Math.min(width-margin.right-w,Math.max(margin.left,sx(p.x)+9));
    for(const dy of [-15,9,-30,24]) {const y=Math.min(height-margin.bottom-15,Math.max(margin.top,sy(p.y)+dy));const box={x,y,width:w,height:15};if(labelledRects.some(b=>x<b.x+b.width&&x+w>b.x&&y<b.y+b.height&&y+15>b.y))continue;labelledRects.push(box);return [{id:p.player.id,name,x,y}];}
    return [];
  });
  return <>
    <div ref={ref} className="stats-scatter-wrap" data-animate={points.length<=500}>
      <svg id="stats-scatter-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${metricLabel(xKey,per90)} versus ${metricLabel(yKey,per90)}. Select a player to inspect.`} style={{display:'block',width:'100%',background:'var(--stats-panel)'}}>
        <title>{`${metricLabel(xKey,per90)} vs ${metricLabel(yKey,per90)} · ${season} · ${source==='Demo'?'Fictional demo data':source}`}</title>
        <desc>Every dot is a player. Axes use the chosen sample. Dotted lines show the mean of benchmark players only. Diamond markers are personal data.</desc>
        {averages && benchmarkPoints.length>0 && <rect x={sx(mx)} y={margin.top} width={width-margin.right-sx(mx)} height={sy(my)-margin.top} fill="var(--stats-quadrant)" />}
        {Array.from({length:6},(_,i)=>{
          const x=xMin+(xMax-xMin)*i/5,y=yMin+(yMax-yMin)*i/5;
          return <g key={i}>
            {preferences.grid&&<line x1={sx(x)} x2={sx(x)} y1={margin.top} y2={height-margin.bottom} stroke="var(--stats-grid)" />}
            {preferences.grid&&<line x1={margin.left} x2={width-margin.right} y1={sy(y)} y2={sy(y)} stroke="var(--stats-grid)" />}
            <text x={sx(x)} y={height-margin.bottom+23} textAnchor="middle" fill="var(--stats-muted)" fontSize="10">{formatStat(x,xKey)}</text>
            <text x={margin.left-12} y={sy(y)+3} textAnchor="end" fill="var(--stats-muted)" fontSize="10">{formatStat(y,yKey)}</text>
          </g>;
        })}
        {averages && benchmarkPoints.length>0 && <g stroke="var(--stats-muted)" strokeDasharray="3 5" strokeWidth="1" opacity=".65"><line x1={sx(mx)} x2={sx(mx)} y1={margin.top} y2={height-margin.bottom}/><line x1={margin.left} x2={width-margin.right} y1={sy(my)} y2={sy(my)}/></g>}
        {averages && benchmarkPoints.length>0 && width>420 && <text x={width-margin.right-10} y={margin.top+16} textAnchor="end" fontSize="9" letterSpacing="1" fill="var(--stats-accent)">HIGHER ON BOTH AXES</text>}
        {[...points].sort((a,b)=>Number(a.player.id===selectedId)-Number(b.player.id===selectedId)).map(({player,x,y})=>{
          const isActive=player.id===selectedId||player.id===hover, isPinned=pinned.includes(player.id);
          const color=player.personal||preferences.colorMode==='accent'?'var(--stats-accent)':ROLE_COLORS[player.role],radius=preferences.pointSize+(isActive?1.5:0);
          return <g key={player.id} role="button" tabIndex={0} aria-label={`${player.personal?'Your player: ':''}${player.name}, ${player.club}, ${metricLabel(xKey,per90)} ${formatStat(x)}, ${metricLabel(yKey,per90)} ${formatStat(y)}`} aria-pressed={player.id===selectedId} className="stats-plot-point" style={{transform:`translate(${sx(x)}px, ${sy(y)}px)`}} onClick={()=>onSelect(player.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(player.id);}}} onMouseEnter={()=>setHover(player.id)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(player.id)} onBlur={()=>setHover(null)}>
            <circle r={Math.max(11,radius+5)} fill="transparent" />
            {(isActive||isPinned)&&<circle r={radius+4} fill="none" stroke={color} strokeWidth="1.3" opacity=".6"/>}
            <circle r={radius} fill={player.personal?'var(--stats-panel)':color} fillOpacity={selectedId && !isActive && !isPinned && !player.personal ? .72 : .9} stroke="var(--stats-panel)" strokeWidth="1.5"/>
            {player.personal&&<path d={`M0 ${-radius-2} L${radius+2} 0 L0 ${radius+2} L${-radius-2} 0Z`} fill={color} stroke="var(--stats-panel)" strokeWidth="1.5"/>}
          </g>;
        })}
        <g pointerEvents="none">{placedLabels.map(p=><text key={p.id} className="stats-plot-label" x={0} y={11} style={{transform:`translate(${p.x}px, ${p.y}px)`}} fontSize="10" fontWeight="600" fill="var(--stats-ink)" stroke="var(--stats-panel)" strokeWidth="3" paintOrder="stroke">{p.name}</text>)}</g>
        <text x={margin.left+plotWidth/2} y={height-10} textAnchor="middle" fontSize="11" fontWeight="550" fill="var(--stats-ink)">{metricLabel(xKey,per90)} →</text>
        <text transform={`translate(15 ${margin.top+plotHeight/2}) rotate(-90)`} textAnchor="middle" fontSize="11" fontWeight="550" fill="var(--stats-ink)">{metricLabel(yKey,per90)} →</text>
        {!points.length&&<text x={margin.left+plotWidth/2} y={margin.top+plotHeight/2} textAnchor="middle" fill="var(--stats-muted)" fontSize="12">No comparable players in this view</text>}
      </svg>
      {active&&<div className="stats-chart-tooltip" role="status" style={{left:Math.min(width-214,Math.max(8,sx(active.x)-100)),top:Math.max(0,Math.min(height-95,sy(active.y)-95))}}>
        <strong>{active.player.name}</strong><span>{active.player.club}</span><div><span>{metricLabel(xKey,per90)}</span><b>{formatStat(active.x,xKey)}</b></div><div><span>{metricLabel(yKey,per90)}</span><b>{formatStat(active.y,yKey)}</b></div>
      </div>}
    </div>
    <div className="stats-chart-foot"><span><i className="stats-mean-key"/> {averages?(benchmarkPoints.length?'Benchmark mean':'No benchmark in view'):'Averages hidden'}</span><span>{r===null?'Correlation unavailable':`Correlation r = ${r.toFixed(2)}`}</span></div>
    {players.length>points.length&&<p className="stats-missing">{players.length-points.length} players omitted from the plot because an axis has missing data.</p>}
  </>;
}
