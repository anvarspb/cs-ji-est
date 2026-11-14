import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const site=path.resolve(root,'../..');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checks=[
 {name:'offline-parser-tests',args:['--test','--test-reporter=tap','test/parsers.test.mjs'],expected:0},
 {name:'typescript-strict',args:['node_modules/typescript/bin/tsc','--project','tsconfig.json'],expected:2},
 {name:'typescript-skip-lib-check',args:['node_modules/typescript/bin/tsc','--project','tsconfig.skip-lib-check.json'],expected:0},
 {name:'typescript-bundler',args:['node_modules/typescript/bin/tsc','--project','tsconfig.bundler.json'],expected:0},
 {name:'typescript-nodenext-default',args:['node_modules/typescript/bin/tsc','--project','tsconfig.nodenext-default.json'],expected:2}
];
fs.mkdirSync(path.join(root,'results'),{recursive:true});
const results=[];
for(const check of checks){
 const r=spawnSync(process.execPath,check.args,{cwd:root,encoding:'utf8',timeout:60_000});
 const output=(r.stdout??'')+(r.stderr??'');
 fs.writeFileSync(path.join(root,'results',`${check.name}.txt`),output);
 const expectedDiagnostics=check.name==='typescript-strict'?((output.match(/error TS\d+/g)||[]).length===2&&output.includes("exported member named 'Root'")):check.name==='typescript-nodenext-default'?((output.match(/error TS2339/g)||[]).length===1&&output.includes('getMatches')):true;
 const pass=r.status===check.expected&&expectedDiagnostics;
 results.push({name:check.name,exitCode:r.status,expectedExitCode:check.expected,pass});
 console.log(`${pass?'PASS':'FAIL'} ${check.name}: exit ${r.status} (expected ${check.expected})`);
 if(!pass)console.log(output);
}
const baseline=JSON.parse(fs.readFileSync(path.join(root,'site-before.json'),'utf8'));
const changed=Object.keys(baseline).filter(p=>!fs.existsSync(path.join(site,p))||digest(path.join(site,p))!==baseline[p]);
results.push({name:'main-site-unchanged',pass:changed.length===0,changed});
console.log(`${changed.length?'FAIL':'PASS'} main-site-unchanged (${Object.keys(baseline).length} hashes)`);
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const report={checkedAt:new Date().toISOString(),node:process.version,typescript:json('node_modules/typescript/package.json').version,hltv:json('node_modules/hltv/package.json').version,hltvDependencies:json('node_modules/hltv/package.json').dependencies,lockSha256:digest(path.join(root,'pnpm-lock.yaml')),fixtureProvenance:'Synthetic, authored locally; no captured HLTV pages',network:'All parser loads use local fixtures; transport guards installed before package import; no HLTV access',checks:results};
fs.writeFileSync(path.join(root,'results/summary.json'),JSON.stringify(report,null,2)+'\n');
if(results.some(r=>!r.pass))process.exitCode=1;
