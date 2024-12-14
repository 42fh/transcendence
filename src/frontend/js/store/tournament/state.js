// Tournament state

let globalTournaments = null;

export function updateGlobalTournaments(tournaments) {
  globalTournaments = tournaments;
}

export function getGlobalTournaments() {
  return globalTournaments;
}

// Local Tournament State

/**
 * @typedef {Object} Player
 * @property {number} id - Unique identifier for the player
 * @property {string} name - Player's name/alias
 */
const defaultPlayer = {
  id: 0,
  name: "",
};

/**
 * @typedef {Object} Game
 * @property {number} id - Unique identifier for the game
 * @property {Player[]} players - Array of 2 players in the game
 * @property {Player|null} winner - Winner of the game
 * @property {number} roundNumber - Which round this game belongs to
 */
const defaultGame = {
  id: 0,
  players: [],
  winner: null,
  roundNumber: 0,
};

/**
 * @typedef {Object} Round
 * @property {number} roundNumber - Number of the round (1, 2, 3, etc.)
 * @property {Game[]} games - Array of games in this round
 * @property {number} numberOfGames - Total number of games in this round
 */
const defaultRound = {
  roundNumber: 0,
  games: [],
  numberOfGames: 0,
};

export const tournamentState = {
  // Basic tournament info
  tournamentInfo: {
    name: "",
    description: "",
    location: "local",
    type: "",
    playersNumber: 0,
    totalRounds: 0,
    currentRound: 0,
    status: "setup", // setup, in_progress, completed
  },

  currentGame: null,

  // Players array
  players: [], // [player1, player2, ...]

  // Rounds array
  rounds: [], // [[match1, match2, ...], [semifinal1, semifinal2], [final]]
};
