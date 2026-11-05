import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedPath, proxyPitchApi } from '../server/pitchapi-proxy.mjs';
import worker from '../server/pitchapi-proxy.mjs';
import { PitchApiClient } from '../src/utils/pitchApi';
const fakeKey='pk_test_this_is_an_invalid_test_fixture';
const request=(path='/v1/leagues',origin='https://zaidtacticsboard.com',key=fakeKey)=>new Request('https://relay.example/api/pitchapi',{method:'POST',headers:{Origin:origin,'X-PitchAPI-Key':key},body:JSON.stringify({path})});
test('relay restricts origins, keys and exact provider paths',async()=>{
 for(const path of ['https://evil.example','/v1/leagues/../account','/v1/matches/m_ABC123/players?key=x','/v1/leagues/l_ABC123/matches?season=2026%2F2027&url=evil'])assert.equal(allowedPath(path),false);
 assert.equal(allowedPath('/v1/leagues/l_ABC123/matches?season=2026%2F2027'),true);
 const noNetwork=()=>{throw new Error('must not call upstream');};
 assert.equal((await proxyPitchApi(request(undefined,'https://evil.example'),{},noNetwork)).status,403);
 assert.equal((await proxyPitchApi(request(undefined,undefined,'bad'),{},noNetwork)).status,401);
 assert.equal((await proxyPitchApi(request('/v1/accounts'),{},noNetwork)).status,400);
});
test('relay forwards credentials only to fixed PitchAPI host, prevents redirects and does not cache',async()=>{
 let target='',headers:any;
 const response=await proxyPitchApi(request(),{},async(url:string,options:any)=>{target=url;headers=options.headers;assert.equal(options.redirect,'error');return Response.json({data:{leagues:[]},ignored:'metadata'});});
 assert.equal(target,'https://api.pitchapi.dev/v1/leagues');assert.equal(headers['X-API-KEY'],fakeKey);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('access-control-allow-origin'),'https://zaidtacticsboard.com');assert.deepEqual(await response.json(),{data:{leagues:[]}});
});
test('relay sanitizes upstream errors and preserves recognized missing-data codes',async()=>{
 const response=await proxyPitchApi(request(),{},async()=>Response.json({error:{message:fakeKey,code:'ANALYTICS_UNAVAILABLE'}},{status:404}));
 const text=await response.text();assert.ok(!text.includes(fakeKey));assert.ok(text.includes('ANALYTICS_UNAVAILABLE'));
});
test('worker fetch accepts the Cloudflare execution context without treating it as a fetch function',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({data:{leagues:[]}}));
 const response=await worker.fetch(request(),{}, {waitUntil(){}});assert.equal(response.status,200);
});
test('client uses private request header, no credentials or persistent storage, caches and disconnects',async(t)=>{
 let calls=0;t.mock.method(globalThis,'fetch',async(_url,options:any)=>{calls++;assert.equal(options.headers['X-PitchAPI-Key'],fakeKey);assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.ok(!options.body.includes(fakeKey));return Response.json({data:{leagues:[{id:'l_ABC123',name:'Premier League',country_code:'ENG',seasons:['2026/2027']}]}});});
 const client=new PitchApiClient(fakeKey);assert.equal((await client.premierLeague()).id,'l_ABC123');await client.premierLeague();assert.equal(calls,1);assert.ok(!JSON.stringify(client).includes(fakeKey));client.disconnect();await assert.rejects(client.premierLeague(),/Connect/);
});
test('client distinguishes missing advanced analytics from account, network and rate-limit failures',async(t)=>{
 const fixture={id:'m_ABC123',date:'2026-01-01',status:'finished',home_team:{id:'t_home',name:'Home'},away_team:{id:'t_away',name:'Away'}};
 let unavailable=true;
 t.mock.method(globalThis,'fetch',async(_url,options:any)=>{
  const {path}=JSON.parse(options.body);
  if(path.includes('/leagues/'))return Response.json({data:{matches:[fixture,{...fixture}, {...fixture,id:'m_DEF456',status:'scheduled'}]}});
  if(path.endsWith('/advanced/players'))return Response.json({error:{code:unavailable?'ANALYTICS_UNAVAILABLE':'RATE_LIMIT_EXCEEDED',message:'Unavailable'}},{status:unavailable?404:429});
  if(path.endsWith('/lineups'))return Response.json({data:{}});
  return Response.json({data:[{player:{id:'p_one',name:'One'},team_id:'t_home',stats:[{stats:{m:{key:'minutes_played',stat:{value:90}},x:{key:'expected_goals',stat:{value:0}}}}]}]});
 });
 const league={id:'l_ABC123',name:'Premier League',country_code:'ENG',seasons:['2026/2027']};
 const result=await new PitchApiClient(fakeKey).importSeason(league,'2026/2027',0,()=>{},new AbortController().signal);
 assert.equal(result.matches,1);assert.equal(result.players[0].metrics.xg,0);assert.equal(result.players[0].metrics.progressivePasses,null);
 unavailable=false;await assert.rejects(new PitchApiClient(fakeKey).importSeason(league,'2026/2027',0,()=>{},new AbortController().signal),/Unavailable/);
});
