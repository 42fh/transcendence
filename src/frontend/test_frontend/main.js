// main.js
import { GameController } from './gameController.js';
import { CONFIG } from './config.js';

class PongTest {
    constructor() {
        this.controller = null;
        this.debugEnabled = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle game type change
        document.getElementById('gameType').addEventListener('change', (e) => {
            const polygonFields = document.querySelectorAll('.polygon-only');
            polygonFields.forEach(field => {
                field.style.display = e.target.value === 'polygon' ? 'block' : 'none';
            });
        });

        // Handle form submission
        document.getElementById('gameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startGame();
        });

        // Handle debug mode toggle
        document.getElementById('debugMode').addEventListener('change', (e) => {
            this.debugEnabled = e.target.checked;
            document.getElementById('debugPanel').style.display = 
                this.debugEnabled ? 'block' : 'none';
        });

        // Setup keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.controller) return;

            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.controller.movePaddle('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.controller.movePaddle('right');
                    break;
            }
        });
    }

    generateRandomId() {
        return Math.random().toString(36).substring(2, 15);
    }

    showStatus(message, isError = false) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${isError ? 'error' : 'success'}`;
        status.style.display = 'block';
    }

    async startGame() {
        const gameId = document.getElementById('gameId').value || this.generateRandomId();
        const playerId = document.getElementById('playerId').value || this.generateRandomId();
        const gameType = document.getElementById('gameType').value;
        const numPlayers = parseInt(document.getElementById('numPlayers').value);
        const numSides = parseInt(document.getElementById('numSides').value);
        const numBalls = parseInt(document.getElementById('numBalls').value);
        const debug = document.getElementById('debugMode').checked;

        try {
            this.controller = new GameController();

            const config = {
                playerId,
                type: gameType,
                players: numPlayers,
                balls: numBalls,
                debug,
		sides: gameType === 'polygon' ? numSides : undefined
            };

            const success = await this.controller.directConnect(gameId, config);

            if (success) {
                this.showStatus(`Connected to game ${gameId} as player ${playerId}`);
                document.getElementById('gameArea').style.display = 'block';
                
                // Setup debug message handler if debug is enabled
                if (debug) {
                    this.setupDebugHandler();
                }
            } else {
                this.showStatus('Failed to connect to game', true);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, true);
            console.error('Game initialization error:', error);
        }
    }

    setupDebugHandler() {
        // Subscribe to game state updates for debug panel
        if (this.controller.gameState) {
            const debugInfo = document.getElementById('debugInfo');
            
            // Create an observer to watch for state changes
            const stateObserver = {
                updateState: (newState) => {
                    if (this.debugEnabled && debugInfo) {
                        debugInfo.textContent = JSON.stringify(newState, null, 2);
                    }
                }
            };

            // Add observer to game state
            this.controller.gameState.addObserver?.(stateObserver);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PongTest();
});
