import test from 'node:test';
import assert from 'node:assert/strict';
import { addComparisons, benchmarkPercentile, importMappedTable, manualPlayer, readImportTable, suggestMapping } from '../src/utils/personalStats';
import { metricValue } from '../src/utils/statsMetrics';
import { exportCsv,parseCsv } from '../src/utils/statsData';
import { DEFAULT_PREFERENCES,sanitizePreferences,sanitizeViews } from '../src/utils/studioPreferences';
const csv='Name,Squad,Pos,Min,PrgP,xG per 90,Pass completion %,Sample\nMy Player,Local FC,MF,900,60,0.2,85,My season';
test('maps common spreadsheet names and mixed units without scaling percentages',()=>{
 const table=readImportTable(csv),mapping=suggestMapping(table.header),p=importMappedTable(table,mapping,'Mine').players[0];
 assert.equal(p.name,'My Player');assert.equal(p.role,'MID');assert.equal(p.metrics.progressivePasses,60);assert.equal(p.metrics.xg,2);assert.equal(p.metrics.passAccuracy,85);assert.equal(p.sampleLabel,'My season');assert.equal(metricValue(p,'xg',true),.2);assert.equal(p.metrics.xgot,null);
});
test('unknown headers can be explicitly matched and zero values remain zero',()=>{
 const t=readImportTable('Athlete,Time,Chance quality\nMe,90,0');const p=importMappedTable(t,{name:{index:0,per90:false},minutes:{index:1,per90:false},xg:{index:2,per90:false}},'Mine').players[0];assert.equal(p.metrics.xg,0);
});
test('input validation prevents bad units, ambiguous mappings, invalid data and malformed tables',()=>{
 assert.throws(()=>readImportTable('Player,Minutes,xG\nMe,90,1,extra'),/columns/);
 assert.throws(()=>readImportTable('Player,Minutes\n"Unclosed,90'),/quote/);
 for(const raw of ['Player,Minutes,xG per 90\nMe,0,2','Player,Minutes,xG\nMe,90,-1','Player,Minutes,Pass completion %\nMe,90,101','Player,Minutes,xG\nMe,90,Infinity','Player,Minutes,xG\nMe,90,1,2']){
  assert.throws(()=>{const t=readImportTable(raw);importMappedTable(t,suggestMapping(t.header),'Mine');});
 }
 const t=readImportTable(csv),mapping=suggestMapping(t.header);mapping.xa=mapping.xg;assert.throws(()=>importMappedTable(t,mapping,'Mine'),/once/);
 assert.throws(()=>importMappedTable(t,{},'Mine'),/Player name/);
});
test('manual per-90 profiles become normalized totals and can be edited without adding duplicates',()=>{
 const original=manualPlayer('Me','Local','MID','180',{goals:'1',passAccuracy:'80',xg:'0'},true,'Two matches');
 assert.equal(original.metrics.goals,2);assert.equal(original.metrics.passAccuracy,80);assert.equal(original.metrics.xg,0);assert.equal(original.personal,true);
 const changed=manualPlayer('Me','Local','MID','270',{goals:'3'},false,'Three matches',original.id);
 const combined=addComparisons([original],[changed]);assert.equal(combined.length,1);assert.equal(combined[0].minutes,270);assert.equal(combined[0].id,original.id);
 assert.throws(()=>manualPlayer('Me','Local','MID','0',{goals:'0'},false,'Sample'),/minutes/);
 assert.throws(()=>manualPlayer('Me','Local','MID','90',{},false,'Sample'),/statistic/);
});
test('comparison players cannot overwrite a professional ID or inflate benchmark percentiles',()=>{
 const t=readImportTable('Player,Minutes,goals\nProfessional A,90,1\nProfessional B,90,3');const benchmark=importMappedTable(t,suggestMapping(t.header),'League').players;
 const personal=manualPlayer('Me','Local','FWD','90',{goals:'2'},false,'My match');
 assert.equal(benchmarkPercentile(personal,[...benchmark,personal],'goals',false),50);assert.equal(benchmarkPercentile(personal,[personal],'goals',true),null);
 const otherBatch=importMappedTable(t,suggestMapping(t.header),'League');assert.notEqual(benchmark[0].id,otherBatch.players[0].id);
 assert.throws(()=>addComparisons([],Array.from({length:51},(_,i)=>({...personal,id:`personal-${i}`}))),/50/);
});
test('personal CSV round trip retains sample, missing fields, precision and safe provenance',()=>{
 const p=manualPlayer('=My Player','My Club','MID','900',{progressivePasses:'65',xg:'2.5',xT:'-0.12'},false,'2026 · Local season');
 const text=exportCsv([p],['progressivePasses','xg','xT'],false,{baseSource:'PitchAPI',baseSample:'2026'});const parsed=parseCsv(text);assert.equal(parsed[1].at(-2),'Personal');assert.equal(parsed[1].at(-1),'2026 · Local season');assert.ok(parsed[1][0].startsWith("'="));
 const table=readImportTable(text),restored=importMappedTable(table,suggestMapping(table.header),'Restored').players[0];assert.equal(restored.metrics.xg,2.5);assert.equal(restored.metrics.xT,-.12);assert.equal(restored.sampleLabel,p.sampleLabel);assert.equal(restored.personal,undefined);
});
test('appearance preferences discard unexpected data and clamp malformed values',()=>{
 assert.deepEqual(sanitizePreferences(null),DEFAULT_PREFERENCES);
 const p=sanitizePreferences({accent:'__proto__',pointSize:900,chartHeight:NaN,grid:false,apiKey:'sensitive',players:[{name:'personal'}]});assert.equal(p.accent,'forest');assert.equal(p.pointSize,8);assert.equal(p.chartHeight,420);assert.equal(p.grid,false);assert.ok(!JSON.stringify(p).includes('sensitive'));assert.ok(!JSON.stringify(p).includes('players'));
});
test('saved views keep settings only, validate metric IDs and bound list sizes',()=>{
 const v={id:'one',name:'My view',xKey:'xg',yKey:'goals',minimum:-20,columns:['xg','invalid','xg'],key:'sensitive',players:[{}]};
 const views=sanitizeViews([v,{...v,xKey:'invalid'}]);assert.equal(views.length,1);assert.equal(views[0].minimum,0);assert.deepEqual(views[0].columns,['xg']);assert.ok(!JSON.stringify(views).includes('sensitive'));assert.equal(sanitizeViews(Array(20).fill(v)).length,8);
});
test('new datasets and personal profiles choose axes with available statistics',async()=>{
 const {availableAxes}=await import('../src/utils/personalStats');
 const p=manualPlayer('Me','Local','MID','90',{xg:'.2',goals:'1'},false,'My match');
 assert.deepEqual(availableAxes([p],'progressivePasses','xa'),['xg','goals']);
 assert.deepEqual(availableAxes([p],'goals','xg'),['goals','xg']);
 assert.deepEqual(availableAxes([p],'xg','xg'),['xg','goals']);
});
