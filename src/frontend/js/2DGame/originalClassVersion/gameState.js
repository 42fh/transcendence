export class GameState {
  constructor() {
    this.players = new Map();
    this.currentState = null;
    this.gameSettings = null;
    this.gameType = null;
    this.playerValues = null;
  }

  updateState(newState) {
    this.currentState = newState;
  }

  updateSettings(settings) {
    this.gameSettings = settings;
    this.gameType = settings.type;
  }

  updatePlayerValues(values) {
    this.playerValues = values;
  }

  updatePlayerPosition(playerId, position) {
    if (this.players.has(playerId)) {
      this.players.get(playerId).position = position;
    }
  }
}
