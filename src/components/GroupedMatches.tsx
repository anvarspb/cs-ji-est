'use client';
import type {Match,Tournament} from '@/lib/models';
import {MatchCard} from './MatchCard';
import {groupMatches} from './match-groups';
import {useLocalClock} from './use-local-clock';
export function GroupedMatches({matches,tournaments,mode='schedule',hideTournament=false}:{matches:Match[];tournaments:Tournament[];mode?:'schedule'|'tournament';hideTournament?:boolean}){const now=useLocalClock();if(now===null)return <p className="empty" role="status">Загрузка…</p>;const groups=groupMatches(matches,now,mode);if(!groups.length)return <p className="empty">{mode==='schedule'?'Предстоящих матчей нет':'Матчей нет'}</p>;return <div className="date-groups">{groups.map(group=><section className="date-group" key={group.key}><h2>{group.label}</h2><div className="match-list">{group.matches.map(match=><MatchCard key={match.id} match={match} tournament={tournaments.find(t=>t.id===match.tournamentId)} hideTournament={hideTournament}/>)}</div></section>)}</div>}
