export interface Team { id: string; name: string; shortName: string; color: string; logo: string }
export interface Tournament { id: string; name: string; shortName: string; startsAt: string; endsAt: string; status: 'upcoming' | 'ongoing' | 'finished'; location: string; prizePool: string; tier: 1 | 2 }
export interface MapResult { id?: string; name: string; team1Score: number; team2Score: number; statsEligible?: boolean }
export interface PlayerMatchStats { playerId?: string; player: string; teamId: string; mapId?: string; kills: number | null; deaths: number | null; assists: number | null; adr: number | null; rating?: number | null; ratingVersion?: string | null }
export type MatchState = 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
export interface Match { id: string; team1: Team; team2: Team; tournamentId: string; startsAt: string; finishedAt?: string; format: 'BO1' | 'BO3' | 'BO5'; status: MatchState; statusSource: 'mock-confirmed' | 'provider-confirmed' | 'time-estimate'; score?: [number, number]; maps: MapResult[]; players: PlayerMatchStats[]; stage: string; pollStoppedAt?: string; statusNote?: string }
