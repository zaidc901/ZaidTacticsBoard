import type { Heatmap, PitchLeague, PitchMatch, StatsDataset } from '../types/stats';
import { aggregatePlayers, matchPlayers, type MatchPlayer } from './statsData';

export class PitchApiClient {
  #key:string;
  #cache=new Map<string,unknown>();
  #controller=new AbortController();
  constructor(key:string) { this.#key=key.trim(); }
  disconnect(){this.#controller.abort();this.#key='';this.#cache.clear();}
  async request<T>(path:string, signal?:AbortSignal):Promise<T> {
    if(!this.#key)throw new Error('Connect your PitchAPI key first.');
    if(this.#cache.has(path))return this.#cache.get(path) as T;
    const endpoint=(import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_PITCHAPI_PROXY_URL||'/api/pitchapi';
    const signals=[this.#controller.signal,AbortSignal.timeout(35000),...(signal?[signal]:[])];
    let response:Response;
    try {response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-PitchAPI-Key':this.#key},body:JSON.stringify({path}),signal:AbortSignal.any(signals),cache:'no-store',credentials:'omit'});} catch(error) {
      if(signal?.aborted || this.#controller.signal.aborted)throw new DOMException('Import cancelled.','AbortError');
      throw new Error('Could not connect to the data service. Check your connection and try again.');
    }
    let payload;
    try {payload=await response.json();}catch{throw new Error('The PitchAPI relay is not configured on this host yet. CSV import and the demo still work.');}
    if(!response.ok || payload.error) {
      const error=new Error(payload.error?.message||'PitchAPI could not complete the request.') as Error & {code?:string};
      error.code=payload.error?.code;throw error;
    }
    if(!Object.hasOwn(payload,'data'))throw new Error('Unexpected response from the data service.');
    this.#cache.set(path,payload.data);return payload.data;
  }
  async premierLeague(signal?:AbortSignal) {
    const data=await this.request<{leagues:PitchLeague[]}>('/v1/leagues',signal);
    const league=data.leagues?.find(l=>l.name==='Premier League' && l.country_code==='ENG');
    if(!league || !Array.isArray(league.seasons))throw new Error('Premier League coverage was not found for this key.');
    return league;
  }
  async importSeason(league:PitchLeague,season:string,limit:number,onProgress:(done:number,total:number)=>void,signal:AbortSignal):Promise<StatsDataset> {
    if(!league.seasons.includes(season))throw new Error('Choose an available season.');
    const data=await this.request<{matches:PitchMatch[]}>(`/v1/leagues/${league.id}/matches?season=${encodeURIComponent(season)}`,signal);
    if(!Array.isArray(data.matches))throw new Error('Unexpected match-list format.');
    const all=[...new Map(data.matches.filter(m=>m.status==='finished').map(m=>[m.id,m])).values()].sort((a,b)=>a.date.localeCompare(b.date));
    const matches=limit>0?all.slice(-limit):all;
    if(!matches.length)throw new Error('There are no completed matches for this season yet.');
    const rows:MatchPlayer[][]=new Array(matches.length);let next=0,done=0;
    onProgress(0,matches.length);
    const optional=async(path:string)=>{try{return await this.request(path,signal);}catch(e){if((e as Error & {code?:string}).code==='ANALYTICS_UNAVAILABLE')return null;throw e;}};
    await Promise.all(Array.from({length:Math.min(3,matches.length)},async()=>{
      while(next<matches.length){
        if(signal.aborted)throw new DOMException('Import cancelled.','AbortError');
        const index=next++,match=matches[index];
        const basic=await this.request(`/v1/matches/${match.id}/players`,signal);
        const advanced=await optional(`/v1/matches/${match.id}/advanced/players`);
        const lineups=await this.request(`/v1/matches/${match.id}/lineups`,signal);
        const shots=await this.request(`/v1/matches/${match.id}/shots`,signal);
        rows[index]=matchPlayers(match,basic,advanced,lineups,shots);onProgress(++done,matches.length);
      }
    }));
    const players=aggregatePlayers(rows);
    if(!players.length)throw new Error('No players with recorded minutes were returned. Your previous data has been kept.');
    return {version:1,source:'PitchAPI',season,updatedAt:new Date().toISOString(),matches:matches.length,players,matchList:matches};
  }
  heatmap(matchId:string,signal:AbortSignal){return this.request<Heatmap>(`/v1/matches/${matchId}/heatmaps`,signal);}
}
