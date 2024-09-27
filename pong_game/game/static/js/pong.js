const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const player1ScoreElement = document.getElementById('player1-score');
const player2ScoreElement = document.getElementById('player2-score');

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 20; // Increased ball size from 10 to 20

let gameId;
let socket;
let gameState = {
    player1_score: 0,
    player2_score: 0,
    ball_x: 0.5,
    ball_y: 0.5,
    paddle1_y: 0.5,
    paddle2_y: 0.5
};

function initGame() {
    fetch('/api/game/', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            gameId = data.game_id;
            socket = new WebSocket(`ws://${window.location.host}/ws/game/${gameId}/`);
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
		console.log("Received gameState update:", data); 
                updateGameState(data);
            };
            gameLoop();
        });
}

function updateGameState(newState) {
    Object.assign(gameState, newState);
}

function gameLoop() {
    drawGame();
	console.log("Received gameState update:")
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(0, gameState.paddle1_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, gameState.paddle2_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);

    console.log(`Ball position: (${gameState.ball_x}, ${gameState.ball_y})`);


    // Draw ball
    ctx.fillStyle = 'red'; // Changed ball color to red
    ctx.beginPath();
    ctx.arc(gameState.ball_x * canvas.width, gameState.ball_y * canvas.height, ballSize, 0, Math.PI * 2);
    ctx.fill();

    // Update score display
    player1ScoreElement.textContent = gameState.player1_score;
    player2ScoreElement.textContent = gameState.player2_score;
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = (event.clientY - rect.top) / canvas.height;
    gameState.paddle1_y = Math.max(0.1, Math.min(0.9, mouseY));
    socket.send(JSON.stringify({ paddle1_y: gameState.paddle1_y }));
}

canvas.addEventListener('mousemove', handleMouseMove);

// Set canvas size
canvas.width = 800;
canvas.height = 400;

initGame();
