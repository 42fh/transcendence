

export async function loadGame2D(addToHistory = true) {

    addEventListener("popstate", (event) => {
        if (event.view == "game2d") {
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
            // updateActiveNavItem(isOwnProfile ? "profile" : null);
          }
        //   if (!addToHistory) updateActiveNavItem("profile");
      
          const mainContent = document.getElementById("main-content");
          if (!mainContent) {
            throw new Error("Main content element not found");
          }

        mainContent.innerHTML = '<p>hello game2d world</p>';
    
    } catch (error) {
        console.error("Error loading game2d page:", error);
        showToast("Failed to load game2d", true);
        loadHomePage();
    }


    console.log("hello game 2d")
}