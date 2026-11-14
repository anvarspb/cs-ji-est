// Offline subprocess transport for integration tests. No default network fallback.
import fs from 'node:fs';
import path from 'node:path';
const dir=process.env.CITO_STATE_DIR;
globalThis.fetch=async(input)=>{
 const url=new URL(input);
 fs.appendFileSync(path.join(dir,'calls.txt'),url.pathname+'\n');
 if(url.pathname==='/api/v1/health')return new Response(JSON.stringify({rateLimit:{monthly:{used:0,resetsAt:new Date(Date.now()+30*86400000).toISOString()}}}));
 if(url.pathname==='/api/v1/cs2/matches/recent')return new Response(JSON.stringify({success:true,data:[],meta:{dataAvailable:true,count:0}}));
 throw new Error('Offline: unexpected endpoint');
};
