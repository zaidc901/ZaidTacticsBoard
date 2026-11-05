import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowLeft, ArrowRight, BarChart3, Check, ChevronLeft, ChevronRight, Database, Download, Home, Palette, Pencil, Plus, UserRound, Moon, RotateCcw, Search, Settings2, SlidersHorizontal, Sparkles, Sun, X } from 'lucide-react';
import { useStudioPreferences } from '../../hooks/useStudioPreferences';
import { addComparisons, availableAxes } from '../../utils/personalStats';
import type { SavedStatsView } from '../../utils/studioPreferences';
import { OwnDataDialog } from './OwnDataDialog';
import { SavedViews } from './SavedViews';
import { useStudioTheme } from '../../hooks/useStudioTheme';
import type { MetricKey, PitchLeague, PlayerStats, StatsDataset } from '../../types/stats';
import { statsDemo } from '../../data/statsDemo';
import { METRICS, METRIC_BY_KEY, PRESETS, ROLE_COLORS, formatStat, metricLabel, metricValue, sortPlayers } from '../../utils/statsMetrics';
import { PitchApiClient } from '../../utils/pitchApi';
import { exportCsv } from '../../utils/statsData';
import { downloadFile, exportChart } from '../../utils/statsExport';
import { ScatterPlot } from './ScatterPlot';
import { PlayerSpotlight } from './PlayerSpotlight';
import { DataSourceDialog } from './DataSourceDialog';
import { HeatmapDialog } from './HeatmapDialog';
import './stats.css';

const groups=[...new Set(METRICS.map(m=>m.group))];
function MetricSelect({label,value,onChange}:{label:string;value:MetricKey;onChange:(key:MetricKey)=>void}) {
  return <label className="stats-field"><span>{label}</span><select aria-label={label} value={value} onChange={e=>onChange(e.target.value as MetricKey)}>{groups.map(group=><optgroup label={group} key={group}>{METRICS.filter(m=>m.group===group).map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</optgroup>)}</select><small>{METRIC_BY_KEY[value].description}</small></label>;
}
export function StatsHub({onHome,onOpenBoard,onPersonalize}:{onHome:()=>void;onOpenBoard:()=>void;onPersonalize:()=>void}) {
  const {dark,toggleTheme}=useStudioTheme();
  const {preferences}=useStudioPreferences();
  const [personalPlayers,setPersonalPlayers]=useState<PlayerStats[]>([]),[ownDataOpen,setOwnDataOpen]=useState(false),[editingId,setEditingId]=useState<string|null>(null);
  const [dataset,setDataset]=useState<StatsDataset>(statsDemo);
  const [xKey,setXKey]=useState<MetricKey>('progressivePasses'),[yKey,setYKey]=useState<MetricKey>('xa'),[per90,setPer90]=useState(true);
  const [club,setClub]=useState('all'),[role,setRole]=useState('all'),[minimum,setMinimum]=useState(270),[search,setSearch]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null),[pinned,setPinned]=useState<string[]>([]),[averages,setAverages]=useState(true),[labels,setLabels]=useState(true);
  const [sort,setSort]=useState<{key:MetricKey|'name'|'minutes';ascending:boolean}>({key:'xa',ascending:false}),[page,setPage]=useState(0),[extraColumns,setExtraColumns]=useState<MetricKey[]>(['goals','xg','passAccuracy']);
  const [sourcesOpen,setSourcesOpen]=useState(false),[client,setClient]=useState<PitchApiClient|null>(null),[league,setLeague]=useState<PitchLeague|null>(null);
  const [progress,setProgress]=useState<{done:number;total:number}|null>(null),[error,setError]=useState(''),[toast,setToast]=useState(''),[heatmapPlayer,setHeatmapPlayer]=useState<PlayerStats|null>(null);
  const importController=useRef<AbortController|null>(null),clientRef=useRef<PitchApiClient|null>(null);
  useEffect(()=>{clientRef.current=client;},[client]);
  useEffect(()=>()=>{importController.current?.abort();clientRef.current?.disconnect();},[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),4000);return ()=>clearTimeout(id);},[toast]);
  const clubs=useMemo(()=>[...new Set(dataset.players.map(p=>p.club))].sort(),[dataset]);
  const benchmark=useMemo(()=>dataset.players.filter(p=>(club==='all'||p.club===club)&&(role==='all'||p.role===role)&&p.minutes>=minimum&&(!search||`${p.name} ${p.club}`.toLowerCase().includes(search.toLowerCase()))),[dataset,club,role,minimum,search]);
  const filtered=useMemo(()=>[...benchmark,...personalPlayers],[benchmark,personalPlayers]);
  const allPlayers=useMemo(()=>[...dataset.players,...personalPlayers],[dataset,personalPlayers]);
  const sorted=useMemo(()=>sortPlayers(filtered,sort.key,sort.ascending,per90),[filtered,sort,per90]);
  const columns=[...new Set([xKey,yKey,...extraColumns])];
  useEffect(()=>{
    if(sort.key!=='name' && sort.key!=='minutes' && ![xKey,yKey,...extraColumns].includes(sort.key))setSort({key:yKey,ascending:false});
  },[xKey,yKey,extraColumns,sort.key]);
  const pageCount=Math.max(1,Math.ceil(sorted.length/12)),currentPage=Math.min(page,pageCount-1),pageRows=sorted.slice(currentPage*12,currentPage*12+12);
  useEffect(()=>setPage(0),[club,role,minimum,search,dataset,sort]);
  const selected=allPlayers.find(p=>p.id===selectedId);
  const plottedCount=filtered.filter(p=>metricValue(p,xKey,per90)!==null&&metricValue(p,yKey,per90)!==null).length;
  const resetFilters=()=>{setClub('all');setRole('all');setMinimum(0);setSearch('');};
  const setData=(next:StatsDataset)=>{const axes=availableAxes(next.players,xKey,yKey);setXKey(axes[0]);setYKey(axes[1]);setDataset(next);setClub('all');setRole('all');setSearch('');setMinimum(Math.min(270,Math.max(...next.players.map(p=>p.minutes),0)));setSelectedId(null);setPinned([]);setError('');};
  const disconnect=()=>{importController.current?.abort();client?.disconnect();setClient(null);setLeague(null);setPersonalPlayers([]);setData(statsDemo);setProgress(null);setHeatmapPlayer(null);setToast('Disconnected. Your key and imported session data have been cleared.');};
  const importSeason=async(season:string,limit:number)=>{
    if(!client||!league)return;
    importController.current?.abort();const controller=new AbortController();importController.current=controller;setError('');setProgress({done:0,total:0});
    try {const next=await client.importSeason(league,season,limit,(done,total)=>{if(!controller.signal.aborted)setProgress({done,total});},controller.signal);if(!controller.signal.aborted){setData(next);setSourcesOpen(false);setToast(`Imported ${next.players.length} players from ${next.matches} matches.`);}}
    catch(e){const cancelled=controller.signal.aborted;controller.abort();if(!cancelled)setError((e as Error).message);else setToast('Import cancelled. Your previous dataset has been kept.');}
    finally{if(importController.current===controller)setProgress(null);}
  };
  const pin=(id:string)=>setPinned(current=>current.includes(id)?current.filter(p=>p!==id):current.length<5?[...current,id]:current);
  const changeSort=(key:typeof sort.key)=>setSort(current=>({key,ascending:current.key===key?!current.ascending:key==='name'}));
  const saveChart=()=>{try{exportChart(dataset.source,dataset.season,personalPlayers.length>0);setToast('Chart exported as a crisp, scalable SVG.');}catch(e){setError((e as Error).message);}};
  const benchmarkName=dataset.source==='Demo'?'the fictional demo':dataset.source==='PitchAPI'?`Premier League · ${dataset.season}`:dataset.label??'your dataset';
  const addOwn=(players:PlayerStats[])=>{const next=addComparisons(personalPlayers,players);const axes=availableAxes(players.slice(0,1),xKey,yKey);setXKey(axes[0]);setYKey(axes[1]);setPersonalPlayers(next);setSelectedId(players[0]?.id??null);setToast(editingId?'Your player has been updated.':`Added ${players.length} personal player${players.length===1?'':'s'} to the comparison.`);};
  const openOwn=()=>{setEditingId(null);setOwnDataOpen(true);};
  const editOwn=(id:string)=>{setEditingId(id);setOwnDataOpen(true);};
  const removeOwn=(id:string)=>{setPersonalPlayers(current=>current.filter(p=>p.id!==id));setPinned(current=>current.filter(p=>p!==id));if(selectedId===id)setSelectedId(null);};
  const applyView=(view:SavedStatsView)=>{setXKey(view.xKey);setYKey(view.yKey);setPer90(view.per90);setMinimum(view.minimum);setRole(view.role);setClub(view.club==='all'||clubs.includes(view.club)?view.club:'all');setAverages(view.averages);setLabels(view.labels);setExtraColumns(view.columns);setSearch('');setToast('View applied. Any club absent from this dataset defaults to all clubs.');};
  const activePreset=PRESETS.find(p=>p.x===xKey&&p.y===yKey);
  return <div className={`stats-hub ${dark?'stats-dark':''}`} data-density={preferences.density}>
    <header className="stats-header"><a href="#" className="stats-brand" onClick={e=>{e.preventDefault();onHome();}}><img src="/ZTBLogo.png" alt=""/><span>ZaidTacticsBoard<small>FOOTBALL WORKSPACE</small></span></a><div className="stats-header-context"><span/> Data studio</div><nav aria-label="Studio navigation"><button onClick={onPersonalize} className="stats-icon-button" aria-label="Personalize workspace"><Palette size={17}/></button><button onClick={onHome} className="stats-icon-button" aria-label="Studio home"><Home size={16}/></button><button onClick={onOpenBoard} className="stats-button stats-board-link"><ArrowLeft size={14}/> Tactics board</button><button onClick={toggleTheme} className="stats-icon-button" aria-label={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button></nav></header>
    <main className="stats-main">
      <div className="stats-title-row"><div><p className="stats-overline"><span className="stats-tiny-square"/> STATS ANALYSIS <span className="stats-beta">BETA</span></p><h1>Find the story in the numbers<span>.</span></h1><p className="stats-intro">Compare players. Explore patterns. See the game from a different angle.</p></div><div className="stats-title-actions"><button className="stats-button" onClick={openOwn} disabled={!!progress}><UserRound size={15}/> Add my data</button><button className="stats-button stats-button-primary" onClick={()=>setSourcesOpen(true)}><Database size={15}/>{client?'Manage data':'Connect your data'}<ArrowRight size={14}/></button></div></div>
      <div className={`stats-source-strip ${dataset.source==='Demo'?'is-demo':''}`}><span><i/>{dataset.source==='Demo'?<><strong>Demo workspace</strong><span>Fictional benchmark & illustrative figures. Connect PitchAPI for real Premier League data.</span></>:<><strong>{dataset.source==='PitchAPI'?'Premier League':dataset.label??'Your imported table'}</strong><span>{dataset.source==='CSV'?`${dataset.players.length} players · imported CSV`:`${dataset.season} · ${dataset.source}${dataset.matches?` · ${dataset.matches} completed matches`:''}`}</span></>}</span><button onClick={()=>setSourcesOpen(true)} className="stats-text-button">{progress?`Importing ${progress.done}/${progress.total||'…'}`:'Data sources'} <ArrowRight size={13}/></button></div>
      <SavedViews current={{xKey,yKey,per90,minimum,role,club,averages,labels,columns:extraColumns}} onApply={applyView}/>
      {personalPlayers.length>0&&<section className="stats-personal-strip" aria-label="Your comparison players"><div className="stats-personal-heading"><span><span className="stats-own-diamond"/> YOUR COMPARISON PLAYERS <b>{personalPlayers.length}</b></span><button className="stats-text-button" onClick={()=>downloadFile(exportCsv(personalPlayers,METRICS.map(m=>m.key),false,{baseSource:'Personal',baseSample:'Your sample'}),'text/csv','my-comparison-players.csv')}><Download size={12}/> Save my players</button></div><div className="stats-personal-chips">{personalPlayers.map(p=><div key={p.id} className={selectedId===p.id?'is-active':''}><button onClick={()=>setSelectedId(p.id)}>{p.name}</button><button aria-label={`Edit ${p.name}`} onClick={()=>editOwn(p.id)}><Pencil size={11}/></button><button aria-label={`Remove ${p.name} from comparison`} onClick={()=>removeOwn(p.id)}><X size={12}/></button></div>)}<button className="stats-text-button" disabled={!!progress} onClick={openOwn}><Plus size={13}/> Add another</button></div><p>Your players stay visible while filters refine the benchmark. Averages and percentiles use the benchmark only.{dataset.source==='Demo'?' This benchmark is fictional; connect PitchAPI to compare with professionals.':''}</p></section>}
      {error&&!sourcesOpen&&<p role="alert" className="stats-error">{error}</p>}
      <section className="stats-filter-bar" aria-label="Benchmark player filters">
        <label className="stats-search"><Search size={16}/><input aria-label="Search players or clubs" placeholder="Search players or clubs…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button className="stats-icon-button" aria-label="Clear search" onClick={()=>setSearch('')}><X size={13}/></button>}</label>
        <label className="stats-inline-field"><span>Benchmark club</span><select aria-label="Club filter" value={club} onChange={e=>setClub(e.target.value)}><option value="all">All clubs</option>{clubs.map(c=><option key={c}>{c}</option>)}</select></label>
        <label className="stats-inline-field" title="Broad role grouped from lineups, weighted by minutes"><span>Lineup role</span><select aria-label="Role filter" value={role} onChange={e=>setRole(e.target.value)}><option value="all">All roles</option>{Object.keys(ROLE_COLORS).map(r=><option key={r}>{r}</option>)}</select></label>
        <label className="stats-inline-field stats-minutes"><span>Min. minutes</span><input type="number" aria-label="Minimum minutes" min="0" max="10000" step="90" value={minimum} onChange={e=>setMinimum(Math.max(0,Math.min(10000,Number(e.target.value)||0)))}/></label>
        <button onClick={resetFilters} className="stats-icon-button" aria-label="Reset player filters" title="Reset filters"><RotateCcw size={15}/></button>
      </section>
      <div className="stats-workspace">
        <aside className="stats-controls stats-panel"><div className="stats-panel-heading"><h2>Build your view</h2><SlidersHorizontal size={15}/></div>
          <MetricSelect label="X axis · horizontal" value={xKey} onChange={setXKey}/>
          <button className="stats-swap" onClick={()=>{setXKey(yKey);setYKey(xKey);}}><ArrowDownUp size={13}/> Swap axes</button>
          <MetricSelect label="Y axis · vertical" value={yKey} onChange={setYKey}/>
          <div className="stats-units" role="group" aria-label="Statistic units"><button aria-pressed={per90} className={per90?'active':''} onClick={()=>setPer90(true)}>Per 90</button><button aria-pressed={!per90} className={!per90?'active':''} onClick={()=>setPer90(false)}>Totals</button></div>
          <div className="stats-control-section"><p className="stats-overline"><Sparkles size={12}/> QUICK VIEWS</p><div className="stats-presets">{PRESETS.map(p=><button key={p.name} aria-pressed={activePreset===p} className={activePreset===p?'active':''} onClick={()=>{setXKey(p.x);setYKey(p.y);}}>{p.name}{activePreset===p?<Check size={13}/>:<ArrowRight size={12}/>}</button>)}</div></div>
          <div className="stats-display-options"><label><input type="checkbox" checked={averages} onChange={e=>setAverages(e.target.checked)}/> Show sample averages</label><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/> Label standout players</label></div>
        </aside>
        <section className="stats-chart-panel stats-panel" aria-labelledby="scatter-title"><div className="stats-chart-heading"><div><p className="stats-overline">PLAYER EXPLORER</p><h2 id="scatter-title">{activePreset?.name??'Your custom comparison'}</h2><p>{activePreset?.note??`${METRIC_BY_KEY[xKey].short} meets ${METRIC_BY_KEY[yKey].short}.`}</p></div><button className="stats-icon-button" title="Export chart as SVG" aria-label="Export chart as SVG" onClick={saveChart}><Download size={17}/></button></div>
          <div className="stats-plot-summary"><span><strong>{plottedCount}</strong> players plotted</span><div className="stats-legend">{personalPlayers.length>0&&<span><span className="stats-own-diamond"/> Yours</span>}{preferences.colorMode==='accent'?<span><i style={{background:'var(--stats-accent)'}}/> Benchmark</span>:Object.entries(ROLE_COLORS).filter(([r])=>benchmark.some(p=>p.role===r)).map(([r,color])=><span key={r}><i style={{background:color}}/>{r}</span>)}</div></div>
          <ScatterPlot players={filtered} xKey={xKey} yKey={yKey} per90={per90} selectedId={selectedId} pinned={pinned} onSelect={setSelectedId} averages={averages} labels={labels} source={dataset.source} season={dataset.season} preferences={preferences}/>
          {!benchmark.length&&personalPlayers.length>0&&<p className="stats-missing">No benchmark players match these filters. Your players are still shown.</p>}
          {!benchmark.length&&<button className="stats-empty-reset stats-text-button" onClick={resetFilters}>Clear filters to see players <ArrowRight size={13}/></button>}
        </section>
        <PlayerSpotlight player={selected} players={benchmark} allPlayers={allPlayers} xKey={xKey} yKey={yKey} per90={per90} pinned={pinned} onPin={pin} onSelect={setSelectedId} onClear={()=>setSelectedId(null)} onHeatmap={setHeatmapPlayer} canHeatmap={!!client&&dataset.source==='PitchAPI'&&!selected?.personal} onEdit={()=>{if(selected)editOwn(selected.id);}}/>
      </div>
      <section className="stats-table-panel stats-panel" aria-labelledby="stats-table-title"><div className="stats-table-top"><div><h2 id="stats-table-title">The numbers behind the dots <span>{filtered.length}</span></h2><p>{per90?'Counting statistics per 90 minutes':'Counting statistics as sample totals'} · percentages stay percentages</p></div><div className="stats-table-actions"><details className="stats-columns"><summary><Settings2 size={14}/> Columns</summary><div>{METRICS.filter(m=>m.key!==xKey&&m.key!==yKey).map(m=><label key={m.key}><input type="checkbox" checked={extraColumns.includes(m.key)} onChange={e=>setExtraColumns(current=>e.target.checked?[...current,m.key]:current.filter(k=>k!==m.key))}/>{m.label}</label>)}</div></details><button className="stats-button" disabled={!filtered.length} onClick={()=>{downloadFile(exportCsv(sorted,columns,per90,{baseSource:dataset.source,baseSample:dataset.season}),'text/csv',`zaid-stats-${dataset.source.toLowerCase()}.csv`);setToast('Exported all filtered players.');}}><Download size={14}/><span>Export CSV</span></button></div></div>
        <div className="stats-table-scroll"><table><thead><tr><th aria-sort={sort.key==='name'?(sort.ascending?'ascending':'descending'):'none'}><button onClick={()=>changeSort('name')}>Player <ArrowDownUp size={11}/></button></th><th>Club</th><th>Role</th><th aria-sort={sort.key==='minutes'?(sort.ascending?'ascending':'descending'):'none'}><button onClick={()=>changeSort('minutes')}>Minutes <ArrowDownUp size={11}/></button></th>{columns.map(key=><th key={key} aria-sort={sort.key===key?(sort.ascending?'ascending':'descending'):'none'}><button title={METRIC_BY_KEY[key].description} onClick={()=>changeSort(key)}>{metricLabel(key,per90)} {sort.key===key?<ArrowDown size={11} style={{transform:sort.ascending?'rotate(180deg)':undefined}}/>:<ArrowDownUp size={11}/>}</button></th>)}</tr></thead><tbody>{pageRows.map(p=><tr key={p.id} className={`${p.id===selectedId?'is-selected':''} ${p.personal?'is-personal':''}`}><td><button className="stats-player-name" onClick={()=>setSelectedId(p.id)} aria-pressed={p.id===selectedId}><span style={{color:ROLE_COLORS[p.role],background:ROLE_COLORS[p.role]+'16'}}>{p.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span>{p.name}{p.personal&&<em className="stats-yours-label">Yours</em>}{pinned.includes(p.id)&&<span className="stats-pin-dot"/>}</button></td><td>{p.club}</td><td><span className="stats-role-tag" style={{color:ROLE_COLORS[p.role]}}>{p.role}</span></td><td>{p.minutes.toLocaleString()}</td>{columns.map(key=><td key={key} title={p.metrics[key]===null?'Unavailable or incomplete for this player’s sample':undefined}>{formatStat(metricValue(p,key,per90),key)}</td>)}</tr>)}</tbody></table>{!pageRows.length&&<div className="stats-table-empty"><Search size={22}/><h3>No players match these filters</h3><p>Try a different name, club, role, or minutes threshold.</p><button className="stats-button" onClick={resetFilters}>Reset filters</button></div>}</div>
        <div className="stats-table-bottom"><span>{sorted.length?`${currentPage*12+1}–${Math.min((currentPage+1)*12,sorted.length)} of ${sorted.length} players`:'0 players'} <span className="stats-table-missing-note">· — means unavailable, not zero</span></span><div><button className="stats-icon-button" aria-label="Previous table page" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}><ChevronLeft size={15}/></button><span>{currentPage+1} / {pageCount}</span><button className="stats-icon-button" aria-label="Next table page" disabled={currentPage===pageCount-1} onClick={()=>setPage(currentPage+1)}><ChevronRight size={15}/></button></div></div>
      </section>
      <footer className="stats-footer"><span><BarChart3 size={13}/> ZaidTacticsBoard · Data studio</span><span>{dataset.source==='Demo'?'Demo only · fictional players and figures':`${dataset.source} · Imported ${new Date(dataset.updatedAt).toLocaleString()}`}</span></footer>
    </main>
    {toast&&<div className="stats-toast" role="status"><Check size={15}/>{toast}</div>}
    <DataSourceDialog open={sourcesOpen} onClose={()=>setSourcesOpen(false)} client={client} league={league} onConnect={(next,l)=>{client?.disconnect();setClient(next);setLeague(l);setError('');}} onDisconnect={disconnect} onImport={importSeason} progress={progress} onCancel={()=>importController.current?.abort()} onOwnData={openOwn} onDemo={()=>setData(statsDemo)} error={error}/>
    <OwnDataDialog open={ownDataOpen} player={personalPlayers.find(p=>p.id===editingId)} onClose={()=>setOwnDataOpen(false)} onCompare={addOwn} onDataset={next=>{setData(next);setToast(`Opened ${next.players.length} players from your dataset.`);}} benchmarkName={benchmarkName}/>
    <HeatmapDialog player={heatmapPlayer} matches={dataset.matchList??[]} client={client} onClose={()=>setHeatmapPlayer(null)}/>
  </div>;
}
