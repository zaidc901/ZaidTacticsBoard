import { useEffect, useRef, useState } from 'react';
import { Check, Database, Download, KeyRound, LoaderCircle, ShieldCheck, Unplug, Upload, X } from 'lucide-react';
import type { PitchLeague, StatsDataset } from '../../types/stats';
import { PitchApiClient } from '../../utils/pitchApi';



type Props={open:boolean;onClose:()=>void;client:PitchApiClient|null;league:PitchLeague|null;onConnect:(client:PitchApiClient,league:PitchLeague)=>void;onDisconnect:()=>void;onImport:(season:string,limit:number)=>Promise<void>;progress:{done:number;total:number}|null;onCancel:()=>void;onOwnData:()=>void;onDemo:()=>void;error:string};
export function DataSourceDialog({open,onClose,client,league,onConnect,onDisconnect,onImport,progress,onCancel,onOwnData,onDemo,error}:Props) {
  const dialog=useRef<HTMLDialogElement>(null),connectAbort=useRef<AbortController|null>(null);
  const [key,setKey]=useState(''),[checking,setChecking]=useState(false),[localError,setLocalError]=useState(''),[season,setSeason]=useState(''),[limit,setLimit]=useState(0);
  const seasons=[...(league?.seasons??[])].sort().reverse();
  useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();else if(!open&&dialog.current?.open)dialog.current.close();},[open]);
  useEffect(()=>()=>connectAbort.current?.abort(),[]);
  const close=()=>{connectAbort.current?.abort();setKey('');setLocalError('');onClose();};
  const connect=async()=>{
    if(!key.trim()){setLocalError('Enter your personal PitchAPI key.');return;}
    setChecking(true);setLocalError('');const next=new PitchApiClient(key);const controller=new AbortController();connectAbort.current=controller;
    try{const available=await next.premierLeague(controller.signal);if(controller.signal.aborted){next.disconnect();return;}onConnect(next,available);setSeason([...available.seasons].sort().at(-1)??'');setKey('');}
    catch(e){next.disconnect();if(!controller.signal.aborted)setLocalError((e as Error).message);}
    finally{setChecking(false);}
  };
  return <dialog ref={dialog} className="stats-dialog" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}} aria-labelledby="stats-source-title">
    <div className="stats-dialog-head"><div><span className="stats-overline">YOUR DATA, YOUR WORKSPACE</span><h2 id="stats-source-title">Choose your data source</h2></div><button className="stats-icon-button" onClick={close} aria-label="Close data sources"><X size={18}/></button></div>
    <div className="stats-source-provider"><div className="stats-source-icon"><Database size={22}/></div><div><h3>PitchAPI</h3><p>Premier League · player statistics & advanced analytics</p></div>{client&&<span className="stats-connected"><Check size={13}/> Connected</span>}</div>
    <p className="stats-privacy"><ShieldCheck size={17}/><span>Your key stays in this tab’s memory and is forwarded to PitchAPI through our relay. We do not save it. Reload or disconnect to clear it.</span></p>
    {!client ? <form onSubmit={e=>{e.preventDefault();void connect();}}>
      <label className="stats-field">Your personal API key<div className="stats-key-input"><KeyRound size={16}/><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="pk_live_… or pk_test_…" autoComplete="off" spellCheck={false} aria-label="PitchAPI key" disabled={checking}/></div></label>
      <div className="stats-connect-row"><a href="https://pitchapi.dev/get-api-key" target="_blank" rel="noreferrer">Get a free key ↗</a><button type="submit" className="stats-button stats-button-primary" disabled={checking}>{checking?<LoaderCircle className="stats-spin" size={15}/>:<KeyRound size={15}/>} {checking?'Connecting…':'Connect PitchAPI'}</button></div>
    </form>:<>
      <div className="stats-import-options"><label className="stats-field">Season<select value={season||seasons[0]} onChange={e=>setSeason(e.target.value)} disabled={!!progress}>{seasons.map(s=><option key={s}>{s}</option>)}</select></label><label className="stats-field">Match sample<select value={limit} onChange={e=>setLimit(Number(e.target.value))} disabled={!!progress}><option value={0}>All completed matches</option><option value={10}>Latest 10 league matches</option><option value={30}>Latest 30 league matches</option></select></label></div>
      <p className="stats-helper">Imports run on demand, then charts use the data in memory. Four requests per match; repeated imports reuse this session’s cache. Roles are grouped from lineups.</p>
      {progress?<div className="stats-import-progress" role="status"><div><span>Importing match {progress.done} of {progress.total||'…'}</span><button onClick={onCancel} className="stats-text-button">Cancel</button></div><progress value={progress.done} max={progress.total||1}/></div>:<div className="stats-connect-row"><button className="stats-text-button" onClick={()=>{onDisconnect();setLocalError('');}}><Unplug size={14}/> Disconnect</button><button className="stats-button stats-button-primary" onClick={()=>void onImport(season||seasons[0],limit)}><Download size={15}/> Import Premier League</button></div>}
    </>}
    {(localError||error)&&<p role="alert" className="stats-error">{localError||error}</p>}
    <div className="stats-source-divider"><span>OR BRING YOUR OWN TABLE</span></div>
    <p className="stats-helper">Add your own player profile, compare a CSV with this dataset, or use your own table. Match columns and choose totals or per-90 units before importing.</p>
    <button className="stats-button" disabled={!!progress||checking} onClick={()=>{close();onOwnData();}}><Upload size={15}/> Add my stats or dataset</button>
    <button className="stats-demo-button" disabled={!!progress} onClick={()=>{onDemo();close();}}>Explore with fictional sample data <span>→</span></button>
  </dialog>;
}
