import type { Team, Tournament, Match } from './models';
export const teams: Team[] = [
 ['navi','Natus Vincere','NAVI','#e8ed32','NΛVI'], ['vitality','Vitality','VIT','#f8d85b','V'], ['spirit','Team Spirit','TS','#e9edf2','S'], ['g2','G2 Esports','G2','#f0f1f5','G2'], ['faze','FaZe Clan','FAZE','#ff485d','F'], ['mouz','MOUZ','MOUZ','#ff4655','M'], ['falcons','Falcons','FLC','#62c38e','F'], ['furia','FURIA','FUR','#dee3ed','FUR']
].map(([id,name,shortName,color,logo]) => ({id,name,shortName,color,logo}));
export const tournaments: Tournament[] = [
 {id:'blast-world',name:'BLAST Premier World Final',shortName:'BLAST',startsAt:'2026-11-11T10:00:00Z',endsAt:'2026-11-17T22:00:00Z',status:'ongoing',location:'Абу-Даби, ОАЭ',prizePool:'$1,000,000',tier:1},
 {id:'iem-cologne',name:'IEM Cologne 2026',shortName:'IEM',startsAt:'2026-11-20T10:00:00Z',endsAt:'2026-11-29T22:00:00Z',status:'upcoming',location:'Кёльн, Германия',prizePool:'$1,250,000',tier:1},
 {id:'pgl-major',name:'PGL Major Copenhagen',shortName:'PGL',startsAt:'2026-10-20T10:00:00Z',endsAt:'2026-11-10T22:00:00Z',status:'finished',location:'Копенгаген, Дания',prizePool:'$1,250,000',tier:1}
];
const rosters: Record<string,string[]> = {navi:['b1t','Aleksib','iM','w0nderful','jL'],vitality:['ZywOo','apEX','flameZ','ropz','mezii'],spirit:['donk','sh1ro','Chopper','zont1x','magixx'],g2:['m0NESY','huNter-','malbsMd','Snax','NiKo'],faze:['karrigan','rain','broky','frozen','EliGE'],mouz:['torzsi','xertioN','Jimpphat','Brollan','Spinx']};
function match(id:string,a:number,b:number,date:string,status:Match['status'],tournamentId='blast-world',score?:[number,number]):Match {
 const team1=teams[a],team2=teams[b];
 return {id,team1,team2,tournamentId,startsAt:date,finishedAt:status==='finished'?date:undefined,format:'BO3',status,statusSource:'mock-confirmed',score,stage:'Плей-офф · Полуфинал',maps:score?[{name:'Mirage',team1Score:13,team2Score:8},{name:'Ancient',team1Score:10,team2Score:13},{name:'Nuke',team1Score:score[0]>score[1]?13:9,team2Score:score[0]>score[1]?9:13}]:[],players:score?[team1,team2].flatMap((team,t)=>(rosters[team.id]??['Player 1','Player 2','Player 3','Player 4','Player 5']).map((player,i)=>({player,teamId:team.id,kills:58-i*5+t*2,deaths:38+i*3,assists:12+i,adr:Math.round((94.8-i*7.3+t*2)*10)/10}))):[]};
}
export const matches:Match[]=[
 match('navi-vitality',0,1,'2026-11-14T13:00:00Z','live'),
 match('spirit-g2',2,3,'2026-11-14T16:00:00Z','upcoming'),
 match('faze-mouz',4,5,'2026-11-14T18:30:00Z','upcoming'),
 match('falcons-furia',6,7,'2026-11-14T21:00:00Z','upcoming'),
 match('navi-spirit',0,2,'2026-11-15T14:00:00Z','upcoming'),
 match('g2-faze',3,4,'2026-11-16T17:00:00Z','postponed'),
 match('vitality-mouz',1,5,'2026-11-13T19:00:00Z','finished','blast-world',[2,1]),
 match('spirit-faze',2,4,'2026-11-13T16:00:00Z','finished','blast-world',[2,1]),
 match('g2-navi',3,0,'2026-11-12T17:00:00Z','finished','blast-world',[1,2]),
 match('major-final',0,1,'2026-11-10T18:00:00Z','finished','pgl-major',[2,1]),
 match('cologne-opener',4,6,'2026-11-20T13:00:00Z','upcoming','iem-cologne'),
 match('cancelled-demo',7,5,'2026-11-16T19:00:00Z','cancelled')
];
