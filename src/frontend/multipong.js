// Constants
const VIEWBOX_SIZE = 300;
const CENTER = VIEWBOX_SIZE / 2;
const SCALE = VIEWBOX_SIZE / 2;

class MultiPongGame {
    constructor() {
        this.gameState = null;
        this.socket = null;
        this.playerId = null;
        this.gameId = null;
        this.playerCount = 3;
        this.ballCount = 1;
    }

    initialize() {
        // Set up game container and SVG
        const gameContainer = document.querySelector('.game-wrapper');
        gameContainer.innerHTML = `
            <svg id="pongSvg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}"></svg>
        `;

        // Set up score display
        this.setupScoreDisplay();

        // Set up game controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Set up setup form
        this.setupForm();
    }

    setupForm() {
        const setupContainer = document.getElementById('setup-container');
        const inputGroups = setupContainer.querySelectorAll('.input-group');

        // Create input fields
        inputGroups[0].innerHTML += '<input type="text" id="player-id" placeholder="Enter Player ID">';
        inputGroups[1].innerHTML += '<input type="text" id="game-id" placeholder="Enter Game ID">';
        inputGroups[2].innerHTML += '<input type="number" id="player-count" min="2" value="3">';
        inputGroups[3].innerHTML += '<input type="number" id="ball-count" min="1" value="1">';

        // Add start button functionality
        const startButton = document.querySelector('#setup-container button');
        startButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.playerId = document.getElementById('player-id').value;
        this.gameId = document.getElementById('game-id').value;
        this.playerCount = parseInt(document.getElementById('player-count').value);
        this.ballCount = parseInt(document.getElementById('ball-count').value);

        if (!this.playerId || !this.gameId) {
            alert('Please enter both Player ID and Game ID');
            return;
        }

        // Hide setup, show game
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        // Initialize WebSocket connection
        this.connectWebSocket();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `ws://localhost:8000/ws/pong/${this.gameId}/?player=${this.playerId}&balls=${this.ballCount}&players=${this.playerCount}`;
        
        this.socket = new WebSocket(wsUrl);
        this.socket.onmessage = (event) => this.handleWebSocketMessage(event);
        this.socket.onopen = () => console.log('WebSocket connected');
        this.socket.onclose = () => console.log('WebSocket disconnected');
    }

    handleWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        
        console.log(data);
        switch (data.type) {
            case 'initial_state':
            case 'game_state':
                this.gameState = data.game_state;
                this.render();
                break;
            case 'game_finished':
                this.gameState = data.game_state;
                this.render();
                this.handleGameOver(data.winner);
                break;
        }
    }

    handleKeyPress(event) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        let direction = null;
        switch (event.key) {
            case 'ArrowLeft':
                direction = 'left';
                break;
            case 'ArrowRight':
                direction = 'right';
                break;
        }

        if (direction) {
            this.socket.send(JSON.stringify({
                action: 'move_paddle',
                direction: direction,
                user_id: this.playerId
            }));
        }
    }

    setupScoreDisplay() {
        const scoreList = document.getElementById('score-list');
        scoreList.innerHTML = '<h3>Scores</h3>';
    }

    updateScoreDisplay() {
        if (!this.gameState) return;
        
        const scoreList = document.getElementById('score-list');
        scoreList.innerHTML = '<h3>Scores</h3>';
        
        this.gameState.scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `Player ${index + 1}: ${score}`;
            scoreList.appendChild(scoreItem);
        });
    }

    handleGameOver(winner) {
        alert(winner === 'you' ? 'You won!' : 'Game Over!');
    }

    // Rendering functions
    render() {
        if (!this.gameState) return;

        const svg = document.getElementById('pongSvg');
        svg.innerHTML = '';

        // Render game elements
        this.renderCircles(svg);
        this.renderPaddles(svg);
        this.renderBalls(svg);
        this.updateScoreDisplay();
    }

    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    getPointOnCircle(angleInDegrees, radius = 1) {
        const angleInRadians = angleInDegrees * (Math.PI / 180);
        return {
            x: CENTER + SCALE * radius * Math.cos(angleInRadians),
            y: CENTER - SCALE * radius * Math.sin(angleInRadians)
        };
    }

    renderCircles(svg) {
        // Outer boundary
        svg.appendChild(this.createSVGElement('circle', {
            cx: CENTER,
            cy: CENTER,
            r: SCALE,
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1'
        }));

        // Inner circles
        const paddleWidth = this.gameState.dimensions.paddle_width;
        svg.appendChild(this.createSVGElement('circle', {
            cx: CENTER,
            cy: CENTER,
            r: SCALE * (1 - paddleWidth),
            fill: 'none',
            stroke: 'gray',
            'stroke-width': '1',
            'stroke-dasharray': '4'
        }));
    }

    generatePaddleShape(centerAngle) {
        const paddleWidth = this.gameState.dimensions.paddle_width;
        const sectorSize = 360 / this.gameState.paddles.length;
        const paddleLength = this.gameState.dimensions.paddle_length;
        const actualPaddleSize = sectorSize * paddleLength;
        const halfSize = actualPaddleSize / 2;
        
        const startAngle = centerAngle - halfSize;
        const endAngle = centerAngle + halfSize;
        
        const outer = 1.0;
        const inner = 1.0 - paddleWidth;

        const points = [];
        
        // Outer arc
        for (let degree = startAngle; degree <= endAngle; degree++) {
            const pt = this.getPointOnCircle(degree, outer);
            points.push(`${pt.x},${pt.y}`);
        }
        
        // Inner arc (reverse direction)
        for (let degree = endAngle; degree >= startAngle; degree--) {
            const pt = this.getPointOnCircle(degree, inner);
            points.push(`${pt.x},${pt.y}`);
        }
        
        return points.join(' ');
    }

   /* renderPaddles(svg) {
        const sectorSize = 360 / this.gameState.paddles.length;
        
        this.gameState.paddles.forEach((paddle, index) => {
            const baseAngle = index * sectorSize;
            const paddlePos = paddle.position; // 0-1 position
            
            // Use same position calculation as game-logic.js
            const offsetAngle = paddlePos * sectorSize; // Maps 0-1 to 0-sectorSize
            const halfSector = sectorSize / 2;
            // Center the movement around base angle by subtracting half sector size
            const finalAngle = baseAngle + (offsetAngle - halfSector);
            
            svg.appendChild(this.createSVGElement('polygon', {
                points: this.generatePaddleShape(finalAngle),
                fill: index === this.playerIndex ? 'rgba(0,255,0,0.3)' : 'rgba(0,0,255,0.3)',
                stroke: index === this.playerIndex ? 'green' : 'blue',
                'stroke-width': '1'
            }));
        });
    }*/
/*renderPaddles(svg) {
    const sectorSize = 360 / this.gameState.paddles.length;
    
    this.gameState.paddles.forEach((paddle, index) => {
        const baseAngle = index * sectorSize;
        const paddleLength = this.gameState.dimensions.paddle_length;
        
        // Calculate actual position taking paddle length into account
        const actualPosition = paddle.position * (1 - paddleLength);
        
        // Map the actual position to angles
        const offsetAngle = actualPosition * sectorSize;
        const finalAngle = baseAngle + offsetAngle;
        
        svg.appendChild(this.createSVGElement('polygon', {
            points: this.generatePaddleShape(finalAngle),
            fill: index === this.playerIndex ? 'rgba(0,255,0,0.3)' : 'rgba(0,0,255,0.3)',
            stroke: index === this.playerIndex ? 'green' : 'blue',
            'stroke-width': '1'
        }));
    });
}*/
renderPaddles(svg) {
    const sectorSize = 360 / this.gameState.paddles.length;
    
    this.gameState.paddles.forEach((paddle, index) => {
        const baseAngle = index * sectorSize;
        const paddleLength = this.gameState.dimensions.paddle_length;
        
        // Calculate actual position taking paddle length into account
        const actualPosition = paddle.position * (1 - paddleLength);
        
        // Map the actual position to angles, keeping the paddle centered in its sector
        const offsetAngle = actualPosition * sectorSize;
        const halfSector = sectorSize / 2;
        // Center the movement around base angle by subtracting half sector size
        const finalAngle = baseAngle + (offsetAngle - halfSector * paddleLength);
        
        svg.appendChild(this.createSVGElement('polygon', {
            points: this.generatePaddleShape(finalAngle),
            fill: index === this.playerIndex ? 'rgba(0,255,0,0.3)' : 'rgba(0,0,255,0.3)',
            stroke: index === this.playerIndex ? 'green' : 'blue',
            'stroke-width': '1'
        }));
    });
}
    renderBalls(svg) {
        this.gameState.balls.forEach(ball => {
            svg.appendChild(this.createSVGElement('circle', {
                cx: CENTER + ball.x * SCALE,
                cy: CENTER - ball.y * SCALE,
                r: ball.size * SCALE,
                fill: 'yellow',
                stroke: 'black',
                'stroke-width': '1'
            }));
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MultiPongGame();
    game.initialize();
});

// Add styles
const styles = `
    .game-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        gap: 20px;
    }

    .game-wrapper {
        width: 100%;
        max-width: 600px;
    }

    #pongSvg {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        background: #f5f5f5;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .score-container {
        width: 100%;
        max-width: 600px;
        padding: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .score-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .score-item {
        padding: 5px 10px;
        background: #f0f0f0;
        border-radius: 4px;
    }

    .setup-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 400px;
        margin: 40px auto;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .input-group input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .setup-container button {
        padding: 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .setup-container button:hover {
        background: #45a049;
    }

    .controls-text {
        text-align: center;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
