

export async function loadGame2D(addToHistory = true) {

    addEventListener("popstate", (event) => {
        if (event.state.view == "game2d") {
            console.log("game2d popstate ev listener called");
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

        mainContent.innerHTML =
            `< p > hello game2d world</p >
            <canvas id="game2d_canvas" height="500" width="500"></canvas>`;
        
        game2d_canvas = document.getElementById("game2d_canvas");
        context = game2d_canvas.getContext("2d");
        context.fillRect(10, 10, 250, 250);
    
    } catch (error) {
        console.error("Error loading game2d page:", error);
        showToast("Failed to load game2d", true);
        loadHomePage();
    }


    console.log("hello game 2d")
}