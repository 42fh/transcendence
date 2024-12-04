import { showToast } from "../utils/toast.js";

export async function loadgame_offlinemode(addToHistory = true) {
    let gameCanvas, context;
    let paddle1Y = 200, paddle2Y = 200;
    const paddleHeight = 100, paddleWidth = 10, ballSize = 10;
    let ballX = 250, ballY = 250, ballSpeedX = 3, ballSpeedY = 2;
    let player1Score = 0, player2Score = 0;
    const winningScore = 3;
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
        context.fillRect(10, paddle1Y, paddleWidth, paddleHeight);
        context.fillStyle = "white";
        context.fillRect(gameCanvas.width - 20, paddle2Y, paddleWidth, paddleHeight);

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
        if (ballY <= 0 || ballY >= gameCanvas.height) {
            ballSpeedY = -ballSpeedY;
        }

        // Paddle collision
        if (ballX <= 20 && ballY >= paddle1Y && ballY <= paddle1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else if (ballX >= gameCanvas.width - 20 && ballY >= paddle2Y && ballY <= paddle2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }

        // Scoring
        if (ballX <= 0) {
            player2Score++;
            resetBall();
        } else if (ballX >= gameCanvas.width) {
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

        mainContent.innerHTML = '<canvas id="game_offlinemode_canvas" height="500" width="500"></canvas>';
        gameCanvas = document.getElementById("game_offlinemode_canvas");
        context = gameCanvas.getContext("2d");

        document.addEventListener("keydown", handleKeyDown);

        function gameLoop() {
            drawGameState();
            moveBall();
            if (gameRunning) requestAnimationFrame(gameLoop);
        }

        resetBall();
        gameLoop();
    } catch (error) {
        console.error("Error loading game_offlinemode page:", error);
        showToast("Failed to load game_offlinemode", true);
    }
}
