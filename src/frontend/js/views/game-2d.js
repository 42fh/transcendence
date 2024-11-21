function ws_url(player_id, game_id)
{
    const url = `ws://localhost:8000/ws/pong/4/?player=6&gameId=${game_id}&playerId=${player_id}&type=polygon&pongType=irregular&players=2&balls=1&debug=false&sides=6&shape=regular&scoreMode=classic`
    return url
}

function render_socket_message(ev)
{
    const canvas = document.getElementById("game-2d-canvas");
    if (canvas)
    {
        const context = canvas.getContext("2d");
        context.fillStyle = "cyan";
        // Add a rectangle at (10, 10) with size 100x100 pixels
        context.fillRect(10, 10, 300, 300);
    }

    try {
        console.log(ev.data);
    } catch (error) {
        console.log("failed to render_socket_message");
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