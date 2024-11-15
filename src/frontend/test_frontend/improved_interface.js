// improved_interface.js
import { GameController } from './gameController.js';
import { CONFIG } from './config.js';

export class PongInterface {
    constructor() {
        this.controller = null;
        this.debugEnabled = false;
        this.gameType = 'polygon';
        this.showSettings = false;
        this.formData = {
            gameId: '',
            playerId: '',
            numPlayers: 2,
            numSides: 4,
            numBalls: 1,
            shape: 'regular',
            scoreMode: 'classic',
	    pongType: 'classic'	
        };
         // Game type configurations
        this.gameConfigs = {
            classic: {
                type: 'polygon',
                sides: 4,
                maxPlayers: 2,
                description: 'Classic 2-player pong with 2 paddles and 2 walls'
            },
            regular: {
                type: 'polygon',
                sides: 4,
                maxPlayers: 4,
                description: 'Regular polygon with all sides playable'
            },
            circular: {
                type: 'circular',
                sides: 8, // Default number of sides for circular
                maxPlayers: 8,
                description: 'Circular arena with curved paddles and sides'
            },
            irregular: {
                type: 'polygon',
                sides: 6,
                maxPlayers: 6,
                description: 'Irregular polygon shape with customizable sides',
                shapes: {
                    regular: 'Standard polygon',
                    irregular: 'Slightly deformed polygon with balanced sides',
                    star: 'Star-like shape with alternating long and short sides',
                    crazy: 'Extreme deformation with sharp transitions'
                }
            }
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

        // Initialize shape description
        this.updateShapeDescription();
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

        // Shape change handler
        document.getElementById('shape').addEventListener('change', (e) => {
            this.formData.shape = e.target.value;
            this.updateShapeDescription();
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

        // Form input change handlers
        ['gameId', 'playerId', 'numPlayers', 'numSides', 'numBalls', 'shape', 'scoreMode'].forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.formData[fieldId] = e.target.type === 'number' ? 
                        parseInt(e.target.value) : e.target.value;
                });
            }
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
        const config = this.gameConfigs[this.gameType];
        if (!config) return;

        // Update number of players max value
        const numPlayersInput = document.getElementById('numPlayers');
        if (numPlayersInput) {
            numPlayersInput.max = config.maxPlayers;
            if (parseInt(numPlayersInput.value) > config.maxPlayers) {
                numPlayersInput.value = config.maxPlayers;
                this.formData.numPlayers = config.maxPlayers;
            }
        }

        // Update number of sides based on game type
        const numSidesInput = document.getElementById('numSides');
        if (numSidesInput) {
            numSidesInput.value = config.sides;
            numSidesInput.disabled = this.gameType === 'classic';
            // Update min/max based on game type
            if (this.gameType === 'circular') {
                numSidesInput.min = 4;
                numSidesInput.max = 12;
            } else {
                numSidesInput.min = 3;
                numSidesInput.max = 8;
            }
            this.formData.numSides = config.sides;
        }

        // Show/hide shape fields
        const shapeFields = document.querySelectorAll('.shape-fields');
        shapeFields.forEach(field => {
            field.style.display = this.gameType === 'irregular' ? 'block' : 'none';
        });

        // Update sides field visibility
        const sidesField = document.getElementById('sidesField');
        if (sidesField) {
            sidesField.style.display = this.gameType !== 'classic' ? 'block' : 'none';
        }

        this.updateGameDescription();
    }

    updateGameDescription() {
        const descElement = document.getElementById('gameDescription');
        if (!descElement) return;

        const config = this.gameConfigs[this.gameType];
        if (!config) return;

        descElement.innerHTML = `
            <div class="game-description">
                <p>${config.description}</p>
                <ul>
                    <li>Game Type: ${config.type}</li>
                    <li>Number of Sides: ${config.sides} ${this.gameType === 'classic' ? '(2 paddles, 2 walls)' : ''}</li>
                    <li>Maximum Players: ${config.maxPlayers}</li>
                </ul>
            </div>
        `;
    }


    updateShapeDescription() {
        const shapeDescElement = document.getElementById('shapeDescription');
        if (!shapeDescElement) return;

        const descriptions = {
            'regular': '',
            'irregular': 'Slightly deformed polygon with balanced sides',
            'star': 'Star-like shape with alternating long and short sides',
            'crazy': 'Extreme deformation with sharp transitions'
        };

        shapeDescElement.textContent = descriptions[this.formData.shape] || '';
        shapeDescElement.style.display = this.formData.shape === 'regular' ? 'none' : 'block';
    }

    generateRandomId() {
        return Math.random().toString(36).substring(2, 15);
    }

    async startGame() {
	        const config = this.gameConfigs[this.gameType];
        if (!config) {
            this.showStatus('Invalid game type selected', true);
            return;
        }
 const gameId = document.getElementById('gameId').value || this.generateRandomId();
        const playerId = document.getElementById('playerId').value || this.generateRandomId();
        const numPlayers = parseInt(document.getElementById('numPlayers').value);
        const numSides = parseInt(document.getElementById('numSides').value);
        const numBalls = parseInt(document.getElementById('numBalls').value);
        const shape = document.getElementById('shape').value;
        const scoreMode = document.getElementById('scoreMode').value;
        const debug = document.getElementById('debugMode').checked;

// Validation
        if (numPlayers < 2 || numPlayers > config.maxPlayers) {
            this.showStatus(`Number of players must be between 2 and ${config.maxPlayers}`, true);
            return;
        }

        // Validate sides based on game type
        if (this.gameType === 'circular') {
            if (numSides < 4 || numSides > 12) {
                this.showStatus('Circular mode requires between 4 and 12 sides', true);
                return;
            }
        } else if (this.gameType !== 'classic') {
            if (numSides < 3 || numSides > 8) {
                this.showStatus('Number of sides must be between 3 and 8 for polygon modes', true);
                return;
            }
        }

        if (numBalls < 1 || numBalls > 4) {
            this.showStatus('Number of balls must be between 1 and 4', true);
            return;
        }

        try {
            this.controller = new GameController();

            const gameConfig = {
                gameId,
                playerId,
                type: config.type,           // 'polygon' or 'circular'
                pongType: this.gameType,     // actual game variant
                players: numPlayers,
                balls: numBalls,
                debug,
                sides: this.gameType === 'classic' ? 4 : numSides,
                shape: this.gameType === 'irregular' ? shape : undefined,
                scoreMode
            };

            const success = await this.controller.directConnect(gameId, {
                ...gameConfig,
                onMessage: (data) => {
                    this.logEvent(JSON.stringify(data));
                }
            });

            if (success) {
                // Hide setup and show game
                document.getElementById('setupContainer').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                
                this.updateGameInfo(gameConfig);
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
            <div class="game-info-item">
                <span class="game-info-label">Score Mode:</span>
                <span>${config.scoreMode}</span>
            </div>
            ${config.shape ? `
            <div class="game-info-item">
                <span class="game-info-label">Shape:</span>
                <span>${config.shape}</span>
            </div>
            ` : ''}
        `;
    }

    showStatus(message, isError = false) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${isError ? 'error' : 'success'}`;
        status.style.display = 'block';
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
