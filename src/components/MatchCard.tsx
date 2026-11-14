import Link from 'next/link';
import type {Match,Tournament} from '@/lib/models';
import {TeamLogo} from './TeamLogo';
import {MatchStatus} from './MatchStatus';
import {MatchScore} from './MatchScore';
import {LocalTime} from './LocalTime';
export function MatchCard({match:m,tournament,hideTournament=false}:{match:Match;tournament?:Tournament;hideTournament?:boolean}){const finished=m.status==='finished';return <Link href={`/match/${m.id}`} className={`${finished?'match-card result-card':'match-card'} ${hideTournament?'without-event':''}`}><div className="match-time"><LocalTime value={m.finishedAt??m.startsAt}/></div><div className="match-teams"><div className={`team side-one ${finished&&m.score&&m.score[0]>m.score[1]?'winner':''}`}><span>{m.team1.name}</span><TeamLogo team={m.team1}/></div>{finished&&m.score?<MatchScore score={m.score}/>:<span className="versus">vs</span>}<div className={`team ${finished&&m.score&&m.score[1]>m.score[0]?'winner':''}`}><TeamLogo team={m.team2}/><span>{m.team2.name}</span></div></div>{!hideTournament&&<span className="match-event">{tournament?.name??'CS2'}</span>}<span className="match-format">{m.format}</span>{!finished&&<div className="row-status"><MatchStatus match={m}/></div>}</Link>}
