import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {initialState,HOUR} from '../scripts/cito-core.mjs';
const root=process.cwd();
function run(s){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cs-pulse-test-'));fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify(s));const execute=()=>{const r=spawnSync(process.execPath,['--import',pathToFileURL(path.join(root,'tests/updater-transport.mjs')).href,path.join(root,'scripts/update-cito.mjs')],{cwd:dir,env:{...process.env,CITO_STATE_DIR:dir,CITO_API_KEY:'offline-test-only',CITO_PERSIST_GIT:'0'},encoding:'utf8',timeout:15000});assert.equal(r.status,0,r.stderr);return JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8'));};return {dir,execute,calls:()=>fs.readFileSync(path.join(dir,'calls.txt'),'utf8').trim().split('\n')};}
function state(){const s=initialState(),now=Date.now();s.scheduleAt=new Date(now).toISOString();s.recentAt=new Date(now-2*HOUR).toISOString();s.matches=Array.from({length:10},(_,i)=>({id:`cs2-match-${i}`,team1:{id:'a'},team2:{id:'b'},tournamentId:'cs2-event-8251',startsAt:new Date(now-2*HOUR).toISOString(),status:'upcoming',maps:[],players:[]}));return s;}
test('actual updater makes one recent call for 10 matches and none on replay',()=>{const f=run(state());try{const s=f.execute();assert.equal(s.requests.length,1);f.execute();assert.equal(f.calls().filter(p=>p.endsWith('/recent')).length,1);}finally{assert.equal(path.dirname(path.resolve(f.dir)),path.resolve(os.tmpdir()));assert(path.basename(f.dir).startsWith('cs-pulse-test-'));fs.rmSync(f.dir,{recursive:true,force:true});}});
test('actual updater with 450 reservations makes no data API requests',()=>{const s=state();s.requests=Array.from({length:450},()=>({at:new Date().toISOString(),kind:'test'}));const f=run(s);try{f.execute();assert.deepEqual(f.calls(),['/api/v1/health']);}finally{assert.equal(path.dirname(path.resolve(f.dir)),path.resolve(os.tmpdir()));assert(path.basename(f.dir).startsWith('cs-pulse-test-'));fs.rmSync(f.dir,{recursive:true,force:true});}});
test('successfully saved finished details are not fetched again',()=>{const s=state();s.matches=s.matches.slice(0,1).map(m=>({...m,status:'finished',score:[2,0],finishedAt:new Date().toISOString()}));s.jobs[s.matches[0].id]={maps:{done:true,attempts:1},stats:{done:true,attempts:1}};const f=run(s);try{f.execute();assert.deepEqual(f.calls(),['/api/v1/health']);}finally{assert.equal(path.dirname(path.resolve(f.dir)),path.resolve(os.tmpdir()));assert(path.basename(f.dir).startsWith('cs-pulse-test-'));fs.rmSync(f.dir,{recursive:true,force:true});}});
