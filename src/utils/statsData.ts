import type { MetricKey, PitchMatch, PlayerRole, PlayerStats, StatsDataset } from '../types/stats';
import { emptyCoverage, emptyMetrics, METRICS, METRIC_BY_KEY, metricLabel, metricValue } from './statsMetrics';

type Json = Record<string, any>;
export const numeric = (value:unknown):number|null => typeof value==='number' && Number.isFinite(value) ? value : null;
export function flattenStats(groups:unknown) {
  const result: Record<string,{value:number|null;total:number|null}> = {};
  if(!Array.isArray(groups)) return result;
  for(const group of groups) for(const entry of Object.values(group?.stats??{}) as Json[]) {
    if(!entry || typeof entry.key!=='string' || entry.stat?.type==='boolean') continue;
    result[entry.key]={value:numeric(entry.stat?.value),total:numeric(entry.stat?.total)};
  }
  return result;
}
export type MatchPlayer = PlayerStats & { passMade:number|null; passAttempted:number|null };
export function matchPlayers(match:PitchMatch, basic:unknown, advanced:unknown, lineups:unknown, shotData:unknown=null):MatchPlayer[] {
  if(!Array.isArray(basic)) throw new Error('PitchAPI returned an unexpected player-stat format.');
  const advancedPlayers=(advanced as Json|null)?.players;
  if(advanced!==null && !Array.isArray(advancedPlayers)) throw new Error('PitchAPI returned an unexpected advanced-stat format.');
  const advancedById=new Map<string,Json>((advancedPlayers??[]).map((p:Json)=>[p.player?.id,p]));
  const periods=(shotData as Json|null)?.periods;
  // A complete match feed can establish zero shots. An absent/incomplete feed cannot.
  const hasShotFeed=(shotData as Json|null)?.match_id===match.id && Array.isArray(periods)
    && ['FirstHalf','SecondHalf'].every(half=>periods.some((p:Json)=>p.period===half && Array.isArray(p.shots)))
    && periods.every((p:Json)=>Array.isArray(p.shots));
  const shots:Json[]=hasShotFeed ? [...new Map<string,Json>(periods.flatMap((p:Json)=>p.shots).filter((s:Json)=>typeof s.id==='string').map((s:Json)=>[s.id,s] as [string,Json])).values()] : [];
  const roles=new Map<string,PlayerRole>();
  for(const side of ['home','away']) {
    const lineup=(lineups as Json|null)?.[side];
    if(!lineup?.confirmed) continue;
    for(const p of lineup.starters??[]) {
      const x=numeric(p.pitch_x);
      roles.set(p.player_id,x===null?'Unknown':x<=.15?'GK':x<.4?'DEF':x<.8?'MID':'FWD');
    }
    for(const p of lineup.subs??[]) roles.set(p.player_id,(['GK','DEF','MID','FWD'] as PlayerRole[])[p.position_id]??'Unknown');
  }
  const output:MatchPlayer[]=[];
  for(const entry of basic) {
    if(typeof entry?.player?.id!=='string' || typeof entry?.player?.name!=='string') continue;
    const stats=flattenStats(entry.stats), adv=advancedById.get(entry.player.id);
    const get=(...keys:string[])=>keys.map(k=>stats[k]?.value).find(v=>v!==null && v!==undefined)??null;
    const minutes=get('minutes_played')??numeric(adv?.minutes_played);
    // Unused substitutes are included by the provider. Never invent appearances.
    if(minutes===null || minutes<=0) continue;
    const team=entry.team_id===match.home_team.id?match.home_team:entry.team_id===match.away_team.id?match.away_team:null;
    if(!team) continue;
    const metrics=emptyMetrics();
    Object.assign(metrics,{
      goals:get('goals'),assists:get('assists'),xg:get('expected_goals'),xa:get('expected_assists'),
      xgot:get('expected_goals_on_target_variant','expected_goals_on_target'),npxg:get('expected_goals_non_penalty'),
      shots:get('total_shots'),shotsOnTarget:get('ShotsOnTarget','shots_on_target'),touches:get('touches'),
      tackles:get('matchstats.headers.tackles','tackles'),interceptions:get('interceptions'),
      progressivePasses:numeric(adv?.passing?.progressive_passes),progressiveCarries:numeric(adv?.carrying?.progressive_carries),
      keyPasses:numeric(adv?.passing?.key_passes),passesIntoBox:numeric(adv?.passing?.passes_into_box),
      sca:numeric(adv?.creation?.sca),xT:numeric(adv?.possession_value?.xt_total),
    });
    if(hasShotFeed) {
      const attempts=shots.filter(s=>s.player?.id===entry.player.id && s.team_id===entry.team_id && s.event_type!=='OwnGoal');
      const sum=(values:(number|null)[])=>values.some(v=>v===null)?null:values.reduce<number>((s,v)=>s+v!,0);
      metrics.shots??=attempts.length;
      metrics.xg??=sum(attempts.map(s=>numeric(s.expected_goals)));
      metrics.xgot??=sum(attempts.map(s=>numeric(s.expected_goals_on_target)??(s.is_on_target===false || s.is_blocked===true ? 0 : null)));
      metrics.npxg??=attempts.some(s=>typeof s.situation!=='string')?null:sum(attempts.filter(s=>s.situation!=='Penalty').map(s=>numeric(s.expected_goals)));
      metrics.shotsOnTarget??=attempts.some(s=>typeof s.is_on_target!=='boolean')?null:attempts.filter(s=>s.is_on_target && !s.is_blocked).length;
    }
    const passMade=stats.accurate_passes?.value??null,passAttempted=stats.accurate_passes?.total??null;
    metrics.passAccuracy=passMade!==null && passAttempted!==null && passAttempted>0?passMade/passAttempted*100:null;
    output.push({id:entry.player.id,name:entry.player.name,club:team.name,teamId:team.id,role:roles.get(entry.player.id)??'Unknown',minutes,appearances:1,metrics,coverage:emptyCoverage(),passMade,passAttempted});
  }
  return output;
}
export function aggregatePlayers(matches:MatchPlayer[][]):PlayerStats[] {
  const rows=new Map<string,{row:PlayerStats;roles:Map<PlayerRole,number>;clubs:Map<string,number>;made:number;attempted:number;passingMatches:number}>();
  for(const players of matches) {
    const seen=new Set<string>();
    for(const p of players) {
      if(seen.has(p.id)) continue;
      seen.add(p.id);
      let state=rows.get(p.id);
      if(!state) {
        state={row:{...p,metrics:emptyMetrics(),coverage:emptyCoverage(),minutes:0,appearances:0},roles:new Map(),clubs:new Map(),made:0,attempted:0,passingMatches:0};
        rows.set(p.id,state);
      }
      const {row}=state;
      row.minutes+=p.minutes;row.appearances+=1;
      state.roles.set(p.role,(state.roles.get(p.role)??0)+p.minutes);
      state.clubs.set(p.club,(state.clubs.get(p.club)??0)+p.minutes);
      for(const {key} of METRICS) if(key!=='passAccuracy' && p.metrics[key]!==null) {
        row.metrics[key]=(row.metrics[key]??0)+p.metrics[key]!;
        row.coverage[key]++;
      }
      if(p.passMade!==null && p.passAttempted!==null) {state.made+=p.passMade;state.attempted+=p.passAttempted;state.passingMatches++;}
    }
  }
  return [...rows.values()].map(({row,roles,clubs,made,attempted,passingMatches})=>{
    row.role=[...roles].sort((a,b)=>b[1]-a[1])[0][0];
    row.club=[...clubs.keys()].join(' / ');
    row.coverage.passAccuracy=passingMatches;
    row.metrics.passAccuracy=passingMatches===row.appearances && attempted>0?made/attempted*100:null;
    // Totals and per-90s use the same complete sample; a missing match is not zero.
    for(const {key} of METRICS) if(row.coverage[key]<row.appearances) row.metrics[key]=null;
    return row;
  });
}
function csvCell(value:unknown) {
  let text=String(value??'');
  if(typeof value==='string' && /^[=+@\-\t\r]/.test(text)) text="'"+text;
  return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;
}
export function exportCsv(players:PlayerStats[],keys:MetricKey[],per90:boolean,provenance?:{baseSource:string;baseSample:string}) {
  const header=['Player','Club','Role','Minutes',...keys.map(k=>metricLabel(k,per90)),...(provenance?['Origin','Sample']:[])];
  return [header,...players.map(p=>[p.name,p.club,p.role,p.minutes,...keys.map(k=>{
    const value=metricValue(p,k,per90);return value===null?null:Number(value.toFixed(6));
  }),...(provenance?[p.personal?'Personal':provenance.baseSource,p.sampleLabel??provenance.baseSample]:[])])].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function parseCsv(text:string):string[][] {
  const rows:string[][]=[];let row:string[]=[],value='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const char=text[i];
    if(char==='"') {if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(char===',' && !quoted){row.push(value.trim());value='';}
    else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(value.trim());if(row.some(Boolean))rows.push(row);row=[];value='';}
    else value+=char;
  }
  if(quoted)throw new Error('An opening quote in the CSV has no closing quote.');
  row.push(value.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function importCsv(text:string):StatsDataset {
  if(text.length>5_000_000)throw new Error('Please use a CSV smaller than 5 MB.');
  const [header,...rows]=parseCsv(text.replace(/^\uFEFF/,''));
  if(!header || !rows.length)throw new Error('The CSV needs a header and at least one player.');
  if(rows.length>5000)throw new Error('Please import up to 5,000 players at a time.');
  const normal=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
  const columns=header.map(normal);
  if(new Set(columns).size!==columns.length)throw new Error('The CSV contains duplicate column names.');
  const nameIndex=columns.findIndex(c=>c==='player'||c==='name');
  const minutesIndex=columns.indexOf('minutes'),clubIndex=columns.indexOf('club'),roleIndex=columns.findIndex(c=>c==='role'||c==='position');
  if(nameIndex<0 || minutesIndex<0)throw new Error('Include Player and Minutes columns. Use raw season totals, not per-90 values.');
  if(header.some(h=>/\/\s*90|per\s*90/i.test(h)))throw new Error('Import raw totals. Per-90 figures are calculated here from Minutes.');
  const mapping=METRICS.map(m=>({key:m.key,index:columns.findIndex(c=>[normal(m.key),normal(m.short),normal(m.label)].includes(c))})).filter(m=>m.index>=0);
  if(!mapping.length)throw new Error('No supported stats found. Download the template for accepted column names.');
  const parse=(raw:string|undefined,label:string,row:number):number|null=>{
    if(!raw || raw==='—'||raw==='-'||raw.toLowerCase()==='na')return null;
    const value=Number(raw.replace(/,/g,'').replace(/%$/,''));
    if(!Number.isFinite(value))throw new Error(`Row ${row}: ${label} must be a number or blank.`);return value;
  };
  const players=rows.map((cells,index)=>{
    const name=cells[nameIndex]?.trim(),minutes=parse(cells[minutesIndex],'Minutes',index+2);
    if(!name || minutes===null || minutes<0)throw new Error(`Row ${index+2}: a player name and non-negative Minutes are required.`);
    const metrics=emptyMetrics(),coverage=emptyCoverage();
    for(const {key,index:i} of mapping){metrics[key]=parse(cells[i],METRIC_BY_KEY[key].label,index+2);if(metrics[key]!==null && ((!METRIC_BY_KEY[key].signed&&metrics[key]!<0)||(key==='passAccuracy'&&metrics[key]!>100)))throw new Error(`Row ${index+2}: ${METRIC_BY_KEY[key].label} is out of range.`);coverage[key]=metrics[key]===null?0:1;}
    const role=cells[roleIndex]?.toUpperCase();
    return {id:`csv-${index}`,name:name.slice(0,120),club:cells[clubIndex]?.slice(0,120)||'Unspecified',teamId:cells[clubIndex]||'csv',role:(['GK','DEF','MID','FWD'].includes(role)?role:'Unknown') as PlayerRole,minutes,appearances:1,metrics,coverage};
  });
  return {version:1,source:'CSV',season:'Imported totals',updatedAt:new Date().toISOString(),matches:0,players};
}
