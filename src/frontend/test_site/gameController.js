// gameController.js
import { CONFIG } from './config.js';
import { GameAPI } from './api.js';
import { GameState } from './gamestate.js';
import { GameWebSocket } from './websocket.js';
import { PolygonRenderer } from './pong-renderers.js'
import {  CircularRenderer} from './pong-renderers.js'



export class GameController {
    constructor(renderer) {
        this.gameState = new GameState();
        this.renderer = renderer;
        this.websocket = null;
        this.gameId = null;
        this.playerId = null;
    }

    async initializeGame(gameSettings) {
        try {
            // Create game via API
            const { gameId, gameSettings: settings } = await GameAPI.createGame(gameSettings);
            this.gameId = gameId;
            this.gameState.updateSettings(settings);

            // Join game to get player ID
            const { playerId } = await GameAPI.joinGame(gameId, {});
            this.playerId = playerId;

            // Initialize WebSocket connection with game settings
            this.websocket = new GameWebSocket(
                gameId, 
                playerId, 
                this.handleMessage.bind(this),
                {
                    type: gameSettings.type,
                    players: gameSettings.players,
                    balls: gameSettings.balls
                }
            );
            this.websocket.connect();

            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            return false;
        }
    }

    async joinExistingGame(gameId) {
        try {
            // First get game info to know what type of game we're joining
            const gameInfo = await GameAPI.getGameInfo(gameId);
            this.gameState.updateSettings(gameInfo.settings);

            // Join game to get player ID
            const { playerId } = await GameAPI.joinGame(gameId, {});
            this.gameId = gameId;
            this.playerId = playerId;

            // Initialize WebSocket connection
            this.websocket = new GameWebSocket(
                gameId, 
                playerId, 
                this.handleMessage.bind(this),
                { type: gameInfo.settings.type }
            );
            this.websocket.connect();

            return true;
        } catch (error) {
            console.error('Failed to join game:', error);
            return false;
        }
    }

    async directConnect(gameId, config = {}) {
        try {
            this.gameId = gameId;
            this.playerId = config.playerId || 'player-' + Math.random().toString(36).substr(2, 9);

            // Initialize WebSocket connection with all config parameters
            this.websocket = new GameWebSocket(
                gameId,
                this.playerId,
                this.handleMessage.bind(this),
                {
                    type: config.type || 'polygon',
                    players: config.players || 2,
                    balls: config.balls || 1,
                    debug: config.debug ? '1' : '0',
                    ...config.additionalParams
                }
            );
            this.websocket.connect();

            return true;
        } catch (error) {
            console.error('Failed to connect directly:', error);
            return false;
        }
    }

   handleMessage(message) {
        try {
            switch (message.type) {
                case 'initial_state':
                    this.handleInitialState(message);
                    break;

                case 'game_state':
		    console.log(message);
                    this.gameState.updateState(message.game_state);
                    if (this.renderer) {
                        this.renderer.update(message.game_state);
                    }
                    break;

                case 'game_finished':
                    this.handleGameFinished(message);
                    break;

                case 'error':
                    // Simply pass the error message to the renderer
                    if (this.renderer) {
                        this.renderer.showError({
                            message: message.message,
                            type: 'backend',
                            severity: 'error'
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }


    handleInitialState(message) {
        this.gameState.updateState(message.game_state);
        this.gameState.updatePlayerValues(message.player_values);
        
        // Initialize renderer if not already done
        if (!this.renderer && message.game_setup) {
            this.initializeRenderer(message.game_setup.type);
        }
        
        if (this.renderer) {
            this.renderer.playerIndex = message?.player_index;
	    this.renderer.initialize(message.game_state);
        }
    }

    initializeRenderer(gameType) {
        // Factory pattern for renderer creation
        switch (gameType) {
            case CONFIG.GAME_MODES.POLYGON:
                this.renderer = new PolygonRenderer();
                break;
            case CONFIG.GAME_MODES.CIRCULAR:
                this.renderer = new CircularRenderer();
                break;
            default:
                throw new Error(`Unknown game type: ${gameType}`);
        }
    }

    handleGameFinished(message) {
        this.gameState.updateState(message.game_state);
        if (this.renderer) {
            this.renderer.showGameOver(message.winner === 'you');
        }
        this.websocket.disconnect();
    }

    movePaddle(direction) {
        this.websocket?.sendMessage({
            action: 'move_paddle',
            direction,
            user_id: this.playerId
        });
    }
}
