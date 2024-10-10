const websocker_textelement = document.getElementById("websocker_textelement")
const echo_websocket = new WebSocket("ws://localhost:8000/ws/echo/99099815");
var echo_websocket_open = false
echo_websocket.onopen = () => echo_websocket_open = true
echo_websocket.onmessage = (incoming_message) => {
    websocker_textelement.innerHTML = (incoming_message.data)
    var game_state = JSON.parse(incoming_message.data)
    
    update_canvas(game_state["game_state"])
}

function send_message() {
    if (echo_websocket_open)
        var time_string = Date.now().toString()
        var outgoing_message = {"message": "browser saying hi at time: " + time_string}
        echo_websocket.send(JSON.stringify(outgoing_message))
    }

const main_canvas = document.getElementById("main_canvas")
const ctx = main_canvas.getContext("2d")

default_positions = {"paddle_left" : Math.random() * 300}

function update_canvas(data) {
    const paddle_height = 30;
    const paddle_width = 5;

    ctx.clearRect(0, 0, 320, 300);
    ctx.fillRect(5, data.paddle_left, paddle_width, paddle_height);
    ctx.fillRect(300, data.paddle_right, paddle_width, paddle_height);
    ctx.beginPath();
    ctx.arc(data.ball_x, data.ball_y, 6, 0, 2*Math.PI);
    ctx.fill();
}

update_canvas(default_positions)

setInterval(send_message, 1000)