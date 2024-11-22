// main-game.js
class GameController {
    constructor() {
        this.gameLogic = GameLogic;
        this.renderer = Renderer;
        this.isInitialized = false;
    }

    initializeControls() {
        // Point controls
        document.getElementById('pointX').addEventListener('input', (e) => {
            this.gameLogic.state.point.x = parseFloat(e.target.value);
            this.updateGame();
        });

        document.getElementById('pointY').addEventListener('input', (e) => {
            this.gameLogic.state.point.y = parseFloat(e.target.value);
            this.updateGame();
        });

        // Game configuration controls
        document.getElementById('sideCount').addEventListener('change', (e) => {
            this.gameLogic.state.sideCount = Math.max(3, parseInt(e.target.value));
            this.gameLogic.initializeGame();
            this.createSideControls();
            this.updateGame();
        });
	document.getElementById('paddleCount').addEventListener('change', (e) => {
            this.gameLogic.state.paddleCount = Math.max(1, parseInt(e.target.value));
            this.gameLogic.initializeGame();
            this.createSideControls();
            this.updateGame();
        });

        document.getElementById('paddleSize').addEventListener('input', (e) => {
            this.gameLogic.state.paddleSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });

        document.getElementById('paddleWidth').addEventListener('input', (e) => {
            this.gameLogic.state.paddleWidth = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });

        document.getElementById('ballSize').addEventListener('input', (e) => {
            this.gameLogic.state.ballSize = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            this.updateGame();
        });
    }

createSideControls() {
    const container = document.getElementById('sideControls');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create legend to show which sides are active
    const legendDiv = document.createElement('div');
    legendDiv.className = 'control-info';
    const activeSides = this.gameLogic.state.activeSides
        .map((isActive, index) => isActive ? (index + 1) : null)
        .filter(index => index !== null);
    legendDiv.textContent = `Active paddle sides: ${activeSides.join(', ')}`;
    container.appendChild(legendDiv);

    // Create controls only for active sides
    for (let i = 0; i < this.gameLogic.state.sideCount; i++) {
        // Skip if this side is not active (is a wall)
        if (!this.gameLogic.state.activeSides[i]) continue;
        
        const div = document.createElement('div');
        div.className = 'control-item';
        
        const paddleLabel = document.createElement('label');
        paddleLabel.textContent = `Paddle ${i + 1} Position: `;
        
        const paddleInput = document.createElement('input');
        paddleInput.type = 'range';
        paddleInput.min = '0';
        paddleInput.max = '1';
        paddleInput.step = '0.01';
        paddleInput.value = this.gameLogic.state.paddleOffsets[i];
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = this.gameLogic.state.paddleOffsets[i].toFixed(2);
        
        paddleInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.gameLogic.state.paddleOffsets[i] = value;
            valueDisplay.textContent = value.toFixed(2);
            this.updateGame();
        });
        
        div.appendChild(paddleLabel);
        div.appendChild(paddleInput);
        div.appendChild(valueDisplay);
        container.appendChild(div);
    }
}



/*
    createSideControls() {
        const container = document.getElementById('sideControls');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create controls for each side
        for (let i = 0; i < this.gameLogic.state.sideCount; i++) {
	    if (!this.gameLogic.state.activeSides[i]) continue;
            const div = document.createElement('div');
            div.className = 'control-item';
            
            // Active side toggle
            const activeLabel = document.createElement('label');
            activeLabel.textContent = `Side ${i + 1} Active: `;
            const activeCheck = document.createElement('input');
            activeCheck.type = 'checkbox';
            activeCheck.checked = this.gameLogic.state.activeSides[i];
            activeCheck.addEventListener('change', (e) => {
                this.gameLogic.state.activeSides[i] = e.target.checked;
                this.updateGame();
            });
            activeLabel.appendChild(activeCheck);
            div.appendChild(activeLabel);

            // Only show paddle position slider if side is active
            const paddleDiv = document.createElement('div');
            paddleDiv.style.display = this.gameLogic.state.activeSides[i] ? 'block' : 'none';
            
            const paddleLabel = document.createElement('label');
            paddleLabel.textContent = `Paddle Position: `;
            
            const paddleInput = document.createElement('input');
            paddleInput.type = 'range';
            paddleInput.min = '0';
            paddleInput.max = '1';
            paddleInput.step = '0.01';
            paddleInput.value = this.gameLogic.state.paddleOffsets[i];
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = this.gameLogic.state.paddleOffsets[i].toFixed(2);
            
            paddleInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.gameLogic.state.paddleOffsets[i] = value;
                valueDisplay.textContent = value.toFixed(2);
                this.updateGame();
            });
            
            activeCheck.addEventListener('change', (e) => {
                paddleDiv.style.display = e.target.checked ? 'block' : 'none';
            });
            
            paddleDiv.appendChild(paddleLabel);
            paddleDiv.appendChild(paddleInput);
            paddleDiv.appendChild(valueDisplay);
            div.appendChild(paddleDiv);
            
            container.appendChild(div);
        }
    }*/

    updateGame() {
        this.renderer.render(this.gameLogic);
    }

    initialize() {
        if (this.isInitialized) return;
        
        this.gameLogic.initializeGame();
        this.initializeControls();
        this.createSideControls();
        this.updateGame();
        
        this.isInitialized = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
    game.initialize();
});
