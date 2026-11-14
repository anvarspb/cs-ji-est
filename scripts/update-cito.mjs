import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initialState,prune,canSpend,resultPollDue,stopExpired,mergeRows,normalizeMaps,normalizeStats,detailsComplete,snapshot,DAY,HOUR} from './cito-core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
if(fs.existsSync(path.join(root,'.env.local')))process.loadEnvFile(path.join(root,'.env.local'));
const dir=path.resolve(process.env.CITO_STATE_DIR||path.join(root,'.cito/data'));
fs.mkdirSync(dir,{recursive:true});
let lock;try{lock=fs.openSync(path.join(dir,'.update.lock'),'wx');}catch{throw new Error('Another update holds the state lock');}
const now=Date.now(),stateFile=path.join(dir,'state.json');
const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):initialState();
if(state.version!==1||!Array.isArray(state.requests))throw new Error('Unsupported state; refusing quota reset');
const allowed=JSON.parse(fs.readFileSync(path.join(root,'config/competitions.json'),'utf8')).events;
let stopped=false,lastCall=0,detailCalls=0;
function git(args){return execFileSync('git',['-C',dir,...args],{stdio:'pipe'}).toString();}
async function save(){
 prune(state,Date.now());
 for(const [file,value] of [['state.json',state],['snapshot.json',snapshot(state,Date.now())]]){const target=path.join(dir,file);fs.writeFileSync(`${target}.tmp`,JSON.stringify(value,null,2)+'\n');fs.renameSync(`${target}.tmp`,target);}
 if(process.env.CITO_PERSIST_GIT==='1'){
  git(['add','state.json','snapshot.json']);
  if(git(['diff','--cached','--name-only']).trim()){git(['commit','-m','Update CS PULSE data']);git(['push','origin','HEAD:data']);}
 }
}
function warning(text){state.warnings=[...new Set([...state.warnings,text])].slice(-8);}
async function request(kind,endpoint){
 if(stopped||!canSpend(state,Date.now()))return null;
 const wait=6200-(Date.now()-lastCall);if(wait>0)await new Promise(r=>setTimeout(r,wait));
 // Reserve durably before transport: a crash can overcount by one, never silently reset usage.
 state.requests.push({at:new Date().toISOString(),kind});await save();lastCall=Date.now();
 let response;
 try{response=await fetch(`https://api.citoapi.com/api/v1${endpoint}`,{headers:{'x-api-key':process.env.CITO_API_KEY},signal:AbortSignal.timeout(25000)});}catch{warning('Cito временно недоступен; показан последний снимок.');await save();return null;}
 const remaining=Number(response.headers.get('x-ratelimit-monthly-remaining'));
 const limit=Number(response.headers.get('x-ratelimit-monthly-limit'));
 if(response.headers.has('x-ratelimit-monthly-remaining')&&limit>0){state.providerUsed=limit-remaining;}
 if(!response.ok){
  warning(`Cito HTTP ${response.status}; предыдущие данные сохранены.`);
  if(response.status===429){const seconds=Number(response.headers.get('retry-after'));state.backoffUntil=Date.now()+(Number.isFinite(seconds)&&seconds>0?seconds*1000:HOUR);stopped=true;}
  if([401,403].includes(response.status)){state.backoffUntil=Date.now()+12*HOUR;stopped=true;}
  await save();return null;
 }
 let json;try{json=await response.json();}catch{warning('Cito вернул некорректный JSON.');await save();return null;}
 if(json.success!==true||!Array.isArray(json.data)||json.meta?.dataAvailable===false){warning('Данные Cito пока не опубликованы.');await save();return null;}
 return json;
}
async function main(){
 prune(state,now);stopExpired(state,now);
 if(process.argv.includes('--seed-verification')){
  const v=JSON.parse(fs.readFileSync(path.join(root,'.cito/verification.json'),'utf8'));
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'.cito/verification-ledger.json'),'utf8'));
  if(state.requests.length||state.matches.length)throw new Error('Seed requires empty state');
  state.requests=ledger;mergeRows(state,[...v.upcoming.data,...v.recent.data],allowed,now);state.scheduleAt=new Date(now).toISOString();state.recentAt=new Date(now).toISOString();
  warning('Источник ограничивает список результатов: часть матчей за последние 7 дней может отсутствовать.');
 }
 if(!process.env.CITO_API_KEY){warning('Ключ Cito не настроен; новые данные не загружены.');await save();console.error('CITO_API_KEY is not configured');process.exitCode=1;return;}
 // Health is quota-free. Read only plan counters; never persist the response/key object.
 try{
  const r=await fetch('https://api.citoapi.com/api/v1/health',{headers:{'x-api-key':process.env.CITO_API_KEY},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('health');const h=await r.json();const monthly=h.rateLimit?.monthly;
  if(!Number.isFinite(monthly?.used)||!Number.isFinite(Date.parse(monthly.resetsAt)))throw new Error('health schema');
  state.providerUsed=monthly.used;state.providerReset=Date.parse(monthly.resetsAt);
 }catch{warning('Не удалось подтвердить квоту Cito; обновление отложено.');await save();return;}
 if(now>=state.backoffUntil&&(!state.scheduleAt||now-Date.parse(state.scheduleAt)>=12*HOUR)){
  state.scheduleAt=new Date(now).toISOString();await save();
  const json=await request('schedule','/cs2/matches/upcoming?limit=100');
  if(json){mergeRows(state,json.data,allowed,now);if(json.data.length>=100||json.meta?.hasNext)warning('Расписание усечено лимитом 100; дополнительные страницы не запрашиваются.');state.updatedAt=new Date().toISOString();await save();}
 }
 if(resultPollDue(state,now)||!state.recentAt){
  state.recentAt=new Date(now).toISOString();await save();
  const json=await request('results',`/cs2/matches/recent?limit=100&from=${new Date(now-7*DAY).toISOString().slice(0,10)}`);
  if(json){mergeRows(state,json.data,allowed,now);if(json.data.length>=100||json.meta?.hasNext)warning('Источник ограничивает список результатов: часть матчей за последние 7 дней может отсутствовать.');state.updatedAt=new Date().toISOString();await save();}
 }
 // At most one match (two calls) per hourly run; retries are finite and shared-budgeted.
 for(const m of state.matches.filter(m=>m.status==='finished').sort((a,b)=>(b.finishedAt??b.startsAt).localeCompare(a.finishedAt??a.startsAt))){
  const job=state.jobs[m.id]??={};
  for(const kind of ['maps','stats']){
   const task=job[kind]??={attempts:0,nextAt:0,done:false};
   if(task.done||task.attempts>=3||task.nextAt>now||detailCalls>=2||!canSpend(state,Date.now()))continue;
   task.attempts++;task.nextAt=now+([2,6,24][task.attempts-1]*HOUR);await save();detailCalls++;
   const json=await request(kind,`/cs2/matches/${encodeURIComponent(m.id)}/${kind==='maps'?'maps':'player-stats'}`);
   if(!json)continue;
   const normalized=kind==='maps'?normalizeMaps(json.data):normalizeStats(json.data,m);
   if(kind==='maps'&&normalized.length)m.maps=normalized;
   if(kind==='stats'&&normalized.length){const merged=new Map(m.players.map(p=>[`${p.mapId}:${p.playerId}`,p]));for(const p of normalized)merged.set(`${p.mapId}:${p.playerId}`,p);m.players=[...merged.values()];}
   task.done=detailsComplete(kind,kind==='maps'?m.maps:m.players,m,json.meta);task.unavailableReason=json.meta?.unavailableReason??null;
   state.updatedAt=new Date().toISOString();await save();
  }
  if(detailCalls>=2)break;
 }
 await save();console.log(JSON.stringify({requests30d:state.requests.length,trackedMatches:state.matches.length,finished:state.matches.filter(m=>m.status==='finished').length,detailCalls,budgetLimit:450}));
}
try{await main();}catch{console.error('Update failed; no further Cito calls. Inspect configuration and state persistence.');process.exitCode=1;}
finally{fs.closeSync(lock);fs.unlinkSync(path.join(dir,'.update.lock'));}
