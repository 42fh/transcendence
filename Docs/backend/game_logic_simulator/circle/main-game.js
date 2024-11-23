class GameController {
    constructor() {
        this.gameLogic = GameLogic;
        this.renderer = Renderer;
        this.isInitialized = false;
    }

    initializeControls() {
        // Point controls
        document.getElementById('pointX').addEventListener('change', (e) => {
            this.gameLogic.state.point.x = parseFloat(e.target.value);
            this.updateGame();
        });

        document.getElementById('pointY').addEventListener('change', (e) => {
            this.gameLogic.state.point.y = parseFloat(e.target.value);
            this.updateGame();
        });

        // Game configuration controls
        document.getElementById('sectorCount').addEventListener('change', (e) => {
            this.gameLogic.state.sectorCount = Math.max(2, parseInt(e.target.value));
            this.gameLogic.initializeGame();
            this.createOffsetControls();
            this.updateGame();
        });

        document.getElementById('paddleSize').addEventListener('change', (e) => {
            this.gameLogic.state.paddleSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });

        document.getElementById('paddleWidth').addEventListener('change', (e) => {
            this.gameLogic.state.paddleWidth = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });

        document.getElementById('ballSize').addEventListener('change', (e) => {
            this.gameLogic.state.ballSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });
    }

    createOffsetControls() {
        const container = document.getElementById('offsetControls');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Add constraint toggle
        const constraintDiv = document.createElement('div');
        constraintDiv.className = 'control-group';
        
        const constraintLabel = document.createElement('label');
        constraintLabel.textContent = 'Constrain to Sector: ';
        
        const constraintCheck = document.createElement('input');
        constraintCheck.type = 'checkbox';
        constraintCheck.checked = this.gameLogic.state.constrainToSector;
        constraintCheck.addEventListener('change', (e) => {
            this.gameLogic.state.constrainToSector = e.target.checked;
            this.updateGame();
        });
        
        constraintDiv.appendChild(constraintLabel);
        constraintDiv.appendChild(constraintCheck);
        container.appendChild(constraintDiv);
        
        // Create paddle offset controls
        for (let i = 0; i < this.gameLogic.state.sectorCount; i++) {
            const div = document.createElement('div');
            div.className = 'control-group';
            
            const label = document.createElement('label');
            label.textContent = `Paddle ${i + 1} Offset: `;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = '0';
            input.max = '1';
            input.value = this.gameLogic.state.paddleOffsets[i];
            input.step = '0.01';
            input.id = `paddleOffset${i}`;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = this.gameLogic.state.paddleOffsets[i].toFixed(2);
            
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.gameLogic.state.paddleOffsets[i] = value;
                valueDisplay.textContent = value.toFixed(2);
                this.updateGame();
            });
            
            div.appendChild(label);
            div.appendChild(input);
            div.appendChild(valueDisplay);
            container.appendChild(div);
        }
    }

    updateGame() {
        const scoreUpdated = this.gameLogic.updateGameState();
        this.renderer.render(this.gameLogic);
        
        if (scoreUpdated) {
            console.log('Score updated:', this.gameLogic.state.scores);
        }
    }

    initialize() {
        if (this.isInitialized) return;
        
        // Initialize game state
        this.gameLogic.initializeGame();
        
        // Set up controls
        this.initializeControls();
        this.createOffsetControls();
        
        // Initial render
        this.updateGame();
        
        this.isInitialized = true;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
    game.initialize();
});
