// Simple global state - will evolve into proper store later (maybe)
let globalTournaments = null;

export function updateGlobalTournaments(tournaments) {
  globalTournaments = tournaments;
}

export function getGlobalTournaments() {
  return globalTournaments;
}
