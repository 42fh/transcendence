import { showToast } from "../utils/toast.js";

export async function loadGame2D(addToHistory = true) {
    const game2d_game_id = Math.round(Date.now() / 9000);
    const game2d_player_id = Math.random().toString(36).substring(2, 15);
    const ws_uri = `/ws/pong/${game2d_game_id}/?player=${game2d_player_id}&gameId=${game2d_game_id}&playerId=${game2d_player_id}&type=circular&pongType=circular&players=2&balls=1&debug=true&sides=2&shape=undefined&scoreMode=classic`;

    let game_2d_is_running = true;
    let game_2d_websocket = new WebSocket(ws_uri);

    let game2dCanvas, context;

    game_2d_websocket.onopen = () => {
        console.log("game socket opened");
    };

    game_2d_websocket.onmessage = (event) => {
        console.log("game socket message incoming");
        const message = JSON.parse(event.data);

        if (message.type === "game_state") {
            drawGameState(message.game_state);
        }
    };

    game_2d_websocket.onclose = () => {
        console.log("game socket closed");
        game_2d_is_running = false;
    };

    addEventListener("popstate", (event) => {
        if (event.state.view != "game2d") {
            console.log("game2d popstate ev listener called, closing all games");

            try {
                game_2d_websocket.close();
            } catch (error) {
                console.log("WebSocket not open");
                console.log(error);
            }
        }
    });

    function drawGameState(gameState) {
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, game2dCanvas.width, game2dCanvas.height);

        // Draw the ball
        const ball = gameState.balls[0];
        const ballX = (game2dCanvas.width / 2) + (ball.x * game2dCanvas.width / 2);
        const ballY = (game2dCanvas.height / 2) - (ball.y * game2dCanvas.height / 2);
        const ballSize = ball.size * game2dCanvas.width; // Assume size is a fraction of canvas width

        context.beginPath();
        context.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
        context.fillStyle = "red";
        context.fill();
    }

    try {
        if (addToHistory) {
            history.pushState({ view: "game2d" }, "");
            console.log("history added game2d");
        }

        const mainContent = document.getElementById("main-content");
        if (!mainContent) {
            throw new Error("Main content element not found");
        }

        mainContent.innerHTML = '<canvas id="game2d_canvas" height="500" width="500"></canvas>';
        game2dCanvas = document.getElementById("game2d_canvas");
        context = game2dCanvas.getContext("2d");

        console.log("game2d canvas set up");
    } catch (error) {
        console.error("Error loading game2d page:", error);
        showToast("Failed to load game2d", true);
    }
}
