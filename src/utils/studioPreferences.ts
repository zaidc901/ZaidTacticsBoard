import type { MetricKey } from '../types/stats';
import { METRIC_BY_KEY } from './statsMetrics';
export type StudioPreferences={accent:'forest'|'ocean'|'violet'|'rose'|'amber';density:'comfortable'|'compact';corners:'soft'|'crisp';motion:'full'|'reduced';pointSize:number;chartHeight:number;colorMode:'role'|'accent';grid:boolean};
export const DEFAULT_PREFERENCES:StudioPreferences={accent:'forest',density:'comfortable',corners:'soft',motion:'full',pointSize:4.5,chartHeight:420,colorMode:'role',grid:true};
export const ACCENTS={forest:{name:'Forest',light:'#267466',dark:'#92c9ba'},ocean:{name:'Ocean',light:'#336da0',dark:'#91bde5'},violet:{name:'Violet',light:'#7561aa',dark:'#bfb0ec'},rose:{name:'Rose',light:'#a25272',dark:'#e0a5bd'},amber:{name:'Amber',light:'#956620',dark:'#dbbb7e'}};
export const PREFERENCE_KEY='ztb.studio.appearance.v1';
export function sanitizePreferences(raw:unknown):StudioPreferences {
  const p=(raw&&typeof raw==='object'?raw:{}) as Partial<StudioPreferences>;
  return {accent:p.accent&&Object.hasOwn(ACCENTS,p.accent)?p.accent:'forest',density:p.density==='compact'?'compact':'comfortable',corners:p.corners==='crisp'?'crisp':'soft',motion:p.motion==='reduced'?'reduced':'full',pointSize:typeof p.pointSize==='number'&&Number.isFinite(p.pointSize)?Math.max(3,Math.min(8,p.pointSize)):4.5,chartHeight:typeof p.chartHeight==='number'&&Number.isFinite(p.chartHeight)?Math.max(360,Math.min(600,p.chartHeight)):420,colorMode:p.colorMode==='accent'?'accent':'role',grid:typeof p.grid==='boolean'?p.grid:true};
}
export type SavedStatsView={id:string;name:string;xKey:MetricKey;yKey:MetricKey;per90:boolean;minimum:number;role:string;club:string;averages:boolean;labels:boolean;columns:MetricKey[]};
export const VIEWS_KEY='ztb.stats.views.v1';
export function sanitizeViews(raw:unknown):SavedStatsView[] {
  if(!Array.isArray(raw))return [];
  return raw.filter(v=>v&&typeof v.id==='string'&&typeof v.name==='string'&&Object.hasOwn(METRIC_BY_KEY,v.xKey)&&Object.hasOwn(METRIC_BY_KEY,v.yKey)).slice(0,8).map(v=>({id:v.id.slice(0,80),name:v.name.slice(0,40),xKey:v.xKey,yKey:v.yKey,per90:v.per90!==false,minimum:typeof v.minimum==='number'&&Number.isFinite(v.minimum)?Math.max(0,Math.min(10000,v.minimum)):0,role:['GK','DEF','MID','FWD','Unknown'].includes(v.role)?v.role:'all',club:typeof v.club==='string'?v.club.slice(0,120):'all',averages:v.averages!==false,labels:v.labels!==false,columns:Array.isArray(v.columns)?[...new Set(v.columns.filter((k:string)=>Object.hasOwn(METRIC_BY_KEY,k)))].slice(0,18) as MetricKey[]:[]}));
}
