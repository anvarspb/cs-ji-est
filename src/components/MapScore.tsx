import type { MapResult } from '@/lib/models';
export function MapScore({map,index}:{map:MapResult;index:number}){return <div className={`map-card map-${index}`}><small>КАРТА 0{index+1}</small><h3>{map.name}</h3><div><b className={map.team1Score>map.team2Score?'winner':''}>{map.team1Score}</b><span>:</span><b className={map.team2Score>map.team1Score?'winner':''}>{map.team2Score}</b></div></div>}
