// improved_interface.js
import { GameController } from './gameController.js';
import { CONFIG } from './config.js';

export class PongInterface {
    constructor() {
        this.controller = null;
        this.debugEnabled = false;
        this.gameType = 'regular';
        this.showSettings = false;
        this.formData = {
            gameId: '',
            playerId: '',
            numPlayers: 2,
            numSides: 4,
            numBalls: 1,
            shape: 'regular',
            scoreMode: 'classic'
        };
        
        this.setupEventListeners();
        this.initializeInterface();
    }

    initializeInterface() {
        // Initially hide advanced settings
        const advancedSettings = document.getElementById('advancedSettings');
        if (advancedSettings) {
            advancedSettings.style.display = 'none';
        }

        // Set initial values for form inputs
        Object.entries(this.formData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });

        // Initialize game type specific fields
        this.updateGameTypeFields();
    }

    setupEventListeners() {
        // Toggle settings visibility
        document.getElementById('toggleSettings').addEventListener('click', () => {
            this.showSettings = !this.showSettings;
            const advancedSettings = document.getElementById('advancedSettings');
            const toggleButton = document.getElementById('toggleSettings');
            
            advancedSettings.style.display = this.showSettings ? 'block' : 'none';
            toggleButton.textContent = this.showSettings ? 'Hide Settings ▼' : 'Show Settings ▶';
        });

        // Game type change handler
        document.getElementById('gameType').addEventListener('change', (e) => {
            this.gameType = e.target.value;
            this.updateGameTypeFields();
        });

        // Form submission
        document.getElementById('gameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startGame();
        });

        // Debug mode toggle
        document.getElementById('debugMode').addEventListener('change', (e) => {
            this.debugEnabled = e.target.checked;
            document.getElementById('debugPanel').style.display = 
                this.debugEnabled ? 'block' : 'none';
        });

        // Setup keyboard controls for the game
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

    updateGameTypeFields() {
        const polygonFields = document.querySelectorAll('.polygon-only');
        const irregularFields = document.querySelectorAll('.irregular-only');
        
        polygonFields.forEach(field => {
            field.style.display = this.gameType === 'polygon' ? 'block' : 'none';
        });
        
        irregularFields.forEach(field => {
            field.style.display = this.gameType === 'irregular' ? 'block' : 'none';
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

    setupDebugHandler() {
        if (this.controller.gameState) {
            const debugInfo = document.getElementById('debugInfo');
            
            const stateObserver = {
                updateState: (newState) => {
                    if (this.debugEnabled && debugInfo) {
                        debugInfo.textContent = JSON.stringify(newState, null, 2);
                    }
                }
            };

            this.controller.gameState.addObserver?.(stateObserver);
        }
    }

    async startGame() {
        const gameId = document.getElementById('gameId').value || this.generateRandomId();
        const playerId = document.getElementById('playerId').value || this.generateRandomId();
        const gameType = document.getElementById('gameType').value;
        const numPlayers = parseInt(document.getElementById('numPlayers').value);
        const numSides = parseInt(document.getElementById('numSides').value);
        const numBalls = parseInt(document.getElementById('numBalls').value);
        const debug = document.getElementById('debugMode').checked;
        const shape = document.getElementById('shape').value;
        const scoreMode = document.getElementById('scoreMode').value;

        try {
            this.controller = new GameController();

            const config = {
                playerId,
                type: gameType,
                players: numPlayers,
                balls: numBalls,
                debug,
                sides: gameType === 'polygon' ? numSides : undefined,
                shape: gameType === 'irregular' ? shape : undefined,
                scoreMode,
                mode: shape // For backward compatibility with your existing code
            };

            const success = await this.controller.directConnect(gameId, config);

            if (success) {
                this.showStatus(`Connected to game ${gameId} as player ${playerId}`);
                document.getElementById('gameArea').style.display = 'block';
                
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PongInterface();
});
