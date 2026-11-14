import type {Match,Tournament} from '@/lib/models';
import {GroupedMatches} from './GroupedMatches';
export function Schedule({matches,tournaments}:{matches:Match[];tournaments:Tournament[]}){return <GroupedMatches matches={matches} tournaments={tournaments}/>}
