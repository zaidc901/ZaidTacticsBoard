import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregatePlayers, matchPlayers, importCsv, exportCsv, parseCsv } from '../src/utils/statsData';
import { metricValue, sortPlayers, niceDomain, correlation } from '../src/utils/statsMetrics';
import type { PitchMatch } from '../src/types/stats';
const match = {id:'m_ABC123',date:'2026-10-01',status:'finished',home_team:{id:'t_home',name:'Home'},away_team:{id:'t_away',name:'Away'}} as PitchMatch;
function basic(minutes=90,made=9,total=10) {return [{player:{id:'p_one',name:'Player One'},team_id:'t_home',stats:[{stats:{Minutes:{key:'minutes_played',stat:{type:'integer',value:minutes}},Goals:{key:'goals',stat:{value:0}},xg:{key:'expected_goals',stat:{value:.5}},xa:{key:'expected_assists',stat:{value:.2}},xgot:{key:'expected_goals_on_target_variant',stat:{value:null}},passes:{key:'accurate_passes',stat:{type:'fractionWithPercentage',value:made,total}},boolean:{key:'is_goalkeeper',stat:{type:'boolean',value:true}}}}]}];}
const advanced={players:[{player:{id:'p_one'},passing:{progressive_passes:4},carrying:{progressive_carries:2},creation:{sca:5},possession_value:{xt_total:-.1}}]};
const lineups={home:{confirmed:true,starters:[{player_id:'p_one',pitch_x:.49,position_id:64}],subs:[]}};
const appearance=(minutes=90,made=9,total=10)=>matchPlayers(match,basic(minutes,made,total),advanced,lineups)[0];
test('normalizes provider inner keys, lineup roles and missing values without inventing zeros',()=>{
 const p=appearance();assert.equal(p.role,'MID');assert.equal(p.metrics.xg,.5);assert.equal(p.metrics.goals,0);assert.equal(p.metrics.xgot,null);assert.equal(p.metrics.progressivePasses,4);assert.equal(p.metrics.xT,-.1);assert.equal(p.metrics.passAccuracy,90);
 assert.equal(matchPlayers(match,basic(0),advanced,lineups).length,0);
 assert.throws(()=>matchPlayers(match,{},null,lineups),/format/);
});
test('combines sample totals and weights pass completion by attempts, never by match average',()=>{
 const p=aggregatePlayers([[appearance(90,9,10)],[appearance(45,50,100)]])[0];
 assert.equal(p.minutes,135);assert.equal(p.appearances,2);assert.equal(p.metrics.progressivePasses,8);assert.equal(p.metrics.xg,1);assert.equal(p.metrics.passAccuracy,59/110*100);
 assert.equal(metricValue(p,'xg',true),2/3);assert.equal(metricValue(p,'passAccuracy',true),p.metrics.passAccuracy);
});
test('incomplete metrics stay missing across full sample, while actual zero survives',()=>{
 const second=appearance();second.metrics.progressivePasses=null;
 const p=aggregatePlayers([[appearance()],[second]])[0];assert.equal(p.metrics.progressivePasses,null);assert.equal(p.coverage.progressivePasses,1);assert.equal(p.metrics.goals,0);assert.equal(p.metrics.xgot,null);
});
test('deduplicates appearances and combines a transferred player with minutes-weighted lineup role',()=>{
 const second=appearance(30);second.club='Other';second.role='FWD';
 const p=aggregatePlayers([[appearance(),appearance()],[second]])[0];assert.equal(p.appearances,2);assert.equal(p.minutes,120);assert.equal(p.club,'Home / Other');assert.equal(p.role,'MID');
});
test('CSV supports quoted names, missing metrics, BOM, raw totals and percentages',()=>{
 const dataset=importCsv('\uFEFFPlayer,Club,Role,Minutes,xg,passAccuracy\r\n"One, Player","United\nCity",MID,180,2.5,80%\nTwo,Other,DEF,90,,0');
 assert.equal(dataset.players[0].name,'One, Player');assert.equal(dataset.players[0].club,'United\nCity');assert.equal(metricValue(dataset.players[0],'xg',true),1.25);assert.equal(dataset.players[1].metrics.xg,null);assert.equal(dataset.players[1].metrics.passAccuracy,0);
});
test('CSV rejects per-90 input, invalid values, unmatched quotes, duplicates and out-of-range percentages',()=>{
 for(const csv of ['Player,Minutes,xG / 90\nOne,90,1','Player,Minutes,xg\nOne,NaN,1','Player,Minutes,xg\nOne,90,Infinity','Player,Minutes,xg\nOne,90,-1','Player,Minutes,passAccuracy\nOne,90,101','Player,Minutes,xg,xg\nOne,90,1,1','Player,Minutes,xg\n"One,90,1'])assert.throws(()=>importCsv(csv));
});
test('CSV exports displayed units, leaves missing cells empty and neutralizes spreadsheet formulas',()=>{
 const data=importCsv('Player,Club,Minutes,xg,xT\n=SUM(A1),Test,180,2,-0.1\nTwo,Test,90,,');
 const csv=exportCsv(data.players,['xg','xT'],true),rows=parseCsv(csv);
 assert.equal(rows[0][4],'xG / 90');assert.ok(rows[1][0].startsWith("'="));assert.equal(rows[1][4],'1');assert.equal(rows[1][5],'-0.05');assert.equal(rows[2][4],'');
});
test('plot helpers handle signed, equal, empty and zero-minute data; missing sorts last both ways',()=>{
 assert.deepEqual(niceDomain([]),[0,1]);assert.deepEqual(niceDomain([0,0]),[0,1]);const [min,max]=niceDomain([-2,1]);assert.ok(min< -2&&max>1);assert.equal(correlation([{x:1,y:2},{x:1,y:3},{x:1,y:4}]),null);assert.equal(correlation([{x:1,y:2},{x:2,y:4},{x:3,y:6}]),1);
 const rows=importCsv('Player,Minutes,xg\nA,0,1\nB,90,\nC,90,2').players;assert.equal(metricValue(rows[0],'xg',true),null);
 for(const ascending of [true,false])assert.equal(sortPlayers(rows,'xg',ascending,false).at(-1)?.name,'B');
});
test('complete shot records distinguish genuine zero shooting from unavailable or incomplete feeds',()=>{
 const feed=(shots:any[])=>({match_id:match.id,periods:[{period:'FirstHalf',shots},{period:'SecondHalf',shots:[]}]});
 const noShooting=basic();noShooting[0].stats[0].stats.xg.stat.value=null as any;
 const empty=matchPlayers(match,noShooting,advanced,lineups,feed([]))[0];assert.equal(empty.metrics.xg,0);assert.equal(empty.metrics.xgot,0);assert.equal(empty.metrics.shots,0);
 const missing=matchPlayers(match,noShooting,advanced,lineups,{match_id:match.id,periods:[{period:'FirstHalf',shots:[]} ]})[0];assert.equal(missing.metrics.xg,null);assert.equal(missing.metrics.xgot,null);
 const shot={id:'s_one',player:{id:'p_one'},team_id:'t_home',expected_goals:.4,is_on_target:true,situation:'RegularPlay'};
 assert.equal(matchPlayers(match,noShooting,advanced,lineups,feed([shot]))[0].metrics.xgot,null);
 const saved=matchPlayers(match,noShooting,advanced,lineups,feed([{...shot,expected_goals_on_target:.7}]))[0];assert.equal(saved.metrics.xg,.4);assert.equal(saved.metrics.xgot,.7);
 const blocked=matchPlayers(match,noShooting,advanced,lineups,feed([{...shot,is_blocked:true}]))[0];assert.equal(blocked.metrics.xgot,0);assert.equal(blocked.metrics.shotsOnTarget,0);
});
