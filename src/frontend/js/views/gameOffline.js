import { showToast } from "../utils/toast.js";


export async function loadGameOffline(addToHistory = true) {
    let gameCanvas, context;
    let paddle1Y = 200, paddle2Y = 200;
    const paddleHeight = 100, paddleWidth = 10, ballSize = 10;
    let ballX = 250, ballY = 250, ballSpeedX = 2.1, ballSpeedY = 1.4;
    let player1Score = 0, player2Score = 0;
    const winningScore = 5;
    let gameRunning = true;

    function drawGameState() {
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Draw border
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.strokeRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Draw paddles
        context.fillStyle = "white";
        context.fillRect(20, paddle1Y, paddleWidth, paddleHeight);
        context.fillStyle = "white";
        context.fillRect(gameCanvas.width - 20 - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

        // Draw ball
        context.fillStyle = "white";
        context.beginPath();
        context.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
        context.fill();

        // Draw scores
        context.fillStyle = "white";
        context.font = "20px Monospace";
        context.fillText(`P1: ${player1Score}`, 20, 20);
        context.fillText(`P2: ${player2Score}`, gameCanvas.width - 80, 20);
    }

    function moveBall() {
        if (!gameRunning) return;

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Bounce off top and bottom walls
        if (ballY - ballSize <= 0 || ballY + ballSize >= gameCanvas.height) {
            ballSpeedY = -ballSpeedY;

            ballX += 0.1 * ballSpeedX;
            ballY += 0.1 * ballSpeedY;
        }

        // Paddle collision
        if (ballX - ballSize <= 30 && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballX += 0.1 * ballSpeedX;
            ballY += 0.1 * ballSpeedY;
        } else if (ballX + ballSize >= gameCanvas.width - 30 && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballX += 0.1 * ballSpeedX;
            ballY += 0.1 * ballSpeedY;
        }

        // Scoring
        if (ballX < 30) {
            player2Score++;
            resetBall();
        } else if (ballX > gameCanvas.width - 30) {
            player1Score++;
            resetBall();
        }

        // Check for winner
        if (player1Score === winningScore || player2Score === winningScore) {
            gameRunning = false;
            showToast(`${player1Score === winningScore ? "Player 1" : "Player 2"} wins!`, true);
        }
    }

    function resetBall() {
        ballX = gameCanvas.width / 2;
        ballY = gameCanvas.height / 2;
        ballSpeedX = -ballSpeedX;
    }

    function handleKeyDown(event) {
        if (event.key === "a" && paddle1Y > 0) paddle1Y -= 20;
        if (event.key === "s" && paddle1Y < gameCanvas.height - paddleHeight) paddle1Y += 20;
        if (event.key === "k" && paddle2Y > 0) paddle2Y -= 20;
        if (event.key === "l" && paddle2Y < gameCanvas.height - paddleHeight) paddle2Y += 20;
    }

    try {
        if (addToHistory) {
            history.pushState({ view: "game_offlinemode" }, "");
            console.log("history added game_offlinemode");
        }

        const mainContent = document.getElementById("main-content");
        if (!mainContent) throw new Error("Main content element not found");
        mainContent.innerHTML = "";

        const gameOfflineTemplate = document.getElementById("gameoffline-template");
        if (!gameOfflineTemplate) {
          throw new Error("Offline Game template not found");
        }

        const content = document.importNode(gameOfflineTemplate.content, true);
        mainContent.appendChild(content);

        gameCanvas = document.getElementById("game_offlinemode_canvas");
        context = gameCanvas.getContext("2d");

        document.addEventListener("keydown", handleKeyDown);

        function gameLoop() {
            drawGameState();
            moveBall();
            if (gameRunning) requestAnimationFrame(gameLoop);
        }

        function countdownAnimation(countdownDuration, callback) {
            let countdown = countdownDuration;
        
            const countdownInterval = setInterval(() => {
                drawGameState();
                context.fillStyle = "grey";
                context.font = "150px Monospace";    
                context.fillText(`${countdown}`, gameCanvas.width / 2 - 50, gameCanvas.height / 2 );
                countdown--;
        
                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    callback(); // Start the game function after countdown
                }
            }, 1000);
        }

        resetBall();
        countdownAnimation(5, gameLoop);

    } catch (error) {
        console.error("Error loading loadGameOffline page:", error);
        showToast("Failed to load loadGameOffline", true);
    }
}
