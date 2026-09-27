const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const dayKey = () => new Date().toISOString().slice(0,10);
const dailyNumber = () => Math.max(1,Math.floor((Date.now()-Date.parse('2026-09-23T00:00:00Z'))/86400000)+1);
const STORAGE = 'stretford-gauntlet-v1';
const saved = (()=>{try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return {}}})();
const records = saved.records||[];
const earned = new Set(saved.earned||[]);
let checkpoint = saved.checkpoint||null;
let G = null;
let rng = Math.random;
let matchTimer = null;

function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({records:records.slice(0,12),earned:[...earned],checkpoint,eras:saved.eras,formation:saved.formation,dailyAttempt:saved.dailyAttempt}))}catch{}}
function save(){if(!G)return;checkpoint=JSON.parse(JSON.stringify(G));persist()}
function clearRun(){checkpoint=null;G=null;persist()}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));if(G){G.phase=id;save()}window.scrollTo(0,0)}
function player(id){return PLAYERS.find(p=>p.id===id)}
function manager(name){return MANAGERS.find(m=>m.name===name)}
function selectedPlayers(){return G.team.filter(Boolean).map(player).filter(Boolean)}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function weightedShuffle(a){return a.map(p=>({p,key:Math.pow(rng(),1/(p.rating>=92?.48:p.rating>=88?.70:p.rating>=84?.85:1))})).sort((x,y)=>y.key-x.key).map(x=>x.p)}
function seedRandom(seed){let n=0;for(const c of seed)n=(n*31+c.charCodeAt(0))>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const RELATED = {GK:[],RB:['CB','RM','RW'],LB:['CB','LM','LW'],CB:['RB','LB','DM'],DM:['CM','CB'],CM:['DM','AM','RM','LM'],AM:['CM','ST','RW','LW'],RM:['RW','CM','RB'],LM:['LW','CM','LB'],RW:['RM','AM','ST'],LW:['LM','AM','ST'],ST:['AM','RW','LW']};
const DEPTH = {GK:-1,CB:0,RB:.5,LB:.5,DM:1,CM:1.5,RM:1.5,LM:1.5,AM:2,RW:2.5,LW:2.5,ST:3};
const HERO_BONUS = {'Duncan Edwards':4,'Bobby Charlton':3,'George Best':4,'Denis Law':4,'Eric Cantona':4,'Bryan Robson':4,'Cristiano Ronaldo':4,'Ruud van Nistelrooy':4,'Wayne Rooney':3,'Peter Schmeichel':4,'Paul Scholes':3,'Bruno Fernandes':3,'David Beckham':2,'Denis Irwin':2,'Robin van Persie':2,'Ji-sung Park':2,'Antonio Valencia':2,'Alejandro Garnacho':1};
function fit(p,pos){if(p.pos.includes(pos))return 0;if(pos==='GK'||p.pos.includes('GK'))return 50;let best=30;for(const natural of p.pos){const depth=Math.abs(DEPTH[natural]-DEPTH[pos]);if(RELATED[natural]?.includes(pos)||RELATED[pos]?.includes(natural))best=Math.min(best,depth<=.5?3:8);else if(depth<=1.5)best=Math.min(best,18)}return best}
function playedUnder(p,m){return !!(m&&p.from<=m.to&&p.to>=m.from)}
function sameManager(p){return playedUnder(p,manager(G.manager))}
function duo(p){return DUOS.find(d=>d.players.includes(p.name))}
function paired(a,b){return DUOS.find(d=>d.players.includes(a.name)&&d.players.includes(b.name))}
function hero(p){return HEROES[p.name]}
function cursed(p){return CURSED[p.name]}
function managerBonus(p,pos,m){if(!m)return 0;return (m.boost?.[pos]||0)+(m.penalty?.[pos]||0)+(m.era?(p.era===m.era?m.eraBonus:m.otherPenalty):0)}
function chemistryLink(a,b,cohesion=0){if(!a||!b)return 0;const seasons=Math.max(0,Math.min(a.to,b.to)-Math.max(a.from,b.from)+1);if(!seasons)return 0;const games=seasons*Math.min(a.apps/(a.to-a.from+1),b.apps/(b.to-b.from+1));const penalty=(CURSE_EFFECTS[a.name]?.link||0)+(CURSE_EFFECTS[b.name]?.link||0);return clamp(Math.round(games/1.2)+(paired(a,b)?.link||0)+cohesion+penalty,0,100)}
function runLink(a,b,perks=[]){const active=RUN_PERKS.filter(perk=>perks.includes(perk.id));const boost=active.reduce((n,perk)=>n+(perk.link||0)+(a&&b&&paired(a,b)?(perk.duoLink||0):0),0);return chemistryLink(a,b,boost)}
function pitchEdges(formation){return FORMATION_LINKS[formation]||[]}
function evaluateTeam(team,formation,managerName,perks=[]){
  const slots=FORMATIONS[formation],edges=pitchEdges(formation),per=Array(11).fill(null),neighbor=Array.from({length:11},()=>[]),m=manager(managerName);
  const active=RUN_PERKS.filter(perk=>perks.includes(perk.id));
  const fitRelief=active.reduce((n,perk)=>n+(perk.fitRelief||0),0);
  for(const [i,j] of edges){const c=runLink(player(team[i]),player(team[j]),perks);neighbor[i].push(c);neighbor[j].push(c)}
  let disruption=0;
  for(let i=0;i<11;i++){const p=player(team[i]);if(!p)continue;const penalty=Math.max(0,fit(p,slots[i][0])-fitRelief);disruption+=penalty>=45?4:penalty>=25?3:penalty>=14?2:penalty>=6?1:penalty>0?.5:0}
  const shape=disruption<=1?0:2*Math.pow(disruption-1,1.35);
  let total=0,neutralTotal=0,cardTotal=0,chemTotal=0,count=0;
  for(let i=0;i<11;i++){
    const p=player(team[i]);if(!p)continue;
    const pos=slots[i][0],penalty=Math.max(0,fit(p,pos)-fitRelief),managed=playedUnder(p,m);
    let chem=neighbor[i].length?Math.round(neighbor[i].reduce((a,b)=>a+b,0)/neighbor[i].length):0;
    if(managed)chem+=12;
    if(m?.chem)chem+=m.chem;
    for(const perk of active)chem+=(perk.chem||0)+(managed?(perk.managedChem||0):0);
    chem=clamp(chem,0,100);
    let bonus=managerBonus(p,pos,m)+(managed?(m?.tier===3?2:1):0)+(CURSE_EFFECTS[p.name]?.rating||0);
    for(const perk of active)if(!perk.positions||perk.positions.includes(pos))if(!perk.heroes||!!hero(p))bonus+=perk.boost||0;
    if(penalty===0)bonus+=HERO_BONUS[p.name]||0;
    if(penalty===0){let combo=0;for(const [a,b] of edges){const j=a===i?b:b===i?a:-1,q=j<0?null:player(team[j]);if(q&&fit(q,slots[j][0])===0)combo=Math.max(combo,paired(p,q)?.bonus||0)}bonus+=combo}
    const withoutChem=clamp(p.rating-penalty+bonus-shape,20,94);
    const value=clamp((p.rating-penalty)*(.93+.12*chem/100)+bonus-shape,20,94);
    per[i]={value:+value.toFixed(1),chem,penalty,base:p.rating,bonus,chemImpact:+(value-withoutChem).toFixed(1)};
    total+=value;neutralTotal+=withoutChem;cardTotal+=p.rating;chemTotal+=chem;count++
  }
  const rating=count?+(total/count).toFixed(1):0,neutralRating=count?+(neutralTotal/count).toFixed(1):0;
  return {rating,neutralRating,chemImpact:+(rating-neutralRating).toFixed(1),cardAverage:count?+(cardTotal/count).toFixed(1):0,chem:count?Math.round(chemTotal/count):0,count,per,edges,shape:+shape.toFixed(1)}
}
function evaluate(){return evaluateTeam(G.team,G.formation,G.manager,G.perks||[])}
function ratingBreakdown(ev,hidden){if(hidden)return 'Rating breakdown hidden in hardcore mode.';if(!ev.count)return 'Fill the XI to build chemistry.';const delta=ev.chemImpact;return `Before chemistry <b>${ev.neutralRating}</b><span class="${delta>=0?'gain':'loss'}">Links ${delta>=0?'+':''}${delta.toFixed(1)}</span>`}

const shirt = (isGK=false,isManager=false) => `<svg class="figure" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="23" rx="15" ry="18" fill="#bc8a68"/><path d="M37 38 Q50 45 63 38 L76 46 96 63 82 74 73 66 72 103 28 103 27 66 18 74 4 63 24 46Z" fill="${isManager?'#29231e':isGK?'#242d38':'#da291c'}" stroke="#fff" stroke-width="2"/><path d="M37 38 Q50 55 63 38" fill="none" stroke="${isGK?'#c5d0c6':'#fff'}" stroke-width="3"/><path d="M24 46 8 64 M76 46 92 64" stroke="#fff" stroke-width="4" opacity=".8"/><circle cx="58" cy="60" r="4" fill="#f6d26b"/></svg>`;
function sticker(p,{picked=false,mini=false,managed=false,live=null}={}){if(!p)return '';const tier=p.rating>=92?'gold':p.rating>=84?'silver':'bronze',h=hero(p),d=duo(p),c=cursed(p),chem=live?.chem,shown=live?Math.round(live.value):p.rating,ratingLabel=live?'Effective rating':'United career rating';return `<div class="sticker ${tier}${h?' hero':''}${c?' cursed':''}${picked?' picked':''}" ${mini?'':`role="button" tabindex="0" aria-label="${esc(p.name)}, ${esc(p.pos.join(' or '))}${G?.hardcore?'':`, ${ratingLabel.toLowerCase()} ${shown}${live?`, chemistry ${chem}`:''}`}"`}><div class="art">${shirt(p.pos[0]==='GK')}<span class="ps">${esc(p.pos.slice(0,2).join('·'))}</span>${G?.hardcore?'':`<span class="rt" title="${ratingLabel}">${shown}</span>`}${managed?'<span class="badge" title="Played under your manager">M</span>':''}</div><div class="nm">${esc(p.name)}</div>${live?`<div class="card-foot"><span>${G?.hardcore?'RATING HIDDEN':`BASE ${p.rating}`}</span>${G?.hardcore?'':`<strong class="card-chem" title="Chemistry">CHEM ${chem}</strong>`}</div>`:''}${mini?'':`<div class="er ${c?'cursed':h?'hero':d?'duo':''}">${esc(c||h||d?.name||p.era)}</div>`}</div>`}
function managerSticker(m,picked){const initials=m.name.replace(/^Sir /,'').split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase();return `<div class="sticker manager tier-${m.tier}${picked?' picked':''}" role="button" tabindex="0" aria-label="${esc(m.name)}"><div class="art"><span class="manager-id">MANAGER / ${m.from}–${m.to}</span><strong class="manager-symbol">${initials}</strong></div><div class="nm">${esc(m.name)}</div><div class="er">${esc(m.perk)}</div></div>`}
function bindCards(parent,cb){parent.querySelectorAll('.sticker').forEach((e,i)=>{e.onclick=()=>cb(i);e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();cb(i)}}})}
function oppList(){return OPPONENTS.map((o,i)=>`<div><b>${i+1}</b><span><b>${esc(o.name)}</b> <span class="t">— ${esc(o.match)} · ${esc(o.trait)}</span></span></div>`).join('')}
function updateEraNote(eras){const count=PLAYERS.filter(p=>eras.includes(p.era)).length;$('eranote').textContent=`${count} eligible player${count===1?'':'s'} from ${eras.length} selected era${eras.length===1?'':'s'}.`}
function renderSetup(){const eras=G?.phase==='s-setup'?G.eras:(saved.eras||['1980s','1990s','2000s','2010s','2020s']);const form=G?.phase==='s-setup'?G.formation:(saved.formation||'4-3-3');$('eras').innerHTML=ERAS.map(e=>`<button class="chip ${eras.includes(e)?'on':''}" data-era="${e}" aria-pressed="${eras.includes(e)}">${e}<small>${PLAYERS.filter(p=>p.era===e).length}</small></button>`).join('');$('formations').innerHTML=Object.keys(FORMATIONS).map(f=>`<button class="fbtn ${form===f?'on':''}" data-f="${f}" aria-pressed="${form===f}">${f}</button>`).join('');updateEraNote(eras);$('opplist').innerHTML=oppList();$('opplist2').innerHTML=oppList();$('dailynote').textContent=`Daily #${dailyNumber()}: everyone gets the same spins, all eras, one attempt.`;$('daily').disabled=saved.dailyAttempt===dayKey()||records.some(r=>r.daily===dayKey());$('daily').title=$('daily').disabled?'Today’s challenge has already been played':'';
  $('stats').innerHTML=`<div><b>${records.length}</b>runs</div><div><b>${records.filter(r=>r.wins===10).length}</b>gauntlets completed</div><div><b>${dailyStreak()}</b>day daily streak</div>`;$('hist').innerHTML=records.length?records.slice(0,5).map(r=>`<div><span>${r.daily?'Daily · ':''}${esc(r.formation)} · ${r.wins}/10 won</span><b>${esc(r.date)}</b></div>`).join(''):'<div><span>No runs yet.</span></div>';$('ach').innerHTML=ACHIEVEMENTS.map(([id,name,desc])=>`<div class="${earned.has(id)?'earned':''}"><b>${earned.has(id)?'🏆':'🔒'} ${esc(name)}</b>${esc(desc)}</div>`).join('');$('resume').classList.toggle('on',!!checkpoint&&checkpoint.phase!=='s-setup');if(checkpoint)$('resume-desc').textContent=checkpoint.phase==='s-draft'?`Spin ${checkpoint.spin} of 14 · ${checkpoint.team.filter(Boolean).length}/11 players`:checkpoint.phase==='s-gauntlet'?`Round ${checkpoint.level+1} of 10`:'Continue where you left off.'}
function dailyStreak(){let dates=[...new Set(records.map(r=>r.daily).filter(Boolean))].sort().reverse(),n=0,check=new Date(dayKey()+'T00:00:00Z');if(dates[0]!==dayKey())check.setUTCDate(check.getUTCDate()-1);for(const d of dates){if(d===check.toISOString().slice(0,10)){n++;check.setUTCDate(check.getUTCDate()-1)}else break}return n}
function currentSetup(){return {eras:[...$('eras').querySelectorAll('.on')].map(x=>x.dataset.era),formation:$('formations').querySelector('.on')?.dataset.f||'4-3-3',hardcore:$('hardcore').classList.contains('on')}}
function start(daily=false){const setup=currentSetup();if(!daily&&!setup.eras.length)return;const d=daily?dayKey():null;if(daily&&(saved.dailyAttempt===d||records.some(r=>r.daily===d)))return;rng=daily?seedRandom('stretford-'+d):Math.random;G={phase:'s-manager',eras:daily?[...ERAS]:setup.eras,formation:daily?Object.keys(FORMATIONS)[dailyNumber()%7]:setup.formation,hardcore:setup.hardcore,daily:d,manager:null,managerOffers:[],managerPick:null,team:Array(11).fill(null),spin:0,skips:0,seen:[],offers:[],picked:null,wildOffers:[],wildPick:null,wildUsed:false,level:0,results:[],perks:[],perkOffers:[],reshapeUsed:false};saved.eras=G.eras;saved.formation=G.formation;if(daily)saved.dailyAttempt=d;offerManagers()}
function offerManagers(){G.managerOffers=shuffle([...MANAGERS]).slice(0,3).map(m=>m.name);renderManager();show('s-manager')}
function renderManager(){$('mgr-offers').innerHTML=G.managerOffers.map(n=>managerSticker(manager(n),G.managerPick===n)).join('');$('mgr-perks').innerHTML=G.managerOffers.map(n=>{let m=manager(n);return `<div><b>${esc(m.name)}</b> <span>${m.from}–${m.to}</span><br><span class="pk">${esc(m.perk)}</span> — ${esc(m.desc)}</div>`}).join('');$('mgr-go').disabled=!G.managerPick;$('mgr-note').textContent=G.managerPick?`${G.managerPick}: ${PLAYERS.filter(p=>G.eras.includes(p.era)&&p.from<=manager(G.managerPick).to&&p.to>=manager(G.managerPick).from).length} players in your pool played under him. Look for the M badge on cards.`:'';bindCards($('mgr-offers'),i=>{G.managerPick=G.managerOffers[i];renderManager();save()})}
function nextSpin(){G.spin++;G.picked=null;G.slotPick=null;G.confirmSlot=null;G.finishArmed=false;$('finish').textContent='Done — to the wildcard';if(G.spin>14){startWild();return}if(G.daily)rng=seedRandom('stretford-'+G.daily+'-spin-'+G.spin);const pool=PLAYERS.filter(p=>G.eras.includes(p.era)&&!selectedPlayers().some(x=>x.name===p.name)&&!G.seen.includes(p.id));let avail=pool.length>=3?pool:PLAYERS.filter(p=>G.eras.includes(p.era)&&!selectedPlayers().some(x=>x.name===p.name));if(avail.length<3){startWild();return}avail=weightedShuffle(avail);const empty=FORMATIONS[G.formation].filter((_,i)=>!G.team[i]).map(s=>s[0]);const fitOne=avail.find(p=>empty.some(pos=>fit(p,pos)===0));const offer=fitOne?[fitOne]:[];for(const p of avail){if(offer.length===3)break;if(!offer.includes(p))offer.push(p)}G.offers=shuffle(offer).map(p=>p.id);G.seen.push(...G.offers);renderDraft();show('s-draft')}
function renderPitch(container,clickable=true){
  const slots=FORMATIONS[G.formation],ev=evaluate(),choice=container.id==='wild-pitch'?G.wildPick:G.picked;
  const rects=slots.map(([pos,x,y],i)=>{
    const p=player(G.team[i]),penalty=choice?fit(player(choice),pos):null,fitClass=penalty==null?'':penalty===0?'fit-good':penalty<=8?'fit-okay':'fit-bad';
    const label=`${pos} slot${p?' occupied by '+esc(p.name):''}${choice?`, ${penalty===0?'natural position':penalty<=8?'slight position penalty':'major position penalty'}`:''}`;
    return `<button class="slot ${p?'filled':''}${choice?' target':''} ${fitClass}${G.slotPick===i?' picked':''}" style="left:${x}%;top:${92-y*.84}%" data-slot="${i}" aria-label="${label}">${p?sticker(p,{mini:true,live:ev.per[i]}):pos}</button>`
  });
  const lines=[];
  for(const [i,j] of ev.edges){if(!G.team[i]||!G.team[j])continue;const a=slots[i],b=slots[j],chem=runLink(player(G.team[i]),player(G.team[j]),G.perks||[]);const color=chem>=70?'#55dc9b':chem>=30?'#f7cc66':'#ea7777';lines.push(`<line x1="${a[1]}" y1="${92-a[2]*.84}" x2="${b[1]}" y2="${92-b[2]*.84}" stroke="${color}"/>`)}
  if(!container.querySelector('svg.lines'))container.insertAdjacentHTML('afterbegin','<svg class="lines" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="2" width="96" height="121"/><rect x="22" y="103" width="56" height="20"/><rect x="36" y="115" width="28" height="8"/><path d="M2 2 A40 40 0 0 0 42 2 M98 2 A40 40 0 0 1 58 2 M36 103 A14 14 0 0 1 64 103"/></svg>');
  container.querySelector('svg.links')?.remove();container.querySelector('#slots')?.remove();
  container.insertAdjacentHTML('beforeend',`<svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg><div id="slots">${rects.join('')}</div>`);
  if(clickable)container.querySelectorAll('.slot').forEach(b=>b.onclick=()=>slotClick(+b.dataset.slot,container.id));return ev
}
function renderDraft(){const ev=renderPitch($('pitch'));$('st-rating').textContent=G.hardcore?'?':ev.rating||'–';$('st-chem').textContent=G.hardcore?'?':ev.count?ev.chem:'–';$('st-n').textContent=`${ev.count}/11`;$('st-breakdown').innerHTML=ratingBreakdown(ev,G.hardcore);$('spin-n').textContent=Math.min(G.spin,14);$('offers').innerHTML=G.offers.map(id=>{const p=player(id);return sticker(p,{picked:G.picked===id,managed:sameManager(p)})}).join('');bindCards($('offers'),i=>{G.picked=G.picked===G.offers[i]?null:G.offers[i];G.slotPick=null;G.confirmSlot=null;renderDraft();showDetail(G.picked);save()});$('skip').disabled=G.skips>=3||14-G.spin<11-ev.count;$('skip').textContent=`Skip all three (${3-G.skips} left)`;$('finish').disabled=ev.count<11;$('note').textContent=G.confirmSlot!=null?'Tap that filled slot again to replace its player.':G.picked?'Green is a natural position, yellow a small penalty, red a major penalty. Tap a filled slot twice to replace it.':G.slotPick!=null?'Tap another slot to swap positions.':`Pick a player, then tap a pitch slot. ${14-G.spin} spins remain after this one.`;$('perks').textContent=G.manager?`${G.manager} · ${manager(G.manager).perk} · Linked partnerships lift ratings and chemistry; cursed cards weaken nearby links.`:'';if(G.picked)showDetail(G.picked);else if(G.slotPick!=null)showDetail(G.team[G.slotPick]);else $('detail').classList.remove('on')}
function showDetail(id){const p=player(id);if(!p){$('detail').classList.remove('on');return}const index=G.team.indexOf(id),live=index>=0?evaluate().per[index]:null,ev=live;const impact=ev&&!G.hardcore?`<br><strong>On pitch: ${ev.value} effective · ${ev.chem} chemistry${ev.penalty?` · -${ev.penalty} out of position`:''}</strong>`:'';$('detail').innerHTML=`<b>${esc(p.name)}</b><br>United career rating ${G.hardcore?'hidden':p.rating} · ${esc(p.pos.join(' / '))} · ${esc(p.era)} · United ${p.from}–${p.to}${impact}${hero(p)?`<br>🌟 ${esc(hero(p))}`:''}${duo(p)?`<br>🤝 ${esc(duo(p).name)} · linked partner gives up to +${duo(p).bonus} rating and +${duo(p).link} link chemistry`:''}${cursed(p)?`<br>⚠️ ${esc(cursed(p))}`:''}`;$('detail').classList.add('on')}
function slotClick(i,where){if(where==='pitch'){if(G.picked){const filled=G.team.filter(Boolean).length;if(G.team[i]&&14-G.spin<11-filled){$('note').textContent='Use the remaining spins to fill empty slots first.';return}if(G.team[i]&&G.confirmSlot!==i){G.confirmSlot=i;renderDraft();return}G.team[i]=G.picked;G.picked=null;G.confirmSlot=null;nextSpin();return}if(G.slotPick==null){if(G.team[i]){G.slotPick=i;renderDraft()}return}if(G.slotPick===i){G.slotPick=null;renderDraft();return}[G.team[i],G.team[G.slotPick]]=[G.team[G.slotPick],G.team[i]];G.slotPick=null;renderDraft();save()}else if(where==='wild-pitch'){if(G.wildUsed){$('wild-note').textContent='Wildcard already used. Undo the substitution to choose again.';return}if(!G.wildPick){$('wild-note').textContent='Pick one of the wildcard cards first, or enter the gauntlet with this XI.';return}const before=evaluate().rating;G.wildPrevious={slot:i,id:G.team[i]};G.team[i]=G.wildPick;G.wildUsed=true;G.wildPick=null;const after=evaluate().rating;G.wildDelta=+(after-before).toFixed(1);$('wild-note').textContent=`Wildcard in. Team rating ${G.wildDelta>=0?'+':''}${G.wildDelta.toFixed(1)}. You can enter the gauntlet.`;renderWild();save()}else if(where==='reshape-pitch'){const from=G.reshapePick;if(from==null){G.reshapePick=i;$('reshape-note').textContent='Now tap the slot to swap with.'}else{[G.reshapeTeam[from],G.reshapeTeam[i]]=[G.reshapeTeam[i],G.reshapeTeam[from]];G.reshapePick=null;renderReshapePitch();$('reshape-note').textContent='Positions swapped. Confirm when ready.';save()}}}
function wildcardPool(eras,team){const selected=new Set(team.filter(Boolean).map(id=>player(id)?.name));const eligible=PLAYERS.filter(p=>p.rating>=88&&!selected.has(p.name));const chosen=shuffle(eligible.filter(p=>eras.includes(p.era))).slice(0,3);if(chosen.length<3)chosen.push(...shuffle(eligible.filter(p=>!eras.includes(p.era))).slice(0,3-chosen.length));return chosen.map(p=>p.id)}
function startWild(){G.wildOffers=wildcardPool(G.eras,G.team);G.wildPick=null;G.wildUsed=false;G.wildPrevious=null;G.wildDelta=0;renderWild();show('s-wild')}
function renderWild(){const ev=renderPitch($('wild-pitch'));$('wild-actions').hidden=!G.wildPick&&(!G.wildUsed||!G.wildPrevious);$('wild-cancel').hidden=!G.wildPick||G.wildUsed;$('wild-undo').hidden=!G.wildUsed||!G.wildPrevious;if(!G.wildUsed)$('wild-note').textContent=G.wildPick?'Green is a natural position, yellow a small penalty, red a major penalty. Choose a player to replace, or cancel your selection.':'Pick a wildcard, then choose who he replaces on the pitch. You can also keep your XI.';$('wild-offers').innerHTML=G.wildOffers.map(id=>sticker(player(id),{picked:G.wildPick===id})).join('');if(!G.wildUsed)bindCards($('wild-offers'),i=>{G.wildPick=G.wildPick===G.wildOffers[i]?null:G.wildOffers[i];renderWild();save()});else $('wild-offers').querySelectorAll('.sticker').forEach(e=>{e.removeAttribute('role');e.removeAttribute('tabindex');e.setAttribute('aria-disabled','true')});$('w-rating').textContent=G.hardcore?'?':ev.rating;$('w-chem').textContent=G.hardcore?'?':ev.chem;$('w-delta').textContent=G.hardcore?'?':G.wildUsed?`${G.wildDelta>=0?'+':''}${G.wildDelta.toFixed(1)}`:'–';$('w-breakdown').innerHTML=ratingBreakdown(ev,G.hardcore)}
function enterGauntlet(){G.level=0;G.results=[];G.reshapeUsed=false;prepareMatch();show('s-gauntlet');grantEntryAchievements()}
function renderRunPerks(){$('run-perks').innerHTML=`<b>Run perks</b>${G.perks?.length?`<div>${G.perks.map(id=>{const p=RUN_PERKS.find(x=>x.id===id);return p?`<span title="${esc(p.desc)}">${esc(p.name)}</span>`:''}).join('')}</div>`:'<small>Win a match to choose your first boost.</small>'}`}
function prepareMatch(){
  const o=OPPONENTS[G.level];if(!o){finishRun();return}
  const ev=evaluate();$('g-rating').textContent=G.hardcore?'?':ev.rating;$('g-breakdown').innerHTML=ratingBreakdown(ev,G.hardcore);$('g-mgr').textContent=G.manager||'';
  $('score').textContent='0–0';$('clock').textContent='Kick-off';$('opp-name').innerHTML=`${esc(o.name)}<small id="opp-mgr">${esc(o.manager)}</small>`;
  $('opp-xi').innerHTML=`<div class="opp-meta"><b>${esc(o.match)}</b><span>${esc(o.formation)}</span></div><details class="opp-details" open><summary>Historical starting XI</summary><div class="opp-grid">${o.xi.map((name,i)=>`<div class="${o.key.includes(name)?'key-player':''}"><span>${esc(FORMATIONS[o.formation][i][0])}</span><b>${esc(name)}</b>${o.key.includes(name)?'<small>KEY PLAYER</small>':''}</div>`).join('')}</div><a href="${esc(o.source)}" target="_blank" rel="noopener noreferrer">Lineup source ↗</a><p>Historical XI; tactical positions adapted to game slots. Opponent strength is fixed and hidden.</p></details>`;
  $('trait').innerHTML=`<b>${esc(o.trait)}</b> — ${esc(o.desc)}`;$('log').innerHTML='';$('after').innerHTML='<button class="btn" id="kickoff">Kick off</button><button class="btn ghost" id="skipsim" hidden>Skip to full-time</button>';$('kickoff').onclick=kickoff;$('skipsim').onclick=()=>finishSimulation();$('reshape').disabled=!!G.reshapeUsed;$('reshape-panel').hidden=true;renderLadder();renderRunPerks();save()
}
function renderLadder(){$('ladder').innerHTML=OPPONENTS.map((o,i)=>`<div class="${i<G.results.length?(G.results[i].win?'won':'lost'):i===G.level?'now':''}"><span class="num">${i+1}</span><span>${esc(o.name)}</span><span class="done">${i<G.results.length?`${G.results[i].us}–${G.results[i].them}`:''}</span></div>`).join('')}
function appendLog(text,kind=''){const d=document.createElement('div');d.className=kind;d.textContent=text;$('log').append(d);$('log').scrollTop=$('log').scrollHeight}
let simulation=null;
function chooseScorer(ev){const slots=FORMATIONS[G.formation];const bag=[];for(let i=1;i<11;i++){const p=player(G.team[i]);if(!p)continue;const pos=slots[i][0],weight={ST:6,RW:3.5,LW:3.5,AM:3,RM:2,LM:2,CM:1.6,DM:.7,RB:.5,LB:.5,CB:.4}[pos]||.3;bag.push({p,weight:weight*Math.max(.25,(ev.per[i]?.value||50)/80)})}let roll=rng()*bag.reduce((n,x)=>n+x.weight,0);for(const x of bag){roll-=x.weight;if(roll<=0)return x.p}return bag.at(-1)?.p}
function lineStrength(ev,formation){const slots=FORMATIONS[formation];const average=positions=>{const values=positions.flatMap(pos=>slots.map((slot,i)=>slot[0]===pos?ev.per[i]?.value:null).filter(v=>v!=null));return values.length?values.reduce((a,b)=>a+b,0)/values.length:ev.rating};return {attack:.55*average(['ST','RW','LW'])+.30*average(['AM','RM','LM'])+.15*average(['CM','DM']),defence:.42*average(['GK'])+.43*average(['CB','RB','LB'])+.15*average(['CM','DM'])}}
function kickoff(){
  if(simulation)return;
  const o=OPPONENTS[G.level],ev=evaluate(),ours=lineStrength(ev,G.formation),theirs={attack:o.strength,defence:o.strength},m=manager(G.manager);
  const keeper=player(G.team[0]),keeperOut=fit(keeper,'GK')>0;
  let us=0,them=0,twoDown=false;const events=[];
  for(let minute=1;minute<=90;minute++){
    const attackDiff=ours.attack-theirs.defence,defenceDiff=theirs.attack-ours.defence;
    let ourChance=clamp((1.45/90)*Math.exp(attackDiff/23),.003,.09);
    let theirChance=clamp((1.45/90)*Math.exp(defenceDiff/23),.003,.09);
    if(keeperOut)theirChance=Math.max(3.6/90,theirChance*5);
    if(o.trait==='Relentless'&&them===0)theirChance*=1+minute/150;
    if(o.trait==='Never beaten'&&them<us&&minute>=70)theirChance*=1.75;
    if(o.trait==='Fearless youth'&&minute>=60)theirChance*=1.22;
    if(o.trait==='Wide threat'&&minute>=50)theirChance*=1.18;
    if(o.trait==='Last chance'&&minute>=75)theirChance*=1.3;
    if(o.trait==='Law of the land')theirChance*=1.12;
    if(o.trait==='The breakthrough'&&ev.shape>0)theirChance*=1+Math.min(.4,ev.shape/30);
    if(o.trait==='One last title'&&them<us)theirChance*=1.28;
    if(o.trait==='European night'&&ev.chem<60)theirChance*=1.25;
    if(o.trait==='Cup final focus'&&minute<=25)theirChance*=1.22;
    if(m?.late&&minute>=75)ourChance*=1.4;
    if(m?.counter&&them>us)ourChance*=1.3;
    if(rng()<ourChance){us++;const scorer=chooseScorer(ev);events.push({minute,kind:'goal',scorer:scorer?.name,scorerRating:scorer?.rating||0,text:`${minute}' GOAL — ${scorer?.name||'Your XI'} finds the net.`})}
    if(rng()<theirChance){them++;events.push({minute,kind:'against',text:`${minute}' Goal for ${o.name}.`})}
    if(them-us>=2)twoDown=true;
    if(minute%15===0&&!events.some(e=>e.minute===minute))events.push({minute,kind:'',text:`${minute}' Still battling at Old Trafford.`})
  }
  simulation={events,us,them,twoDown,index:0,o};$('kickoff').disabled=true;$('skipsim').hidden=false;matchTimer=setInterval(stepSimulation,370);stepSimulation()
}
function stepSimulation(){if(!simulation)return;const e=simulation.events[simulation.index++];if(e){appendLog(e.text,e.kind);$('clock').textContent=`${e.minute}'`;$('score').textContent=`${simulation.events.slice(0,simulation.index).filter(x=>x.kind==='goal').length}–${simulation.events.slice(0,simulation.index).filter(x=>x.kind==='against').length}`}if(simulation.index>=simulation.events.length)finishSimulation()}
function renderAfterMatch(){
  const last=G.results[G.level];if(!last)return;
  $('score').textContent=`${last.us}–${last.them}${last.pens?' pens':''}`;$('clock').textContent='Full-time';$('reshape').disabled=true;
  if(last.win&&G.level<OPPONENTS.length-1){
    if(!G.perkOffers?.length){const available=RUN_PERKS.filter(p=>!G.perks.includes(p.id)),current=evaluate();const useful=shuffle(available.filter(p=>{const next=evaluateTeam(G.team,G.formation,G.manager,[...G.perks,p.id]);return next.rating>current.rating+.02||next.chem>current.chem}));G.perkOffers=[...useful.slice(0,3),...shuffle(available.filter(p=>!useful.includes(p))).slice(0,Math.max(0,3-useful.length))].slice(0,3).map(p=>p.id)}
    $('after').innerHTML=`<div class="perk-choice"><b>Victory reward — choose one boost</b><div>${G.perkOffers.map(id=>{const p=RUN_PERKS.find(x=>x.id===id);return `<button class="perk-option" data-perk="${esc(id)}"><strong>${esc(p.name)}</strong><span>${esc(p.desc)}</span></button>`}).join('')}</div></div>`;
    $('after').querySelectorAll('[data-perk]').forEach(b=>b.onclick=()=>{G.perks.push(b.dataset.perk);G.perkOffers=[];G.level++;prepareMatch()});
  }else{$('after').innerHTML='<button class="btn" id="continue">See result</button>';$('continue').onclick=finishRun}
  save()
}
function finishSimulation(){if(!simulation)return;clearInterval(matchTimer);for(;simulation.index<simulation.events.length;simulation.index++){const e=simulation.events[simulation.index];appendLog(e.text,e.kind)}let {us,them,o}=simulation;let pens=false,penWin=false;if(us===them){pens=true;const chance=clamp(.5+(evaluate().rating-o.strength)*.015,.2,.8);penWin=rng()<chance;appendLog(`Penalty shootout: ${penWin?'your XI holds its nerve':'the opposition wins it'}.`,penWin?'goal':'against')}const win=pens?penWin:us>them;const goals=simulation.events.filter(e=>e.kind==='goal');const counts={};goals.forEach(e=>counts[e.scorer]=(counts[e.scorer]||0)+1);const winner=goals.at(-1);G.results.push({us,them,win,pens,opponent:o.name,comeback:win&&simulation.twoDown,hat:win&&Object.values(counts).some(n=>n>=3),cult:win&&winner?.scorerRating<75});appendLog(win?'Full-time: your run continues!':'Full-time: the gauntlet ends here.',win?'goal':'against');simulation=null;renderLadder();renderAfterMatch()}
function grant(id){earned.add(id)}
function grantEntryAchievements(){const e=evaluate(),ps=selectedPlayers();if(e.chem>=90)grant('telepathy');if(e.rating<65)grant('sunday');if(ps.every(sameManager))grant('busby');persist()}
function finishRun(){clearInterval(matchTimer);simulation=null;const wins=G.results.filter(r=>r.win).length,ps=selectedPlayers(),ev=evaluate(),bad=ps.filter((p,i)=>fit(p,FORMATION_SLOTS()[i][0])>0).length;let newly=[];const old=new Set(earned);if(wins>=5)grant('five');if(wins===10){grant('ten');if(G.eras.length===1)grant('purist');if(G.eras.length===2)grant('twotone');if(G.eras.length===3)grant('trilogy');if(!G.wildUsed)grant('made');if(ps.some(cursed))grant('cursed')}if(wins>=5&&G.eras.length===9)grant('ages');if(wins>=5&&G.hardcore)grant('blind');if(wins>0){if(ps.filter(p=>p.era==='Pre-war').length>=3)grant('sepia');if(bad>=3)grant('square');if(G.team[0]&&player(G.team[0]).pos[0]!=='GK')grant('rush');if(G.results.some(r=>r.pens&&r.win))grant('spot');if(G.results.some(r=>r.comeback))grant('comeback');if(G.results.some(r=>r.hat))grant('hat');if(G.results.some(r=>r.cult))grant('cult');if(G.results.filter(r=>r.win&&r.them===0).length>=3)grant('wall');if(G.skips===0)grant('given');if(ev.rating<72)grant('shock')}newly=[...earned].filter(x=>!old.has(x));const record={date:dayKey(),daily:G.daily,wins,formation:G.formation,manager:G.manager,rating:ev.rating,neutralRating:ev.neutralRating,chemImpact:ev.chemImpact,chem:ev.chem,perks:[...(G.perks||[])],players:ps.map(p=>p.name),lineup:G.team.map((id,i)=>{const p=player(id),s=ev.per[i];return {name:p.name,pos:FORMATION_SLOTS()[i][0],base:p.rating,eff:s.value,chem:s.chem,hero:!!hero(p)}}),links:ev.edges.map(([i,j])=>({i,j,chem:runLink(player(G.team[i]),player(G.team[j]),G.perks||[])})),results:G.results};records.unshift(record);clearRun();renderResult(record,newly);renderSetup();show('s-result')}
function FORMATION_SLOTS(){return FORMATIONS[G?.formation||records[0]?.formation||'4-3-3']}
function renderResult(r,newly){
  $('r-title').textContent=r.wins===10?'Gauntlet conquered':'Run over';
  $('r-sub').textContent=`${r.wins} of 10 opponents beaten · ${r.formation} · ${r.manager}`;
  const impact=r.chemImpact??0;
  $('verdict').innerHTML=`<b>${r.wins===10?'Glory at Old Trafford':'The run ends'}</b><br>Overall ${r.rating} · chemistry ${r.chem}. Links moved your overall ${impact>=0?'+':''}${impact.toFixed(1)} from its no-chemistry value.${r.perks?.length?`<br>Run perks: ${r.perks.map(id=>esc(RUN_PERKS.find(p=>p.id===id)?.name||id)).join(' · ')}`:''}`;
  $('result-lineup').innerHTML=`<h3>Final XI</h3>${(r.lineup||[]).map(s=>`<div><span class="position-tag">${esc(s.pos)}</span><span>${esc(s.name)}</span><b>${Math.round(s.eff)}</b></div>`).join('')}`;
  const shareText=`🔴 THE STRETFORD GAUNTLET\n${r.wins}/10 opponents beaten\n${r.formation} · ${r.manager}\nOverall ${r.rating} · chemistry ${r.chem}${r.perks?.length?`\nRun perks: ${r.perks.map(id=>RUN_PERKS.find(p=>p.id===id)?.name||id).join(' · ')}`:''}\n${r.players.join(' · ')}\n\nTry now at https://zaidtacticsboard.com/stretfordgauntlet/`;
  $('r-text').value=shareText;
  $('newach').innerHTML=newly.length?`<h3>New achievements</h3>${newly.map(id=>`<div>🏆 ${esc(ACHIEVEMENTS.find(a=>a[0]===id)?.[1]||id)}</div>`).join('')}`:'';
  drawCard(r)
}
function drawCard(r){
  const c=$('card'),x=c.getContext('2d'),W=c.width,H=c.height;
  x.fillStyle='#eef2ef';x.fillRect(0,0,W,H);
  x.fillStyle='#17292f';x.fillRect(0,0,W,210);x.fillStyle='#c63b37';x.fillRect(0,0,16,H);
  x.fillStyle='#d9b773';x.font='700 22px Space Grotesk, sans-serif';x.fillText('OLD TRAFFORD  /  FINAL XI',62,55);
  x.fillStyle='#ffffff';x.font='800 80px Barlow Condensed, Impact';x.fillText('STRETFORD GAUNTLET',62,132);
  x.fillStyle='#a7c0bd';x.font='500 22px Space Grotesk, sans-serif';x.fillText(`${r.formation}  ·  ${r.manager}`,64,178);
  x.fillStyle='#ffffff';x.font='800 96px Barlow Condensed, Impact';x.textAlign='right';x.fillText(`${r.wins}/10`,W-62,178);x.textAlign='left';
  const px=82,py=248,pw=916,ph=835;
  x.fillStyle='#1e614e';x.fillRect(px,py,pw,ph);
  for(let i=0;i<8;i++){x.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';x.fillRect(px,py+i*ph/8,pw,ph/8)}
  x.strokeStyle='rgba(241,250,245,.68)';x.lineWidth=3;x.strokeRect(px+14,py+14,pw-28,ph-28);
  x.beginPath();x.moveTo(px+14,py+ph/2);x.lineTo(px+pw-14,py+ph/2);x.stroke();x.beginPath();x.arc(px+pw/2,py+ph/2,88,0,Math.PI*2);x.stroke();
  x.strokeRect(px+pw/2-180,py+ph-126,360,112);x.strokeRect(px+pw/2-85,py+ph-57,170,43);
  x.strokeRect(px+pw/2-180,py+14,360,112);x.strokeRect(px+pw/2-85,py+14,170,43);
  const slots=FORMATIONS[r.formation]||FORMATIONS['4-3-3'];
  const point=i=>{const slot=slots[i];return [px+slot[1]/100*pw,py+(92-slot[2]*.84)/100*ph]};
  for(const link of r.links||[]){const [ax,ay]=point(link.i),[bx,by]=point(link.j);x.strokeStyle=link.chem>=70?'rgba(179,244,180,.8)':link.chem>=30?'rgba(255,219,142,.78)':'rgba(245,157,155,.65)';x.lineWidth=5;x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke()}
  const lineup=r.lineup||r.players.map((name,i)=>({name,pos:slots[i][0],eff:r.rating,chem:0,hero:false}));
  lineup.forEach((s,i)=>{const [cx,cy]=point(i),cw=132,ch=78;
    x.fillStyle='rgba(6,32,31,.35)';x.fillRect(cx-cw/2+5,cy-ch/2+6,cw,ch);
    x.fillStyle='#f9f7f1';x.fillRect(cx-cw/2,cy-ch/2,cw,ch);
    x.fillStyle=s.hero?'#d5aa53':'#c43d38';x.fillRect(cx-cw/2,cy-ch/2,5,ch);
    x.strokeStyle=s.hero?'#d5aa53':'#d7e0da';x.lineWidth=s.hero?3:1;x.strokeRect(cx-cw/2,cy-ch/2,cw,ch);
    x.textAlign='left';x.fillStyle='#546c70';x.font='700 13px Space Grotesk, sans-serif';x.fillText(s.pos,cx-cw/2+12,cy-ch/2+18);
    x.fillStyle='#b53531';x.font='800 31px Barlow Condensed, Impact';x.textAlign='right';x.fillText(String(Math.round(s.eff)),cx+cw/2-10,cy-ch/2+29);
    const short=s.name.split(' ').slice(1).join(' ')||s.name;
    x.textAlign='left';x.fillStyle='#1d2c31';x.font='800 20px Barlow Condensed, Impact';x.fillText(short.toUpperCase(),cx-cw/2+12,cy+17,cw-22);
    x.textAlign='right';x.fillStyle='#277453';x.font='700 11px Space Grotesk, sans-serif';x.fillText(`CHEM ${s.chem}`,cx+cw/2-8,cy+32)
  });x.textAlign='left';
  x.fillStyle='#ffffff';x.fillRect(82,1107,916,172);
  x.fillStyle='#1d3035';x.font='800 47px Barlow Condensed, Impact';x.fillText('THE NUMBERS',108,1164);
  x.font='800 64px Barlow Condensed, Impact';x.fillText(String(r.rating),110,1240);x.fillText(String(r.chem),398,1240);
  const impact=r.chemImpact??0;x.fillStyle=impact>=0?'#1d8060':'#b6423b';x.fillText(`${impact>=0?'+':''}${impact.toFixed(1)}`,668,1240);
  x.fillStyle='#5c7071';x.font='700 17px Space Grotesk, sans-serif';x.fillText('OVERALL',110,1263);x.fillText('CHEMISTRY',398,1263);x.fillText('LINK EFFECT',668,1263);
  x.fillStyle='#1b2d32';x.font='800 30px Barlow Condensed, Impact';x.fillText('THE RUN',82,1330);
  for(let i=0;i<10;i++){const result=r.results[i],left=82+i*92;x.fillStyle=result?(result.win?'#277453':'#bb403b'):'#c6d1cc';x.fillRect(left,1351,80,44);x.fillStyle='#ffffff';x.textAlign='center';x.font='800 21px Barlow Condensed, Impact';x.fillText(String(i+1),left+40,1381)}x.textAlign='left';
  x.fillStyle='#5f7374';x.font='600 18px Space Grotesk, sans-serif';x.fillText('UNOFFICIAL FAN PROJECT  ·  NOT AFFILIATED WITH MANCHESTER UNITED FC',82,1422);
  x.fillStyle='#a83731';x.font='700 16px Space Grotesk, sans-serif';x.fillText('ZAIDTACTICSBOARD.COM/STRETFORDGAUNTLET',82,1447)
}
function bestAssignment(ids,formation){const slots=FORMATIONS[formation],dp=new Map([[0,{cost:0,team:Array(11).fill(null)}]]);for(let k=0;k<11;k++){const next=new Map();for(const [mask,state] of dp){for(let i=0;i<11;i++){if(mask&(1<<i))continue;const p=player(ids[k]),cost=state.cost+fit(p,slots[i][0])*100+Math.abs(k-i);const nmask=mask|(1<<i);if(!next.has(nmask)||cost<next.get(nmask).cost){const team=[...state.team];team[i]=ids[k];next.set(nmask,{cost,team})}}}dp.clear();for(const [mask,state] of next)dp.set(mask,state)}return dp.get((1<<11)-1)?.team||[...ids]}
function renderReshapePitch(){const team=G.team,formation=G.formation;G.team=G.reshapeTeam;G.formation=G.reshapeForm;renderPitch($('reshape-pitch'));G.team=team;G.formation=formation}
function openReshape(){G.reshapeForm=G.formation;G.reshapeTeam=[...G.team];G.reshapePick=null;$('reshape-panel').hidden=false;$('reshape-forms').innerHTML=Object.keys(FORMATIONS).map(f=>`<button class="fbtn ${G.formation===f?'on':''}" data-f="${f}">${f}</button>`).join('');$('reshape-forms').querySelectorAll('button').forEach(b=>b.onclick=()=>{G.reshapeForm=b.dataset.f;G.reshapeTeam=bestAssignment(G.team,G.reshapeForm);G.reshapePick=null;$('reshape-forms').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));renderReshapePitch();$('reshape-note').textContent='Best positional fit shown. Tap two players to swap them.'});$('reshape-pitch').innerHTML='';renderReshapePitch();$('reshape-note').textContent='Choose a formation or tap two players to swap them.'}
function confirmReshape(){if(G.reshapeUsed)return;G.team=[...G.reshapeTeam];G.formation=G.reshapeForm;G.reshapeUsed=true;G.reshapeTeam=null;G.reshapePick=null;$('reshape-panel').hidden=true;$('reshape').disabled=true;prepareMatch()}

// Setup controls
$('eras').onclick=e=>{const b=e.target.closest('button[data-era]');if(!b)return;const on=$('eras').querySelectorAll('.on');if(b.classList.contains('on')&&on.length===1)return;b.classList.toggle('on');b.setAttribute('aria-pressed',b.classList.contains('on'));const eras=[...$('eras').querySelectorAll('.on')].map(x=>x.dataset.era);saved.eras=eras;updateEraNote(eras);persist()};
$('formations').onclick=e=>{const b=e.target.closest('button[data-f]');if(!b)return;$('formations').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});saved.formation=b.dataset.f;persist()};
$('hardcore').onclick=()=>{let b=$('hardcore');b.classList.toggle('on');b.setAttribute('aria-pressed',b.classList.contains('on'));$('opplist').innerHTML=oppList();$('opplist2').innerHTML=oppList()};
$('start').onclick=()=>start(false);$('daily').onclick=()=>start(true);
$('mgr-go').onclick=()=>{if(!G?.managerPick)return;G.manager=G.managerPick;nextSpin()};
$('skip').onclick=()=>{if(!G||$('skip').disabled)return;G.skips++;nextSpin()};
$('finish').onclick=()=>{if(!G?.team.every(Boolean))return;if(G.spin<14&&G.finishArmed!==true){G.finishArmed=true;$('finish').textContent=`Tap again — ${15-G.spin} spins will go unused`;setTimeout(()=>{if(G?.finishArmed){G.finishArmed=false;$('finish').textContent='Done — to the wildcard'}},3000);return}G.finishArmed=false;startWild()};
$('wild-go').onclick=()=>enterGauntlet();
$('wild-cancel').onclick=()=>{if(!G||G.wildUsed)return;G.wildPick=null;renderWild();save()};
$('wild-undo').onclick=()=>{if(!G?.wildUsed||!G.wildPrevious)return;G.team[G.wildPrevious.slot]=G.wildPrevious.id;G.wildUsed=false;G.wildPrevious=null;G.wildDelta=0;renderWild();$('wild-note').textContent='Substitution undone. Pick a wildcard or keep your XI.';save()};
$('reshape').onclick=()=>{if(!G?.reshapeUsed)openReshape()};
$('reshape-ok').onclick=confirmReshape;$('reshape-cancel').onclick=()=>{G.reshapeTeam=null;G.reshapePick=null;$('reshape-panel').hidden=true;save()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('r-text').value);$('savetip').textContent='Result copied.'}catch{$('r-text').select();document.execCommand('copy');$('savetip').textContent='Result copied.'}};
$('copyfull').onclick=async()=>{const r=records[0],full=`${$('r-text').value}\n\n${r.results.map((m,i)=>`${i+1}. ${m.opponent}: ${m.us}–${m.them}`).join('\n')}`;try{await navigator.clipboard.writeText(full);$('savetip').textContent='Full breakdown copied.'}catch{$('savetip').textContent='Unable to copy automatically.'}};
$('save').onclick=()=>{const a=document.createElement('a');a.download='stretford-gauntlet-result.png';a.href=$('card').toDataURL('image/png');a.click();$('savetip').textContent='Result card saved.'};
$('share-image').onclick=async()=>{const canvas=$('card'),message=$('r-text').value;$('savetip').textContent='Preparing the lineup image…';try{const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image export failed');const file=new File([blob],'stretford-gauntlet-result.png',{type:'image/png'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){$('savetip').textContent='Choose where to share the image. Your run message is included.';try{await navigator.share({files:[file],text:message,title:'The Stretford Gauntlet'});$('savetip').textContent='Lineup image shared.';return}catch(error){if(error.name==='AbortError'){$('savetip').textContent='Sharing cancelled.';return}}}}catch(error){$('savetip').textContent='Direct image sharing is unavailable here.'}try{await navigator.clipboard.writeText(message)}catch{}$('save').click();$('savetip').textContent='Image saved. The run message is ready to paste or copy above.'};
$('again').onclick=()=>{renderSetup();show('s-setup')};
$('resume-go').onclick=()=>{if(!checkpoint)return;G=JSON.parse(JSON.stringify(checkpoint));G.perks ||= [];G.perkOffers ||= [];rng=G.daily?seedRandom('stretford-'+G.daily):Math.random;if(G.phase==='s-manager')renderManager();if(G.phase==='s-draft')renderDraft();if(G.phase==='s-wild')renderWild();if(G.phase==='s-gauntlet'){const played=G.results.length>G.level;prepareMatch();if(played)renderAfterMatch()}show(G.phase)};
$('resume-drop').onclick=()=>{clearRun();renderSetup()};

renderSetup();
