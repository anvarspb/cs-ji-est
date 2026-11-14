import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import http2 from 'node:http2';
import dgram from 'node:dgram';
import { syncBuiltinESMExports } from 'node:module';

export const networkAttempts=[];
const denied=(method)=>(..._args)=>{networkAttempts.push(method);throw new Error(`OFFLINE: network forbidden (${method})`)};
http.request=denied('http.request');http.get=denied('http.get');
https.request=denied('https.request');https.get=denied('https.get');
net.connect=denied('net.connect');net.createConnection=denied('net.createConnection');
net.Socket.prototype.connect=denied('Socket.connect');tls.connect=denied('tls.connect');
dns.lookup=denied('dns.lookup');dns.resolve=denied('dns.resolve');
dns.promises.lookup=denied('dns.promises.lookup');dns.promises.resolve=denied('dns.promises.resolve');
http2.connect=denied('http2.connect');dgram.Socket.prototype.send=denied('dgram.send');
globalThis.fetch=denied('fetch');globalThis.WebSocket=denied('WebSocket');
syncBuiltinESMExports();
// Import only after all transport guards are installed.
export const pkg=await import('hltv');
export const fixture=name=>fs.readFileSync(new URL(`../fixtures/${name}`,import.meta.url),'utf8');
export function offline(routes,{maxCalls=10}={}){
 const calls=[];
 const client=new pkg.Hltv({loadPage:async url=>{
  if(calls.length>=maxCalls)throw new Error('OFFLINE: fixture page budget exceeded');
  calls.push(url);
  const u=new URL(url);
  if(u.origin!=='https://www.hltv.org')throw new Error('OFFLINE: unexpected origin');
  const route=routes.find(([matches])=>matches(u));
  if(!route)throw new Error(`OFFLINE: fixture missing for ${u.pathname}${u.search}`);
  return typeof route[1]==='function'?route[1](u):route[1];
 }});
 return {client,calls};
}
export const onePage=(html)=>offline([[()=>true,html]],{maxCalls:1});
export function statsPages(html=fixture('legacy-stats.html'),performance=fixture('legacy-performance.html')){
 return offline([
  [u=>u.pathname==='/stats/matches/2000/-',html],
  [u=>u.pathname==='/stats/matches/performance/2000/-',performance]
 ],{maxCalls:2});
}
