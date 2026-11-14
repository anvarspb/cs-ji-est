import { Hltv, HLTV, MatchFilter, type MatchPreview, type FullMatchStats } from 'hltv';
const offline = new Hltv({ loadPage: async (_url: string): Promise<string> => '<html></html>' });
const matches: Promise<MatchPreview[]> = offline.getMatches({eventIds:[100],teamIds:[1],filter:MatchFilter.TopTier});
const results = offline.getResults({eventIds:[100],startDate:'2026-11-01',endDate:'2026-11-14'});
const match = offline.getMatch({id:1000});
const stats: Promise<FullMatchStats> = offline.getMatchStats({id:2000});
type Player = Awaited<typeof stats>['playerStats']['team1'][number];
function metrics(p:Player) {
  const k:number=p.kills, d:number=p.deaths, a:number=p.assists;
  const adr:number|undefined=p.ADR;
  const oldRating:number|undefined=p.rating2??p.rating1;
  // This expectation intentionally proves the public types have no Rating 3.0 field.
  // @ts-expect-error hltv 3.5.0 does not declare rating3
  const rating3 = p.rating3;
  return {k,d,a,adr,oldRating,rating3};
}
void [HLTV,matches,results,match,stats,metrics];
// Compile-only: never execute this file.
