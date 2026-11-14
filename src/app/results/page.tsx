import {sectionDataError,SectionDataError} from '@/components/SectionDataError';
import {getMatches,getTournaments} from '@/lib/data';
import {MatchCard} from '@/components/MatchCard';
import {dateLabel} from '@/lib/format';
export const metadata={title:'Результаты'};
export default async function Results(){const [all,tournaments]=await Promise.all([getMatches(),getTournaments()]);const error=await sectionDataError();if(error)return <SectionDataError message={error}/>;const matches=all.filter(m=>m.status==='finished').sort((a,b)=>(b.finishedAt??b.startsAt).localeCompare(a.finishedAt??a.startsAt));const dates=[...new Set(matches.map(m=>(m.finishedAt??m.startsAt).slice(0,10)))];return <><h1 className="sr-only">Результаты</h1>{dates.map(date=><section className="result-group" key={date}><h2>{dateLabel(date)}</h2><div className="match-list">{matches.filter(m=>(m.finishedAt??m.startsAt).startsWith(date)).map(m=><MatchCard key={m.id} match={m} tournament={tournaments.find(t=>t.id===m.tournamentId)}/>)}</div></section>)}{!matches.length&&<p className="empty">Матчей нет</p>}</>}
