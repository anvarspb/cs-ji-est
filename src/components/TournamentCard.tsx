'use client';
import {useState,useId} from 'react';
import {ChevronDown} from 'lucide-react';
import type {Match,Tournament} from '@/lib/models';
import {dateLabel} from '@/lib/format';
import {GroupedMatches} from './GroupedMatches';
export function TournamentCard({tournament:t,matches}:{tournament:Tournament;matches:Match[]}){const [open,setOpen]=useState(false);const panelId=useId();return <article className={`tournament-accordion ${open?'open':''}`}><button className="tournament-card tournament-toggle" aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(!open)}><span className="tournament-logo" role="img" aria-label={`Эмблема ${t.shortName}`}>{t.shortName}</span><span className="tournament-body"><span className="tournament-name">{t.name}</span><span className="tournament-dates">{dateLabel(t.startsAt)} — {dateLabel(t.endsAt)}</span><span className="tournament-tags"><span className={`status ${t.status}`}>{({ongoing:'Идёт',upcoming:'Скоро',finished:'Завершён'})[t.status]}</span><span className="tier">Tier {t.tier}</span></span></span><ChevronDown size={18} className="disclosure-arrow" aria-hidden="true"/></button><div id={panelId} className="tournament-disclosure" aria-hidden={!open} inert={!open}><div className="disclosure-inner"><GroupedMatches matches={matches} tournaments={[t]} mode="tournament" hideTournament/></div></div></article>}
