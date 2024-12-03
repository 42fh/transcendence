import { showToast } from "../utils/toast.js";


export async function loadGame2D(addToHistory = true) {

    const game2d_game_id = Date.now() / 30;
    const ws_uri = `/ws/pong/${game2d_game_id}/?player=hy7nk2d43ek&gameId=${game2d_game_id}&playerId=hy7nk2d43ek&type=circular&pongType=circular&players=2&balls=1&debug=true&sides=2&shape=undefined&scoreMode=classic`;
    let game_2d_is_running = true;
    let game_2d_websocket = new WebSocket(ws_uri);

    game_2d_websocket.onopen = () => console.log("game socket opened");
    game_2d_websocket.onmessage = () => console.log("game socket message incoming");

    addEventListener("popstate", (event) => {
        if (event.state.view == "game2d") {
            console.log("game2d popstate ev listener called, closing all games");

            try {
                game_2d_websocket.close();
            } catch (error) {
                console.log("Websocket not open");
                console.log(error);
            }
        }
    });

    try {
        if (addToHistory) {
            history.pushState(
              {
                view: "game2d",
              },
              ""
            );
            console.log("history added game2d")
            // updateActiveNavItem(isOwnProfile ? "profile" : null);
          }
        //   if (!addToHistory) updateActiveNavItem("profile");
      
          const mainContent = document.getElementById("main-content");
          if (!mainContent) {
            throw new Error("Main content element not found");
          }

        mainContent.innerHTML = '<p> hello game2d world</p ><canvas id="game2d_canvas" height="500" width="500"></canvas>';
        
        let game2dCanvas = document.getElementById("game2d_canvas");
        let context = game2dCanvas.getContext("2d");
        context.fillStyle = "rgb(255 255 255)";
        context.fillRect(10, 10, 250, 250);
    
    } catch (error) {
        console.error("Error loading game2d page:", error);
        showToast("Failed to load game2d", true);
        loadHomePage();
    }


    console.log("hello game 2d")
}