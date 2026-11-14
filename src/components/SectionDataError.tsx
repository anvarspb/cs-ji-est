import {getSnapshot} from '@/lib/data';
export async function sectionDataError(){const data=await getSnapshot();if(!data.updatedAt)return 'Не удалось загрузить данные.';if(!data.matches.length&&data.warnings.some(w=>/недоступ|не загруж|ошиб|не удалось|устар|более суток|приостанов/i.test(w)))return 'Данные временно недоступны.';return null;}
export function SectionDataError({message}:{message:string}){return <p className="section-error" role="alert">{message}</p>}
