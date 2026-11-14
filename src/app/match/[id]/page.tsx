import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getMatch,getTournament} from '@/lib/data';
import {TeamLogo} from '@/components/TeamLogo';
import {MatchStatus} from '@/components/MatchStatus';
import {MatchScore} from '@/components/MatchScore';
import {LocalTime} from '@/components/LocalTime';
import {MatchMaps} from '@/components/MatchMaps';
export default async function MatchPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const match=await getMatch(id);if(!match)notFound();const tournament=await getTournament(match.tournamentId);return <><h1 className="sr-only">{match.team1.name} — {match.team2.name}</h1><section className="match-detail glass"><div className="match-meta"><Link href={`/tournaments?event=${match.tournamentId}#event-matches`}>{tournament?.name??'CS2'}</Link><span><LocalTime value={match.startsAt} date/> · {match.format}</span></div><div className="detail-teams"><div className={match.score&&match.score[0]>match.score[1]?'winner':''}><TeamLogo team={match.team1} large/><h2>{match.team1.name}</h2></div><div className="detail-center">{match.status==='finished'&&match.score?<MatchScore score={match.score}/>:<MatchStatus match={match} showUpcoming/>}</div><div className={match.score&&match.score[1]>match.score[0]?'winner':''}><TeamLogo team={match.team2} large/><h2>{match.team2.name}</h2></div></div></section>{match.status==='finished'&&<MatchMaps match={match}/>}</>}
