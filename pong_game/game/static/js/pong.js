
const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const player1ScoreElement = document.getElementById('player1-score');
const player2ScoreElement = document.getElementById('player2-score');
const messageElement = document.getElementById('message');

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10; // Increased ball size from 10 to 20

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

const paddleSpeed = 0.02; // Adjust this value for paddle speed
let paddle2Direction = 0; // 1 for down, -1 for up, 0 for stationary




let gameStarted = false;
let playerNumber;

function initGame() {
    fetch('/api/game/', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            gameId = data.game_id;
            playerNumber = data.player_number;
            socket = new WebSocket(`ws://${window.location.host}/ws/game/${gameId}/`);
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.message) {
                    displayMessage(data.message);
                    if (data.message.includes('The game is starting')) {
                        gameStarted = true;
                        messageElement.style.display = 'none';
                    }
                } else if (data.game_over) {
                    const winnerMessage = `${data.winner} wins!`;
                    displayGameOverMessage(winnerMessage);
                } else if (gameStarted) {
                    updateGameState(data);
                }
            };
            gameLoop();
            
            if (playerNumber === 1) {
                displayMessage("Waiting for another player to join...");
            } else {
                displayMessage("Joining existing game...");
            }
        });
}


// Remove the handleKeyDown and handleKeyUp functions, as both players will now use the mouse

// ... (rest of the JavaScript code remains the same)




function displayMessage(message) {
    messageElement.textContent = message;
    messageElement.style.display = 'block';
}

function gameLoop() {
    if (gameStarted) {
        updatePaddlePositions();
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

// ... (rest of the JavaScript code remains the same)



function updateGameState(newState) {
    Object.assign(gameState, newState);
}


function updatePaddlePositions() {
    // Update the position of the second paddle based on the direction
    gameState.paddle2_y = Math.max(0.1, Math.min(0.9, gameState.paddle2_y + paddle2Direction * paddleSpeed));
    
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ paddle2_y: gameState.paddle2_y }));
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(0, gameState.paddle1_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, gameState.paddle2_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);

    // Draw ball
    ctx.fillStyle = 'red'; // Changed ball color to red
    ctx.beginPath();
    ctx.arc(gameState.ball_x * canvas.width, gameState.ball_y * canvas.height, ballSize, 0, Math.PI * 2);
    ctx.fill();

    // Update score display
    player1ScoreElement.textContent = gameState.player1_score;
    player2ScoreElement.textContent = gameState.player2_score;
}

// Modify the handleMouseMove function to only control the correct paddle
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = (event.clientY - rect.top) / canvas.height;
    const paddleY = Math.max(0.1, Math.min(0.9, mouseY));
    
    if (playerNumber === 1) {
        gameState.paddle1_y = paddleY;
    } else {
        gameState.paddle2_y = paddleY;
    }
    
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ [`paddle${playerNumber}_y`]: paddleY }));
    } else {
        console.error('WebSocket is not open');
    }
}

function handleKeyDown(event) {
    // Move right paddle up and down using arrow keys
    if (event.key === 'ArrowUp') {
        paddle2Direction = -1; // Move up
    } else if (event.key === 'ArrowDown') {
        paddle2Direction = 1; // Move down
    }
}

function handleKeyUp(event) {
    // Stop moving the paddle when the key is released
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        paddle2Direction = 0; // Stop moving
    }
}

function displayGameOverMessage(message) {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over';
    gameOverDiv.innerHTML = `<h1>${message}</h1>`;
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.backgroundColor = '#f8d7da';
    gameOverDiv.style.border = '2px solid #f5c6cb';
    gameOverDiv.style.color = '#721c24';
    document.body.appendChild(gameOverDiv);

    // Close the WebSocket connection
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    // Optionally disable further interactions in the game
    disableGameControls();
}

function disableGameControls() {
    canvas.removeEventListener('mousemove', handleMouseMove);
}

// Set canvas size
canvas.width = 800;
canvas.height = 400;

canvas.addEventListener('mousemove', handleMouseMove);

initGame();

