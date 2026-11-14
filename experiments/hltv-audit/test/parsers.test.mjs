import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {pkg,fixture,offline,onePage,statsPages,networkAttempts} from './offline-helper.mjs';
afterEach(()=>assert.deepEqual(networkAttempts,[],'no network attempted'));
const matchesHTML=fixture('legacy-matches.html');
const resultsHTML=fixture('legacy-results.html');
const matchHTML=fixture('legacy-match.html');
const statsHTML=fixture('legacy-stats.html');
const emptyHTML=fixture('empty.html');

test('Node ESM: named constructor works; native default is a CJS wrapper',()=>{
 assert.equal(typeof pkg.Hltv,'function');assert.equal(typeof pkg.HLTV.getMatch,'function');
 assert.equal(typeof pkg.default.getMatches,'undefined');
 assert.equal(typeof pkg.default.default.getMatches,'function');
});

test('getMatches: schedule, LIVE, team/event IDs, date and format',async()=>{
 const {client,calls}=onePage(matchesHTML);const list=await client.getMatches({eventIds:[100],teamIds:[1]});
 assert.equal(calls.length,1);assert.equal(new URL(calls[0]).searchParams.get('event'),'100');
 assert.equal(new URL(calls[0]).searchParams.get('team'),'1');
 assert.equal(list.length,2);const upcoming=list.find(m=>m.id===1000),live=list.find(m=>m.id===1001);
 assert.equal(upcoming.team1.id,1);assert.equal(upcoming.team2.name,'Bravo');assert.equal(upcoming.date,1794661200000);
 assert.equal(upcoming.event.id,100);assert.equal(upcoming.format,'bo3');assert.equal(upcoming.live,false);
 assert.equal(live.live,true);assert.equal('score' in live,false);
});
test('getMatches: missing event directory silently removes event identity',async()=>{
 const html=matchesHTML.replace(/<div class="event-filter-popup">.*?<\/div>/s,'');
 const list=await onePage(html).client.getMatches();assert.equal(list[0].event,undefined);
});
test('getMatches: changed card selector silently returns incomplete list',async()=>{
 const html=matchesHTML.replace('class="upcomingMatch"','class="upcoming-match"');
 const list=await onePage(html).client.getMatches();assert.equal(list.length,1);assert.equal(list[0].id,1001);
});
test('getMatches: LIVE with surrounding whitespace is not recognized',async()=>{
 const list=await onePage(matchesHTML.replace('>LIVE<','> LIVE <')).client.getMatches();
 assert.equal(list.find(m=>m.id===1001).live,false);
});
test('getMatches: arbitrary HTML is accepted as a valid empty schedule',async()=>{
 assert.deepEqual(await onePage('<h1>Maintenance</h1>').client.getMatches(),[]);
});
function resultsPages(html=resultsHTML){return offline([[u=>u.pathname==='/results'&&u.searchParams.get('offset')==='0',html],[u=>u.pathname==='/results'&&u.searchParams.get('offset')==='100',emptyHTML]],{maxCalls:2})}
test('getResults: scores, filters and terminal empty page',async()=>{
 const {client,calls}=resultsPages();const rows=await client.getResults({eventIds:[100],startDate:'2026-11-14',endDate:'2026-11-14'});
 assert.equal(calls.length,2);assert.equal(new URL(calls[0]).searchParams.get('startDate'),'2026-11-14');
 assert.equal(rows.length,1);assert.deepEqual(rows[0].result,{team1:2,team2:1});assert.equal(rows[0].format,'bo3');
 assert.equal(rows[0].date,1794661200000);assert.equal(rows[0].team1.name,'Alpha');
 assert.equal(rows[0].team1.id,undefined);assert.equal(rows[0].event,undefined);
});
test('getResults: BO1 map shorthand is recognized',async()=>{
 const [row]=await resultsPages(resultsHTML.replace('>bo3<','>mrg<')).client.getResults({});
 assert.equal(row.format,'bo1');assert.equal(row.map,'de_mirage');
});
test('getResults: Anubis shorthand falls through to default despite enum support',async()=>{
 const [row]=await resultsPages(resultsHTML.replace('>bo3<','>anb<')).client.getResults({});
 assert.equal(pkg.GameMap.Anubis,'de_anubis');assert.equal(row.map,'default');
});
test('getResults: changed score delimiter produces NaN and undefined',async()=>{
 const [row]=await resultsPages(resultsHTML.replace('2 - 1','2 : 1')).client.getResults({});
 assert(Number.isNaN(row.result.team1));assert.equal(row.result.team2,undefined);
});
test('getResults: has no built-in page cap; offline budget prevents unbounded pagination',async()=>{
 const {client,calls}=offline([[u=>u.pathname==='/results',resultsHTML]],{maxCalls:3});
 await assert.rejects(client.getResults({}),/fixture page budget exceeded/);assert.equal(calls.length,3);
});
test('getMatch: separate match/stats/map IDs, BO3, map rounds and winner',async()=>{
 const {client,calls}=onePage(matchHTML);const m=await client.getMatch({id:1000});
 assert.equal(calls.length,1);assert.equal(m.id,1000);assert.equal(m.statsId,2000);assert.equal(m.maps[0].statsId,3000);
 assert.equal(m.team1.id,1);assert.equal(m.event.id,100);assert.equal(m.status,'Over');
 assert.equal(m.format.type,'bo3');assert.equal(m.winnerTeam.id,1);assert.equal(m.maps.length,3);
 assert.equal(m.maps[0].name,'de_mirage');assert.equal(m.maps[0].result.team1TotalRounds,13);assert.equal(m.maps[0].result.team2TotalRounds,8);
});
for(const [text,status] of [['LIVE','Live'],['Match postponed','Postponed'],['Match deleted','Deleted'],['Match over','Over']]){
 test(`getMatch: explicit ${text} -> ${status}`,async()=>{
  const m=await onePage(matchHTML.replace('>Match over<',`>${text}<`)).client.getMatch({id:1000});assert.equal(m.status,status);
 });
}
test('getMatch: unknown status falls back to Scheduled; no validation',async()=>{
 const m=await onePage(matchHTML.replace('>Match over<','>Match cancelled<')).client.getMatch({id:1000});assert.equal(m.status,'Scheduled');
});
test('getMatch: empty HTML throws on missing event href',async()=>{
 await assert.rejects(onePage(emptyHTML).client.getMatch({id:1000}),TypeError);
});
test('getMatch: unplayed blank map scores remain absent, not fictional 0:0',async()=>{
 const html=matchHTML.replace(/(<span class="results-team-score">)\d+/g,'$1');
 const m=await onePage(html).client.getMatch({id:1000});assert.equal(m.maps[0].result,undefined);
});
test('getMatchStats: K/D/A, ADR and metadata; exactly two fixture loads',async()=>{
 const {client,calls}=statsPages();const m=await client.getMatchStats({id:2000});const p=m.playerStats.team1[0];
 assert.equal(calls.length,2);assert.equal(m.id,2000);assert.equal(m.matchId,1000);assert.deepEqual(m.mapStatIds,[3000]);
 assert.deepEqual(m.result,{team1MapsWon:2,team2MapsWon:1});assert.equal(m.event.id,100);
 assert.deepEqual([p.kills,p.deaths,p.assists,p.ADR],[58,40,12,92.4]);assert.equal(p.flashAssists,3);
 assert.equal(p.killsPerRound,0.85);assert.equal(m.playerStats.team2[0].player.id,22);
});
test('Rating label in title attribute is ignored and numeric value is assigned to rating1',async()=>{
 const m=await statsPages().client.getMatchStats({id:2000});const p=m.playerStats.team1[0];assert.equal(p.rating1,1.32);assert.equal(p.rating2,undefined);
});
for(const version of ['1.0','2.0','2.1','3.0']){
 test(`Rating ${version} in .ratingDesc text: numeric parsing breaks`,async()=>{
  const html=statsHTML.replaceAll('title="Rating 2.0"></span>',`title="Rating ${version}">${version}</span>`);
  const m=await statsPages(html).client.getMatchStats({id:2000});const p=m.playerStats.team1[0];
  assert.equal(p.rating1,undefined);assert.equal(p.rating2,undefined);assert.equal(p.rating3,undefined);
  assert.equal(Object.hasOwn(p,version==='2.0'?'rating2':'rating1'),true);
 });
}
test('Rating 3.0 in title: numeric value survives but is mislabeled rating1',async()=>{
 const m=await statsPages(statsHTML.replaceAll('Rating 2.0','Rating 3.0')).client.getMatchStats({id:2000});
 assert.equal(m.playerStats.team1[0].rating1,1.32);assert.equal(m.playerStats.team1[0].rating3,undefined);
});
test('missing ADR is undefined (not zero)',async()=>{
 const m=await statsPages(statsHTML.replace('<td class="st-adr">92.4</td>','')).client.getMatchStats({id:2000});assert.equal(m.playerStats.team1[0].ADR,undefined);
});
test('missing required kills contradicts declared number type at runtime',async()=>{
 const html=statsHTML.replace(/<td class="st-kills">58.*?<\/td>/,'');
 const m=await statsPages(html).client.getMatchStats({id:2000});assert.equal(m.playerStats.team1[0].kills,undefined);
});
test('changed stats table selector silently discards both teams',async()=>{
 const html=statsHTML.replaceAll('stats-table totalstats','match-player-table');
 const m=await statsPages(html).client.getMatchStats({id:2000});assert.deepEqual(m.playerStats,{team1:[],team2:[]});
});
test('missing second stats table duplicates first team into both sides',async()=>{
 const html=statsHTML.replace(/<table class="stats-table totalstats">[\s\S]*?<\/table>/, '');
 const m=await statsPages(html).client.getMatchStats({id:2000});
 assert.equal(m.playerStats.team1[0].player.id,22);
 assert.deepEqual(m.playerStats.team1,m.playerStats.team2);
});
test('missing performance highlights still permits base stats',async()=>{
 const m=await statsPages(statsHTML,emptyHTML).client.getMatchStats({id:2000});assert.equal(m.playerStats.team1[0].kills,58);assert.equal(m.playerStats.team1[0].impact,undefined);
});
test('changed performance graph throws and loses otherwise valid base stats',async()=>{
 const html=fixture('legacy-performance.html').replace('Impact rating: 1.40','Round swing: 4.0');
 await assert.rejects(statsPages(statsHTML,html).client.getMatchStats({id:2000}),TypeError);
});
test('missing event href throws instead of partial stats',async()=>{
 const html=statsHTML.replace('href="/stats?event=100"','');await assert.rejects(statsPages(html).client.getMatchStats({id:2000}),TypeError);
});
for(const method of ['getMatches','getResults','getMatch','getMatchStats']){
 test(`${method}: known access-denied HTML is rejected locally`,async()=>{
  const {client}=offline([[()=>true,'<html><body>Sorry, you have been blocked</body></html>']],{maxCalls:2});
  await assert.rejects(client[method](method==='getMatch'||method==='getMatchStats'?{id:2000}:{}),/Access denied/);
 });
}
test('getMatches: unknown challenge HTML can be mistaken for empty schedule',async()=>{
 assert.deepEqual(await onePage('<html><title>Just a moment...</title><script src="/cdn-cgi/challenge-platform/a.js"></script></html>').client.getMatches(),[]);
});
test('unmapped fixtures fail closed without network fallback',async()=>{
 const {client}=offline([]);await assert.rejects(client.getMatches(),/fixture missing/);
});
