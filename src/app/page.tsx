import {getMatches,getTournaments} from '@/lib/data';
import {Schedule} from '@/components/Schedule';
import {sectionDataError,SectionDataError} from '@/components/SectionDataError';
export default async function Home(){const [matches,tournaments,error]=await Promise.all([getMatches(),getTournaments(),sectionDataError()]);return <><h1 className="sr-only">Расписание</h1>{error?<SectionDataError message={error}/>:<Schedule matches={matches} tournaments={tournaments}/>}</>}
