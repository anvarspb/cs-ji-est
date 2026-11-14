import type {Match} from '../lib/models';
export interface MatchGroup {key:string; label:string; matches:Match[]}
export function localDay(value:string|number,timeZone?:string){const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',...(timeZone?{timeZone}:{})}).formatToParts(new Date(value));return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');}
export function dayHeading(key:string,now:number,timeZone?:string){const today=localDay(now,timeZone);const next=new Date(`${today}T12:00:00Z`);next.setUTCDate(next.getUTCDate()+1);const tomorrow=next.toISOString().slice(0,10);return key===today?'Сегодня':key===tomorrow?'Завтра':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(`${key}T12:00:00Z`));}
const start=(m:Match)=>Date.parse(m.startsAt);
const ended=(m:Match)=>Date.parse(m.finishedAt??m.startsAt);
export function groupMatches(matches:Match[],now:number,mode:'schedule'|'tournament',timeZone?:string):MatchGroup[]{
 const pending=matches.filter(m=>m.status!=='finished'&&(mode==='tournament'||m.status!=='cancelled')).sort((a,b)=>start(a)-start(b)||a.id.localeCompare(b.id));
 const completed=mode==='tournament'?matches.filter(m=>m.status==='finished').sort((a,b)=>ended(b)-ended(a)||a.id.localeCompare(b.id)):[];
 const groups=new Map<string,Match[]>();
 // Pending days first, ascending. Completed days then descend; a shared day is never repeated.
 for(const match of [...pending,...completed]){const key=localDay(match.status==='finished'?match.finishedAt??match.startsAt:match.startsAt,timeZone);const list=groups.get(key)??[];list.push(match);groups.set(key,list);}
 return [...groups].map(([key,list])=>({key,label:dayHeading(key,now,timeZone),matches:list}));
}
