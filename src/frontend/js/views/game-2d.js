function ws_url(player_id, game_id)
{
    const url = `ws://localhost:8000/ws/pong/${game_id}/?player=${player_id}&gameId=${game_id}&playerId=${player_id}&type=polygon&pongType=classic&players=2&balls=1&debug=false&sides=4&shape=undefined&scoreMode=classic`;
    return url
}

function render_socket_message(ev) {
    const canvas = document.getElementById("game-2d-canvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas for new frame rendering

    try {
        const message = JSON.parse(ev.data);
        if (message.type === "game_state" && message.game_state) {
            const gameState = message.game_state;

            // Dimensions of the bounding rectangle
            const width = canvas.width;
            const height = canvas.height * 9 / 16;

            // Draw bounding rectangle
            context.strokeStyle = "red";
            context.lineWidth = 2;
            context.strokeRect(
                (width / 2) - (width / 2),
                (height / 2) - (height / 2),
                width,
                height
            );

            // Draw ball
            const ball = gameState.balls[0];
            const ballX = (ball.x + 0.5) * width; // Map from game space (-0.5 to 0.5) to canvas space
            const ballY = (0.5 - ball.y) * height; // Invert Y-axis for canvas
            const ballRadius = ball.size * width; // Ball size relative to width

            context.fillStyle = "blue";
            context.beginPath();
            context.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
            context.fill();
        }
    } catch (error) {
        console.error("Failed to parse and render game state:", error);
    }
}


function add_websocksocket_events(socket)
{
    socket.onopen = (ev) => console.log("websocket opened");
    socket.onerror = (ev) => console.log("websocket ERROR");
    socket.onmessage = render_socket_message;
}

export async function loadGamePage(addToHistory = true) {

    try {
        if (addToHistory) {
            history.pushState(
                {
                    view: "game",
                },
                ""
            );
        }

        var socket;

        const canvas_template = document.getElementById("game-2d-canvas-template");
        const mainContent = document.getElementById("main-content");
        mainContent.innerHTML = "";
        mainContent.appendChild(document.importNode(canvas_template.content, true));

        // minimal canvas test
        const canvas = document.getElementById("game-2d-canvas");
        const context = canvas.getContext("2d");
        context.fillStyle = "grey";
        // Add a rectangle at (10, 10) with size 100x100 pixels
        context.fillRect(10, 10, 300, 300);

        const start_button = document.getElementById("start-game");
        start_button.onclick = (ev) => {
            const player_id = document.getElementById("input-player-id").value;
            const game_id = document.getElementById("input-game-id").value;
            socket = new WebSocket(ws_url(player_id, game_id));

            add_websocksocket_events(socket);
        }

    } catch (error) {
        console.error(error);
    }
}