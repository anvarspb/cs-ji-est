import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import type { Match, Tournament } from './models';
import competitions from '../../config/competitions.json';
export interface Snapshot { version: number; updatedAt: string|null; matches: Match[]; tournaments: Tournament[]; source: string; requests30d: number; budgetLimit: number; warnings: string[] }
const empty:Snapshot={version:1,updatedAt:null,matches:[],tournaments:[],source:'Cito API',requests30d:0,budgetLimit:450,warnings:[]};
let lastGood:Snapshot|null=null;
function validate(v:unknown):v is Snapshot {if(!v||typeof v!=='object')return false;const x=v as Snapshot;return x.version===1&&Array.isArray(x.matches)&&Array.isArray(x.tournaments)&&Array.isArray(x.warnings)&&x.matches.every(m=>m&&typeof m.id==='string'&&m.team1&&m.team2&&typeof m.startsAt==='string'&&Number.isFinite(Date.parse(m.startsAt))&&Array.isArray(m.maps)&&Array.isArray(m.players));}
async function localSnapshot(){for(const file of ['.cito/data/snapshot.json','deployment-data/snapshot.json']){try{const value:unknown=JSON.parse(await fs.readFile(path.join(process.cwd(),file),'utf8'));if(validate(value))return value;}catch{ /* Try retained seed. */ }}return null;}
export const getSnapshot=cache(async():Promise<Snapshot>=>{
 let data:Snapshot|null=null,failed=false;
 const url=process.env.CITO_SNAPSHOT_URL;
 if(url){try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname!=='raw.githubusercontent.com')throw new Error('Unsupported snapshot host');const r=await fetch(url,{next:{revalidate:60},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Snapshot unavailable');const json:unknown=await r.json();if(!validate(json))throw new Error('Snapshot invalid');data=json;lastGood=json;}catch{failed=true;}}
 data??=lastGood??await localSnapshot();
 if(!data)return {...empty,warnings:['Данные пока не загружены. Настройте GitHub Actions и адрес JSON-снимка.']};
 const now=Date.now(),week=7*86400000;
 const matches=data.matches.filter(m=>competitions.events.some(e=>e.id===m.tournamentId)&&(m.status==='finished'?Date.parse(m.finishedAt??m.startsAt)>=now-week:Date.parse(m.startsAt)>=now-week&&Date.parse(m.startsAt)<=now+week));
 const events=new Set(matches.map(m=>m.tournamentId));
 return {...data,matches,tournaments:data.tournaments.filter(t=>events.has(t.id)),warnings:[...data.warnings,...(failed?['Снимок временно недоступен; показаны последние сохранённые данные.']:[]),...(data.updatedAt&&now-Date.parse(data.updatedAt)>24*3600000?['Данные не обновлялись более суток.']:[])]};
});
export async function getMatches(){return (await getSnapshot()).matches;}
export async function getMatch(id:string){return (await getMatches()).find(m=>m.id===id);}
export async function getTournaments(){return (await getSnapshot()).tournaments;}
export async function getTournament(id:string){return (await getTournaments()).find(t=>t.id===id);}
