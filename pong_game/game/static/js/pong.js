"use client"

const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const player1ScoreElement = document.getElementById('player1-score');
const player2ScoreElement = document.getElementById('player2-score');
const messageElement = document.getElementById('message');

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let gameId;
let socket;
let gameState = {
    player1_score: 0,
    player2_score: 0,
    ball_x: 0.5,
    ball_y: 0.5,
    ball_dx: 0.005,
    ball_dy: 0.005,
    paddle1_y: 0.5,
    paddle2_y: 0.5
};

const paddleSpeed = 0.02;
let paddle2Direction = 0;

let gameStarted = false;
let playerNumber;

let lastUpdateTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;

let lastServerUpdate = null;
let clientPrediction = {
    paddle1_y: 0.5,
    paddle2_y: 0.5
};


let lastBallUpdate = null;
let ballVelocity = { x: 0, y: 0 };






function initGame() {
    fetch('/api/game/', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            gameId = data.game_id;
            playerNumber = data.player_number;
            socket = new WebSocket(`wss://${window.location.host}/ws/game/${gameId}/`);
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
            requestAnimationFrame(gameLoop);
            
            if (playerNumber === 1) {
                displayMessage("Waiting for another player to join...");
            } else {
                displayMessage("Joining existing game...");
            }
        });
}

function displayMessage(message) {
    messageElement.textContent = message;
    messageElement.style.display = 'block';
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const deltaTime = currentTime - lastUpdateTime;
    if (deltaTime < frameDelay) return;

    lastUpdateTime = currentTime - (deltaTime % frameDelay);

    if (gameStarted) {
        updatePaddlePositions();
        updateBallPosition(deltaTime / 1000);
        drawGame();
    }
}

function updateGameState(newState) {
    lastServerUpdate = newState;
    
    // Calculate ball velocity based on server updates
    if (lastBallUpdate) {
        const timeDiff = Date.now() - lastBallUpdate.time;
        ballVelocity = {
            x: (newState.ball_x - lastBallUpdate.x) / timeDiff * 1000,
            y: (newState.ball_y - lastBallUpdate.y) / timeDiff * 1000
        };
    }
    
    lastBallUpdate = {
        x: newState.ball_x,
        y: newState.ball_y,
        time: Date.now()
    };
    
    Object.assign(gameState, newState);
    
    // Update client prediction with server state
    clientPrediction.paddle1_y = newState.paddle1_y;
    clientPrediction.paddle2_y = newState.paddle2_y;
}

function updatePaddlePositions() {
    const paddleToUpdate = playerNumber === 1 ? 'paddle1_y' : 'paddle2_y';
    const newPaddleY = Math.max(0.1, Math.min(0.9, clientPrediction[paddleToUpdate] + paddle2Direction * paddleSpeed));
    
    if (Math.abs(newPaddleY - clientPrediction[paddleToUpdate]) > 0.001) {
        clientPrediction[paddleToUpdate] = newPaddleY;
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ [paddleToUpdate]: newPaddleY }));
        }
    }
}

function updateBallPosition(deltaTime) {
    if (lastBallUpdate) {
        const timeSinceUpdate = (Date.now() - lastBallUpdate.time) / 1000;
        gameState.ball_x = lastBallUpdate.x + ballVelocity.x * timeSinceUpdate;
        gameState.ball_y = lastBallUpdate.y + ballVelocity.y * timeSinceUpdate;
    }
}

function drawGame() {
    const interpolatedState = interpolateGameState(gameState, clientPrediction);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, interpolatedState.paddle1_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, interpolatedState.paddle2_y * canvas.height - paddleHeight / 2, paddleWidth, paddleHeight);

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(interpolatedState.ball_x * canvas.width, interpolatedState.ball_y * canvas.height, ballSize, 0, Math.PI * 2);
    ctx.fill();

    player1ScoreElement.textContent = interpolatedState.player1_score;
    player2ScoreElement.textContent = interpolatedState.player2_score;
    // Add this to your drawGame function
/*	ctx.fillStyle = 'white';
	ctx.font = '12px Arial';
	ctx.fillText(`Ball Velocity: ${ballVelocity.x.toFixed(3)}, ${ballVelocity.y.toFixed(3)}`, 10, 20);
	ctx.fillText(`Last Update: ${Date.now() - lastBallUpdate.time}ms ago`, 10, 40);
*/}

function interpolateGameState(serverState, clientState) {
    const now = Date.now();
    const timeSinceUpdate = (now - lastBallUpdate.time) / 1000;
    
    return {
        ball_x: lastBallUpdate.x + ballVelocity.x * timeSinceUpdate,
        ball_y: lastBallUpdate.y + ballVelocity.y * timeSinceUpdate,
        paddle1_y: serverState.paddle1_y + (clientState.paddle1_y - serverState.paddle1_y) * 0.3,
        paddle2_y: serverState.paddle2_y + (clientState.paddle2_y - serverState.paddle2_y) * 0.3,
        player1_score: serverState.player1_score,
        player2_score: serverState.player2_score
    };
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = (event.clientY - rect.top) / canvas.height;
    const paddleY = Math.max(0.1, Math.min(0.9, mouseY));
    
    if (playerNumber === 1) {
        clientPrediction.paddle1_y = paddleY;
    } else {
        clientPrediction.paddle2_y = paddleY;
    }
    
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ [`paddle${playerNumber}_y`]: paddleY }));
    } else {
        console.error('WebSocket is not open');
    }
}

function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
        paddle2Direction = -1;
    } else if (event.key === 'ArrowDown') {
        paddle2Direction = 1;
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        paddle2Direction = 0;
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

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    disableGameControls();
}

function disableGameControls() {
    canvas.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

canvas.width = 800;
canvas.height = 400;

canvas.addEventListener('mousemove', handleMouseMove);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

initGame();
