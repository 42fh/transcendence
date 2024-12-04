import { showToast } from "../utils/toast.js";

export async function loadgame_offlinemode(addToHistory = true) {
    const game_offlinemode_game_id = Math.round(Date.now() / 9000);
    const game_offlinemode_player_id = Math.random().toString(36).substring(2, 15);
    const ws_uri = `/ws/pong/${game_offlinemode_game_id}/?player=${game_offlinemode_player_id}&gameId=${game_offlinemode_game_id}&playerId=${game_offlinemode_player_id}&type=circular&pongType=circular&players=2&balls=1&debug=true&sides=2&shape=undefined&scoreMode=classic`;

    let game_2d_is_running = true;
    let game_2d_websocket = new WebSocket(ws_uri);

    let game_offlinemodeCanvas, context;

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
        if (event.state.view != "game_offlinemode") {
            console.log("game_offlinemode popstate ev listener called, closing all games");

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
        context.clearRect(0, 0, game_offlinemodeCanvas.width, game_offlinemodeCanvas.height);

        // Draw the ball
        const ball = gameState.balls[0];
        const ballX = (game_offlinemodeCanvas.width / 2) + (ball.x * game_offlinemodeCanvas.width / 2);
        const ballY = (game_offlinemodeCanvas.height / 2) - (ball.y * game_offlinemodeCanvas.height / 2);
        const ballSize = ball.size * game_offlinemodeCanvas.width * 0.2; // Assume size is a fraction of canvas width

        context.beginPath();
        context.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
        context.fillStyle = "red";
        context.fill();
    }

    try {
        if (addToHistory) {
            history.pushState({ view: "game_offlinemode" }, "");
            console.log("history added game_offlinemode");
        }

        const mainContent = document.getElementById("main-content");
        if (!mainContent) {
            throw new Error("Main content element not found");
        }

        mainContent.innerHTML = '<canvas id="game_offlinemode_canvas" height="500" width="500"></canvas>';
        game_offlinemodeCanvas = document.getElementById("game_offlinemode_canvas");
        context = game_offlinemodeCanvas.getContext("2d");

        console.log("game_offlinemode canvas set up");
    } catch (error) {
        console.error("Error loading game_offlinemode page:", error);
        showToast("Failed to load game_offlinemode", true);
    }
}
