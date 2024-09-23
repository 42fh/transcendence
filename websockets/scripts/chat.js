import { socket } from "./socket.js";
import { Player } from "./PlayerClass.js";

let player = new Player(5, 0);
player.render();

player.renderer.setAnimationLoop( animate );

function animate()
{
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
    player.controls.update();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    player.renderer.setSize( window.innerWidth, window.innerHeight );
    player.renderer.setPixelRatio(window.devicePixelRatio);
	player.renderer.render( player.scene, player.camera );

}

document.getElementById("message").addEventListener("click", sendMessage);
document.getElementById("unsubscribe").addEventListener("click", unsubscribe);
document.getElementById("joinChat").addEventListener("click", subscribe);

function sendMessage()
{
    let message = document.getElementById("textMessage").value;
    let username = document.getElementById("username").value;
    let chat = document.getElementById("chatList").value;
    
    // if websockets exists and is opened
    if (socket && socket.readyState === WebSocket.OPEN)
    {
        // Create a JSON object
        const jsonMessage = {
            type : "message",
            user: username,
            data: message,
            timestamp: new Date().toISOString(),
            chat_id: chat
        };

        // Convert the JSON object to a string
        const jsonString = JSON.stringify(jsonMessage);

        // Send the JSON string over the WebSocket connection
        socket.send(jsonString);

        // clear input
        document.getElementById("textMessage").value = "";
    }
}

function unsubscribe()
{
    let username = document.getElementById("username").value;
    let chat = document.getElementById("chatList").value;
    
    // if websockets exists and is opened
    if (socket && socket.readyState === WebSocket.OPEN)
    {
        // Create a JSON object
        const jsonMessage = {
            type: "unsubscribe",
            user: null,
            data: null,
            timestamp: new Date().toISOString(),
            chat_id: chat
        };

        // Convert the JSON object to a string
        const jsonString = JSON.stringify(jsonMessage);

        // Send the JSON string over the WebSocket connection
        socket.send(jsonString);

        // clear input
        document.getElementById("textMessage").value = "";
    }
}

function subscribe()
{
    let chat = document.getElementById("chatList").value;

    if (socket && socket.readyState === WebSocket.OPEN)
    {
        // Create a JSON object
        const jsonMessage = {
            type : "subscribe",
            user: username,
            data: message,
            timestamp: new Date().toISOString(),
            chat_id: chat
        };

        // Convert the JSON object to a string
        const jsonString = JSON.stringify(jsonMessage);

        // Send the JSON string over the WebSocket connection
        socket.send(jsonString);

        // clear input
        document.getElementById("textMessage").value = "";
    }
}