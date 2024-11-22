function ws_url(player_id, game_id)
{
    const url = `ws://localhost:8000/ws/pong/${game_id}/?player=${player_id}&gameId=${game_id}&playerId=${player_id}&type=polygon&pongType=classic&players=2&balls=1&debug=false&sides=4&shape=undefined&scoreMode=classic`;
    return url
}

function render_socket_message(ev) {
    const canvas = document.getElementById("game-2d-canvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");

    try {
        const data = JSON.parse(ev.data);
        if (data.type === "game_state" && data.game_state) {
            const { balls } = data.game_state;

            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw each ball
            balls.forEach(ball => {
                const ballX = (ball.x + 1) / 2 * canvas.width;
                const ballY = (ball.y + 1) / 2 * canvas.height;
                const ballRadius = ball.size * canvas.width / 2; // Assuming size is relative to width

                context.beginPath();
                context.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
                context.fillStyle = "cyan";
                context.fill();
                context.closePath();
            });
        }

        console.log(ev.data);
    } catch (error) {
        console.error("Failed to render_socket_message", error);
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