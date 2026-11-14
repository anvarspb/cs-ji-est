export const DAY=86400000,HOUR=3600000;
export const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const integer=v=>Number.isInteger(v)&&v>=0?v:null;
const str=v=>typeof v==='string'?v:'';
export function initialState(){return {version:1,matches:[],tournaments:[],requests:[],jobs:{},scheduleAt:null,recentAt:null,backoffUntil:0,providerUsed:0,providerReset:0,warnings:[],updatedAt:null};}
export function prune(state,now){
 state.requests=state.requests.filter(r=>Date.parse(r.at)>now-30*DAY);
 state.matches=state.matches.filter(m=>m.status==='finished'?Date.parse(m.finishedAt??m.startsAt)>=now-7*DAY:Date.parse(m.startsAt)>=now-7*DAY&&Date.parse(m.startsAt)<=now+7*DAY);
 const ids=new Set(state.matches.map(m=>m.id));state.jobs=Object.fromEntries(Object.entries(state.jobs).filter(([id])=>ids.has(id)));
 const events=new Set(state.matches.map(m=>m.tournamentId));state.tournaments=state.tournaments.filter(t=>events.has(t.id));
}
export function canSpend(state,now){return state.requests.filter(r=>Date.parse(r.at)>now-30*DAY).length<450&&now>=state.backoffUntil&&(now>=state.providerReset||state.providerUsed<450);}
export function resultPollDue(state,now){return now>=state.backoffUntil&&(!state.recentAt||now-Date.parse(state.recentAt)>=HOUR)&&state.matches.some(m=>['upcoming','live'].includes(m.status)&&!m.pollStoppedAt&&now-Date.parse(m.startsAt)>=HOUR&&now-Date.parse(m.startsAt)<12*HOUR);}
export function stopExpired(state,now){for(const m of state.matches){if(['upcoming','live'].includes(m.status)&&now-Date.parse(m.startsAt)>=12*HOUR){m.pollStoppedAt??=new Date(now).toISOString();m.statusNote='Результат не подтверждён; автоматическое ожидание остановлено';}}}
function team(raw,id,name){return {id:str(id),name:str(name),shortName:str(raw?.teamTag)||str(name),color:'#c5ff46',logo:str(raw?.darkUiLogoUrl||raw?.logoUrl),};}
export function normalizeMatch(raw,allowed,now){
 const rule=allowed.find(e=>e.id===raw?.eventId);
 if(!rule||!/^cs2-match-\d+$/.test(raw.id)||!validDate(raw.startsAt)||![1,3,5].includes(raw.bestOf)||!raw.team1Id||!raw.team2Id||raw.team1Id===raw.team2Id||!raw.team1Name||!raw.team2Name)return null;
 const status={completed:'finished',upcoming:'upcoming',live:'live',postponed:'postponed',cancelled:'cancelled'}[raw.status];if(!status)return null;
 const a=integer(raw.team1Score),b=integer(raw.team2Score);
 if(status==='finished'&&(a===null||b===null))return null;
 return {id:raw.id,team1:team(raw.team1,raw.team1Id,raw.team1Name),team2:team(raw.team2,raw.team2Id,raw.team2Name),tournamentId:raw.eventId,startsAt:raw.startsAt,...(validDate(raw.endsAt)?{finishedAt:raw.endsAt}:{}),format:`BO${raw.bestOf}`,status,statusSource:'provider-confirmed',...(status==='finished'?{score:[a,b]}:{}),maps:[],players:[],stage:str(raw.stageName)||'Матч турнира',observedAt:new Date(now).toISOString()};
}
export function normalizeTournament(raw,rule){
 if(!raw||!validDate(raw.startsAt)||!validDate(raw.endsAt))return null;
 return {id:rule.id,name:str(raw.name)||rule.name,shortName:rule.name.startsWith('BLAST')?'BLAST':rule.name.startsWith('PGL')?'PGL':'CS2',startsAt:raw.startsAt,endsAt:raw.endsAt,status:{live:'ongoing',completed:'finished',upcoming:'upcoming'}[raw.status]??'upcoming',location:str(raw.location)||'Место не указано',prizePool:num(raw.prizePool)!==null?`${raw.currency??''} ${Number(raw.prizePool).toLocaleString('en-US')}`:'Призовой фонд не указан',tier:rule.tier};
}
export function mergeRows(state,rows,allowed,now){
 for(const raw of rows){const m=normalizeMatch(raw,allowed,now);if(!m)continue;
  if(m.status==='finished'&&Date.parse(m.finishedAt??m.startsAt)<now-7*DAY)continue;
  if(m.status!=='finished'&&(Date.parse(m.startsAt)>now+7*DAY||Date.parse(m.startsAt)<now-7*DAY))continue;
  const old=state.matches.find(x=>x.id===m.id);
  if(old?.status==='finished'&&m.status!=='finished')continue;
  if(old){const moved=m.startsAt!==old.startsAt;Object.assign(old,m,{maps:old.maps,players:old.players});if(moved)delete old.pollStoppedAt;}
  else state.matches.push(m);
  const rule=allowed.find(e=>e.id===m.tournamentId),t=normalizeTournament(raw.event,rule);
  if(t){const index=state.tournaments.findIndex(x=>x.id===t.id);if(index>=0)state.tournaments[index]=t;else state.tournaments.push(t);}
 }
}
export function normalizeMaps(rows){return rows.filter(r=>r.resultType!=='not_played'&&r.resultStatus!=='not_played'&&integer(r.team1Score)!==null&&integer(r.team2Score)!==null&&str(r.mapName??r.map)&&str(r.mapName??r.map)!=='TBA').map(r=>({id:str(r.id),name:str(r.mapName??r.map),team1Score:r.team1Score,team2Score:r.team2Score,statsEligible:r.statsEligible!==false}));}
export function normalizeStats(rows,match){return rows.filter(p=>p.matchId===match.id&&[match.team1.id,match.team2.id].includes(p.teamId)&&p.playerId&&p.mapId&&p.playerName).map(p=>({playerId:str(p.playerId),player:str(p.playerName),teamId:str(p.teamId),mapId:str(p.mapId),kills:integer(p.kills),deaths:integer(p.deaths),assists:integer(p.assists),adr:num(p.adr),rating:num(p.rating),ratingVersion:str(p.ratingVersion)||null}));}
export function detailsComplete(kind,data,match,meta){
 if(meta?.statsEligible===false||meta?.isForfeit===true)return true;
 if(kind==='maps')return data.length>0&&data.length>=(match.score?.reduce((a,b)=>a+b,0)??1);
 const maps=match.maps.filter(m=>m.statsEligible!==false);if(!maps.length)return false;
 return maps.every(map=>[match.team1.id,match.team2.id].every(team=>new Set(data.filter(p=>p.mapId===map.id&&p.teamId===team&&[p.kills,p.deaths,p.assists,p.adr].every(v=>v!==null)).map(p=>p.playerId)).size>=5));
}
export function snapshot(state,now){return {version:1,updatedAt:state.updatedAt,matches:state.matches,tournaments:state.tournaments,source:'Cito API',requests30d:state.requests.length,budgetLimit:450,warnings:[...new Set([...state.warnings,...(!canSpend(state,now)?['Обновление приостановлено: лимит запросов или пауза поставщика.']:[])])]};}
