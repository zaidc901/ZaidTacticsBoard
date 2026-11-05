import type { PlayerRole, StatsDataset } from '../types/stats';
import { emptyCoverage, emptyMetrics, METRICS } from '../utils/statsMetrics';

// Deliberately fictional players and figures. Never presented as Premier League results.
const clubs=['Northbridge FC','Riverside United','Westhaven City','Kingsport Athletic','Eastfield Rovers','Southbank FC'];
const names=['Alex Morgan','Leo Bennett','Daniel Costa','Omar Silva','Noah Reid','Lucas Martin','Adam Clarke','Rafael Torres','Ben Harrison','Sam Okafor','Elias Moreau','Tom Walker','Mateo Rossi','James Ellis','Karim Diallo','Oliver Hayes','Hugo Santos','Isaac Young','Finn Murray','Theo Laurent','Julian Meyer','Louis Blake','Emir Kaya','Oscar Jensen','Max Turner','Nico Ferrara','Aaron Cole','David Kim','Ethan Brooks','Amir Hassan','Gabriel Cruz','Liam Grant','Jude Foster','Milan Novak','Arlo Watson','Victor Lund','Sebastian Bell','Enzo Garcia','Ruben Scott','Harvey Lewis','Dylan Evans','Felix Weber','Kian Murphy','Simon Berg','Yusuf Ali','Marco Ricci','Ryan Wood','Adrian Lee'];
export const statsDemo:StatsDataset={version:1,source:'Demo',season:'Sample season',updatedAt:'',matches:0,players:names.map((name,i)=>{
  const role=(['MID','FWD','DEF','MID','FWD','DEF','MID','GK'] as PlayerRole[])[i%8];
  const minutes=450+((i*173)%2100),n=minutes/90;
  const r=(salt:number)=>((i*37+salt*53+17)%101)/100;
  const metrics=emptyMetrics();
  Object.assign(metrics,{goals:Math.round(n*(role==='FWD'?.18+r(1)*.65:role==='MID'?.04+r(1)*.22:r(1)*.07)),assists:Math.round(n*r(2)*.28),xg:n*(role==='FWD'?.18+r(3)*.62:role==='MID'?.03+r(3)*.25:r(3)*.07),xa:n*(role==='MID'?.09+r(4)*.3:r(4)*.19),xgot:n*r(5)*.5,npxg:n*r(3)*.4,shots:Math.round(n*(role==='FWD'?1.5+r(6)*2.6:r(6)*1.6)),shotsOnTarget:Math.round(n*r(7)*1.4),progressivePasses:Math.round(n*(role==='MID'?3+r(8)*7:role==='DEF'?2+r(8)*5:r(8)*3)),progressiveCarries:Math.round(n*r(9)*4),keyPasses:Math.round(n*r(10)*3.2),passesIntoBox:Math.round(n*r(11)*2.8),passAccuracy:70+r(12)*23,touches:Math.round(n*(35+r(13)*50)),tackles:Math.round(n*r(14)*(role==='FWD'?1.5:3.5)),interceptions:Math.round(n*r(15)*2.5),sca:Math.round(n*r(16)*5),xT:n*r(17)*.18});
  const coverage=emptyCoverage();for(const m of METRICS)coverage[m.key]=Math.ceil(n);
  return {id:`demo-${i}`,name,club:clubs[i%clubs.length],teamId:`demo-team-${i%clubs.length}`,role,minutes,appearances:Math.ceil(n),metrics,coverage};
})};
