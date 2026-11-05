import type { MetricKey, PlayerRole, PlayerStats, StatsDataset } from '../types/stats';
import { emptyCoverage, emptyMetrics, METRICS, METRIC_BY_KEY, metricValue } from './statsMetrics';
import { parseCsv } from './statsData';

export type ImportField = 'name'|'club'|'role'|'minutes'|'sample'|MetricKey;
export type ColumnMapping = Partial<Record<ImportField,{index:number;per90:boolean}>>;
export const IMPORT_FIELDS: {key:ImportField;label:string;required?:boolean}[] = [
  {key:'name',label:'Player name',required:true},{key:'minutes',label:'Minutes played',required:true},
  {key:'club',label:'Club / team'},{key:'role',label:'Role'},{key:'sample',label:'Sample / season'},...METRICS.map(m=>({key:m.key,label:m.label})),
];
const normalize=(s:string)=>s.toLowerCase().replace(/\/?\s*(per\s*)?90\b/g,'').replace(/[^a-z0-9]/g,'');
const aliases:Partial<Record<ImportField,string[]>>={name:['player','name','playername','fullname'],minutes:['minutes','min','mins','minutesplayed'],club:['club','squad','team'],role:['role','position','pos'],progressivePasses:['prgp'],progressiveCarries:['prgc'],passAccuracy:['cmp','passaccuracy','passcompletion','passcompletionpercentage'],shots:['sh'],shotsOnTarget:['sot'],tackles:['tkl'],interceptions:['int']};
export function readImportTable(text:string) {
  if(text.length>5_000_000)throw new Error('Please use a CSV smaller than 5 MB.');
  const [header,...rows]=parseCsv(text.replace(/^\uFEFF/,''));
  if(!header?.length || !rows.length)throw new Error('Add a header row and at least one player.');
  if(header.length>150 || rows.length>5000)throw new Error('Use up to 150 columns and 5,000 players.');
  if(rows.some(row=>row.length!==header.length))throw new Error('A row has a different number of columns. Check commas and quoted values.');
  return {header,rows};
}
export function suggestMapping(header:string[]):ColumnMapping {
  const mapping:ColumnMapping={};
  for(const field of IMPORT_FIELDS) {
    const metric=METRIC_BY_KEY[field.key as MetricKey];
    const names=[field.key,field.label,...(aliases[field.key]??[]),...(metric?[metric.short,metric.label]:[])].map(normalize);
    const index=header.findIndex(h=>names.includes(normalize(h)));
    if(index>=0)mapping[field.key]={index,per90:!metric?.rate && /\/\s*90|per\s*90/i.test(header[index])};
  }
  return mapping;
}
function numberValue(raw:string|undefined,label:string,row:number):number|null {
  const value=raw?.trim();
  if(!value || ['—','-','na','n/a','null'].includes(value.toLowerCase()))return null;
  if(!/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?%?$/.test(value)||!/[0-9]/.test(value))throw new Error(`Row ${row}: ${label} must be a number or blank.`);
  const result=Number(value.replaceAll(',','').replace(/%$/,''));
  if(!Number.isFinite(result))throw new Error(`Row ${row}: ${label} is too large.`);
  return result;
}
export function importMappedTable(table:ReturnType<typeof readImportTable>,mapping:ColumnMapping,label:string):StatsDataset {
  if(!mapping.name||!mapping.minutes)throw new Error('Match a Player name column and a Minutes played column.');
  const used=Object.values(mapping).map(m=>m.index);
  if(used.some(i=>!Number.isInteger(i)||i<0||i>=table.header.length)||new Set(used).size!==used.length)throw new Error('Match each file column only once.');
  const metrics=METRICS.filter(m=>mapping[m.key]);
  if(!metrics.length)throw new Error('Match at least one statistic to continue.');
  const batch=crypto.randomUUID();
  const players=table.rows.map((row,i):PlayerStats=>{
    const field=(key:ImportField)=>mapping[key]?row[mapping[key]!.index]:undefined;
    const name=field('name')?.trim(),minutes=numberValue(field('minutes'),'Minutes played',i+2);
    if(!name||minutes===null||minutes<0)throw new Error(`Row ${i+2}: a name and non-negative minutes are required.`);
    const values=emptyMetrics(),coverage=emptyCoverage();
    for(const metric of metrics) {
      const source=mapping[metric.key]!,value=numberValue(row[source.index],metric.label,i+2);
      if(value!==null && ((!metric.signed&&value<0)||(metric.rate&&value>100)))throw new Error(`Row ${i+2}: ${metric.label} is out of range.`);
      if(value!==null && source.per90 && !metric.rate && minutes===0)throw new Error(`Row ${i+2}: per-90 stats need minutes greater than zero.`);
      values[metric.key]=value===null?null:source.per90&&!metric.rate?value*minutes/90:value;
      if(values[metric.key]!==null&&!Number.isFinite(values[metric.key]))throw new Error(`Row ${i+2}: ${metric.label} is too large.`);
      coverage[metric.key]=value===null?0:1;
    }
    const suppliedRole=field('role')?.trim().toUpperCase()??'';
    const roleMap:Record<string,PlayerRole>={GK:'GK',DEF:'DEF',DF:'DEF',MID:'MID',MF:'MID',FWD:'FWD',FW:'FWD'};
    return {id:`import-${batch}-${i}`,name:name.slice(0,120),club:field('club')?.trim().slice(0,120)||'My team',teamId:`import-${batch}`,role:roleMap[suppliedRole]??'Unknown',minutes,appearances:1,metrics:values,coverage,sampleLabel:field('sample')?.trim().slice(0,80)||label.trim().slice(0,80)||'My dataset'};
  });
  return {version:1,source:'CSV',label:label.trim().slice(0,80)||'My dataset',season:label.trim().slice(0,80)||'My dataset',updatedAt:new Date().toISOString(),matches:0,players};
}
export function manualPlayer(name:string,club:string,role:PlayerRole,minutes:string,values:Partial<Record<MetricKey,string>>,per90:boolean,label:string,id?:string) {
  const keys=METRICS.filter(m=>values[m.key]?.trim());
  if(!keys.length)throw new Error('Add at least one statistic. Leave unknown values blank.');
  if(!minutes.trim()||Number(minutes)<=0)throw new Error('Enter the minutes played in this sample.');
  const mapping:ColumnMapping={name:{index:0,per90:false},club:{index:1,per90:false},role:{index:2,per90:false},minutes:{index:3,per90:false}};
  keys.forEach((m,i)=>mapping[m.key]={index:i+4,per90});
  const table={header:['Player','Club','Role','Minutes',...keys.map(m=>m.key)],rows:[[name,club,role,minutes,...keys.map(m=>values[m.key]!)]]};
  const player=importMappedTable(table,mapping,label).players[0];
  return {...player,id:id??`personal-${crypto.randomUUID()}`,personal:true};
}
export function addComparisons(current:PlayerStats[],incoming:PlayerStats[]) {
  const combined=new Map(current.map(p=>[p.id,p]));
  incoming.forEach(p=>combined.set(p.id,{...p,personal:true}));
  if(combined.size>50)throw new Error('Compare up to 50 personal players. Use a separate dataset for a larger file.');
  return [...combined.values()];
}
export function benchmarkPercentile(player:PlayerStats,benchmark:PlayerStats[],key:MetricKey,per90:boolean) {
  const value=metricValue(player,key,per90),values=benchmark.filter(p=>!p.personal).map(p=>metricValue(p,key,per90)).filter((v):v is number=>v!==null);
  return value===null||!values.length?null:values.filter(v=>v<=value).length/values.length*100;
}
export function availableAxes(players:PlayerStats[],x:MetricKey,y:MetricKey):[MetricKey,MetricKey] {
  const available=METRICS.filter(m=>players.some(p=>p.metrics[m.key]!==null)).map(m=>m.key);
  if(available.length<2)return [x,y];
  const nextX=available.includes(x)?x:available[0];
  const nextY=available.includes(y)&&y!==nextX?y:available.find(key=>key!==nextX)!;
  return [nextX,nextY];
}
