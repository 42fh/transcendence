import { socket } from "./socket.js";

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