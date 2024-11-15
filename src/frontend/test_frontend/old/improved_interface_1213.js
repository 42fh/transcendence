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
        // Set initial form values
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
            const toggleText = document.getElementById('toggleText');
            const toggleIcon = document.getElementById('toggleIcon');
            
            advancedSettings.style.display = this.showSettings ? 'block' : 'none';
            toggleText.textContent = this.showSettings ? 'Hide Settings' : 'Show Settings';
            toggleIcon.textContent = this.showSettings ? '▼' : '▶';
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

    updateGameTypeFields() {
        const polygonFields = document.querySelectorAll('.polygon-only');
        polygonFields.forEach(field => {
            field.style.display = this.gameType === 'polygon' ? 'block' : 'none';
        });
    }

    generateRandomId() {
        return Math.random().toString(36).substring(2, 15);
    }

    logEvent(message, type = 'info') {
        const eventLog = document.getElementById('eventLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="log-message ${type}">${message}</span>
        `;
        eventLog.appendChild(entry);
        eventLog.scrollTop = eventLog.scrollHeight;
    }

    updateGameInfo(config) {
        const gameInfo = document.getElementById('gameInfo');
        gameInfo.innerHTML = `
            <div class="game-info-item">
                <span class="game-info-label">Game ID:</span>
                <span>${config.gameId}</span>
            </div>
            <div class="game-info-item">
                <span class="game-info-label">Player ID:</span>
                <span>${config.playerId}</span>
            </div>
            <div class="game-info-item">
                <span class="game-info-label">Game Type:</span>
                <span>${config.type}</span>
            </div>
            <div class="game-info-item">
                <span class="game-info-label">Players:</span>
                <span>${config.players}</span>
            </div>
            ${config.sides ? `
            <div class="game-info-item">
                <span class="game-info-label">Sides:</span>
                <span>${config.sides}</span>
            </div>
            ` : ''}
            <div class="game-info-item">
                <span class="game-info-label">Balls:</span>
                <span>${config.balls}</span>
            </div>
        `;
    }

    showStatus(message, isError = false) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${isError ? 'error' : 'success'}`;
        status.style.display = 'block';

        if (isError) {
            const errorLog = document.getElementById('errorLog');
            const errorEntry = document.createElement('div');
            errorEntry.className = 'log-entry error';
            errorEntry.innerHTML = `
                <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="log-message">${message}</span>
            `;
            errorLog.appendChild(errorEntry);
            errorLog.scrollTop = errorLog.scrollHeight;
        }
    }

    async startGame() {
        const gameId = document.getElementById('gameId').value || this.generateRandomId();
        const playerId = document.getElementById('playerId').value || this.generateRandomId();
        const gameType = document.getElementById('gameType').value;
        const numPlayers = parseInt(document.getElementById('numPlayers').value);
        const numSides = parseInt(document.getElementById('numSides').value);
        const numBalls = parseInt(document.getElementById('numBalls').value);
        const shape = document.getElementById('shape').value;
        const scoreMode = document.getElementById('scoreMode').value;
        const debug = document.getElementById('debugMode').checked;

        try {
            this.controller = new GameController();

            const config = {
                gameId,
                playerId,
                type: gameType,
                players: numPlayers,
                balls: numBalls,
                debug,
                sides: gameType === 'polygon' ? numSides : undefined,
                shape: gameType === 'irregular' ? shape : undefined,
                scoreMode
            };

            const success = await this.controller.directConnect(gameId, {
                ...config,
                onMessage: (data) => {
                    this.logEvent(JSON.stringify(data));
                }
            });

            if (success) {
                // Hide setup and show game
                document.getElementById('setupContainer').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                this.updateGameInfo(config);
                this.logEvent('Game started successfully');
                this.showStatus(`Connected to game ${gameId} as player ${playerId}`);
                
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
        if (this.controller.gameState) {
            const stateObserver = {
                updateState: (newState) => {
                    if (this.debugEnabled) {
                        this.logEvent(`State update: ${JSON.stringify(newState)}`, 'debug');
                    }
                }
            };

            this.controller.gameState.addObserver?.(stateObserver);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PongInterface();
});
