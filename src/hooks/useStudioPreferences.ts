import { useSyncExternalStore } from 'react';
import { DEFAULT_PREFERENCES, PREFERENCE_KEY, sanitizePreferences, type StudioPreferences } from '../utils/studioPreferences';
function read(){try{return sanitizePreferences(JSON.parse(localStorage.getItem(PREFERENCE_KEY)??'null'));}catch{return {...DEFAULT_PREFERENCES};}}
let snapshot=read();
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(listener=>listener());
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===PREFERENCE_KEY){snapshot=read();emit();}});
export function useStudioPreferences(){
 const preferences=useSyncExternalStore(callback=>{listeners.add(callback);return ()=>listeners.delete(callback);},()=>snapshot,()=>DEFAULT_PREFERENCES);
 const update=(patch:Partial<StudioPreferences>)=>{snapshot=sanitizePreferences({...snapshot,...patch});try{localStorage.setItem(PREFERENCE_KEY,JSON.stringify(snapshot));}catch{}emit();};
 return {preferences,update,reset:()=>update(DEFAULT_PREFERENCES)};
}
