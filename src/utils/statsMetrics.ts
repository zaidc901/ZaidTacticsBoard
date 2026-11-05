import type { MetricKey, PlayerStats } from '../types/stats';

export const METRICS: { key: MetricKey; label: string; short: string; group: string; description: string; rate?: boolean; signed?: boolean }[] = [
  { key:'xg',label:'Expected goals (xG)',short:'xG',group:'Shooting',description:'Pre-shot chance quality, summed across appearances.' },
  { key:'npxg',label:'Non-penalty xG',short:'npxG',group:'Shooting',description:'Expected goals excluding penalties.' },
  { key:'xgot',label:'xG on target (xGOT)',short:'xGOT',group:'Shooting',description:'Post-shot quality. Missing provider values stay unavailable, not zero.' },
  { key:'goals',label:'Goals',short:'Goals',group:'Shooting',description:'Goals scored.' },
  { key:'shots',label:'Total shots',short:'Shots',group:'Shooting',description:'All recorded shots.' },
  { key:'shotsOnTarget',label:'Shots on target',short:'On target',group:'Shooting',description:'Shots on target reported in the player statistics.' },
  { key:'xa',label:'Expected assists (xA)',short:'xA',group:'Creation',description:'PitchAPI’s expected assists from player match statistics; distinct from xAG.' },
  { key:'assists',label:'Assists',short:'Assists',group:'Creation',description:'Assists reported in player match statistics.' },
  { key:'keyPasses',label:'Key passes',short:'Key passes',group:'Creation',description:'PitchAPI counts passes leading to shots, including those producing goals.' },
  { key:'sca',label:'Shot-creating actions',short:'SCA',group:'Creation',description:'Actions contributing to a shot, using PitchAPI’s event-derived definition.' },
  { key:'progressivePasses',label:'Progressive passes',short:'Progressive passes',group:'Progression',description:'Completed open-play passes from the attacking two thirds moving at least 25% closer to goal, using PitchAPI’s definition.' },
  { key:'progressiveCarries',label:'Progressive carries',short:'Progressive carries',group:'Progression',description:'Progressive carries derived by PitchAPI. Its carry and pass thresholds differ.' },
  { key:'passesIntoBox',label:'Passes into the box',short:'Passes into box',group:'Progression',description:'Completed passes entering the opposition penalty area.' },
  { key:'passAccuracy',label:'Pass completion %',short:'Pass completion',group:'Progression',description:'Completed passes / attempted passes across the sample. Percentages are never divided by 90.',rate:true },
  { key:'xT',label:'Expected threat (xT)',short:'xT',group:'Progression',description:'Total event-derived expected threat from PitchAPI’s model.',signed:true },
  { key:'touches',label:'Touches',short:'Touches',group:'Involvement',description:'Recorded ball touches.' },
  { key:'tackles',label:'Tackles',short:'Tackles',group:'Defending',description:'Tackles reported in player match statistics.' },
  { key:'interceptions',label:'Interceptions',short:'Interceptions',group:'Defending',description:'Recorded interceptions.' },
];
export const METRIC_BY_KEY = Object.fromEntries(METRICS.map(m=>[m.key,m])) as Record<MetricKey, typeof METRICS[number]>;
export const ROLE_COLORS = { GK:'#a67b37', DEF:'#648cc1', MID:'#319c88', FWD:'#b479b2', Unknown:'#8a949e' };
export const PRESETS: {name:string; x:MetricKey; y:MetricKey; note:string}[] = [
  {name:'Chance creators',x:'progressivePasses',y:'xa',note:'Progress the ball. Create the chance.'},
  {name:'Goal threat',x:'xg',y:'goals',note:'Chance quality meets end product.'},
  {name:'Ball progression',x:'progressivePasses',y:'progressiveCarries',note:'Two ways to move the game forward.'},
  {name:'Ball winners',x:'tackles',y:'interceptions',note:'Compare defensive involvement.'},
];
export const emptyMetrics = () => Object.fromEntries(METRICS.map(m=>[m.key,null])) as PlayerStats['metrics'];
export const emptyCoverage = () => Object.fromEntries(METRICS.map(m=>[m.key,0])) as PlayerStats['coverage'];
export function metricValue(player: PlayerStats, key: MetricKey, per90: boolean) {
  const value=player.metrics[key];
  if (value===null || !Number.isFinite(value)) return null;
  if (!per90 || METRIC_BY_KEY[key].rate) return value;
  return player.minutes > 0 ? value * 90 / player.minutes : null;
}
export const metricLabel = (key:MetricKey, per90:boolean) => `${METRIC_BY_KEY[key].short}${METRIC_BY_KEY[key].rate ? ' %' : per90 ? ' / 90' : ''}`;
export const formatStat = (value:number|null, key?:MetricKey) => value===null ? '—' : new Intl.NumberFormat('en-GB',{maximumFractionDigits:key==='xT'?3:2}).format(value);
export function niceDomain(values:number[]): [number,number] {
  const finite=values.filter(Number.isFinite);
  if (!finite.length) return [0,1];
  const min=Math.min(0,...finite), max=Math.max(0,...finite);
  if(min===max) return [0,1];
  const padding=(max-min)*.1;
  const raw=(max-min+padding)/5;
  const power=10**Math.floor(Math.log10(raw));
  const step=[1,2,2.5,5,10].find(v=>v*power>=raw)!*power;
  return [min<0?Math.floor((min-padding)/step)*step:0,Math.ceil((max+padding)/step)*step];
}
export function correlation(points:{x:number;y:number}[]) {
  if(points.length<3) return null;
  const mx=points.reduce((s,p)=>s+p.x,0)/points.length, my=points.reduce((s,p)=>s+p.y,0)/points.length;
  const xx=points.reduce((s,p)=>s+(p.x-mx)**2,0), yy=points.reduce((s,p)=>s+(p.y-my)**2,0);
  if(!xx || !yy) return null;
  return Math.max(-1,Math.min(1,points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/Math.sqrt(xx*yy)));
}
export function sortPlayers(players:PlayerStats[], key:MetricKey|'name'|'minutes', ascending:boolean, per90:boolean) {
  return [...players].sort((a,b)=>{
    if(key==='name') return (ascending?1:-1)*a.name.localeCompare(b.name);
    const av=key==='minutes'?a.minutes:metricValue(a,key,per90),bv=key==='minutes'?b.minutes:metricValue(b,key,per90);
    if(av===null) return bv===null?a.name.localeCompare(b.name):1;
    if(bv===null) return -1;
    return (ascending?av-bv:bv-av)||a.name.localeCompare(b.name);
  });
}
