// api.js
import { CONFIG } from './config.js';

export class GameAPI {
    static async createGame(gameSettings) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameSettings)
        });
        return response.json();
    }

    static async joinGame(gameId, playerInfo) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/games/${gameId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerInfo)
        });
        return response.json();
    }

    static async getGameInfo(gameId) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/games/${gameId}`);
        return response.json();
    }
}
