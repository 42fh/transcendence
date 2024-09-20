document.getElementById("startButton").addEventListener("click", startWebSocket);

export let socket;

function displayData(message)
{
    const data = JSON.parse(message);
    const displayElement = document.getElementById('display');

    displayElement.value += `${data.user}: ${data.data} (${data.timestamp})\n`;
}

// Function to start WebSocket connection
function startWebSocket() {
    // Create WebSocket connection
    socket = new WebSocket("ws://localhost:8001");

    // when the connection is open
    socket.onopen = function(e)
    {
        console.log("[open] Connection established");
    };
    
    // receive messages from the server
    socket.onmessage = function(event)
    {
        displayData(event.data);
        console.log(`[message] Data received from server: ${event.data}`);
    };

    // close the connection
    socket.onclose = function(event)
    {
        if (event.wasClean)
            console.log(`[close] Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
        else
            console.log('[close] Connection died');
    };

    // in case of an error
    socket.onerror = function(error)
    {
        console.error(`[error] ${error.message}`);
    };
}