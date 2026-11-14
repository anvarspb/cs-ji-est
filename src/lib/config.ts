import competitions from '../../config/competitions.json';
export const allowedTournamentIds=competitions.events.map(event=>event.id);
// Teams are admitted by participation in an approved event, not by name.
export const allowedTeamIds:string[]=[];
