import {getMatches,getTournaments} from '@/lib/data';
import {TournamentCard} from '@/components/TournamentCard';
import {sectionDataError,SectionDataError} from '@/components/SectionDataError';
export const metadata={title:'Турниры'};
export default async function Tournaments(){const [tournaments,matches,error]=await Promise.all([getTournaments(),getMatches(),sectionDataError()]);return <><h1 className="sr-only">Турниры</h1>{error?<SectionDataError message={error}/>:<div className="tournament-accordions">{tournaments.map(t=><TournamentCard key={t.id} tournament={t} matches={matches.filter(m=>m.tournamentId===t.id)}/>)}</div>}{!error&&!tournaments.length&&<p className="empty">Турниров нет</p>}</>}
