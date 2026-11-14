'use client';
import {useState} from 'react';
import type {Match} from '@/lib/models';
import {PlayerStatsTable} from './PlayerStatsTable';
export function MatchMaps({match}:{match:Match}){
 const ids=[...new Set([...match.maps.map(m=>m.id??m.name),...match.players.map(p=>p.mapId).filter((id):id is string=>!!id)])];
 const [selection,setSelection]=useState<string|null>(null);const active=selection&&ids.includes(selection)?selection:ids[0];
 if(!ids.length)return <p className="empty">Карты и статистика недоступны</p>;
 return <section className="match-maps" aria-label="Карты и статистика"><div className="map-selector" aria-label="Выбор карты">{ids.map((id,i)=>{const map=match.maps.find(m=>(m.id??m.name)===id);return <button key={id} className={active===id?'selected':''} aria-pressed={active===id} onClick={()=>setSelection(id)}><span>{map?.name??`Карта ${i+1}`}</span>{map?<span className="map-score"><b className={map.team1Score>map.team2Score?'winner':''}>{map.team1Score}</b><span>:</span><b className={map.team2Score>map.team1Score?'winner':''}>{map.team2Score}</b></span>:<span>—</span>}</button>})}</div><div className="stats-grid">{[match.team1,match.team2].map(team=><PlayerStatsTable key={`${active}-${team.id}`} team={team} players={match.players.filter(p=>p.teamId===team.id&&p.mapId===active)}/>)}</div></section>;
}
