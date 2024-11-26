// view and game for 2d pong
export async function loadGame2dPage(addToHistory = true) {
    try {
      if (addToHistory) {
        history.pushState(
          {
            view: "game2d",
          },
          ""
        );
      }
      if (!addToHistory) updateActiveNavItem("game2d");
      const mainContent = document.getElementById("main-content");
  
      mainContent.innerHTML = "";
  
      // game2d
      const game2dTemplate = document.getElementById("game2d-template");
      if (!game2dTemplate) {
        throw new Error("game2dTemplate template not found");
      }
  
      mainContent.appendChild(document.importNode(game2dTemplate.content, true));
      // initAuthListeners();
    
      // Hide bottom nav on auth page
      const bottomNavContainer = document.getElementById("bottom-nav-container");
      if (bottomNavContainer) {
        bottomNavContainer.style.display = "none";
      }
        
      const canvas = document.getElementById("circleCanvas");
      const ctx = canvas.getContext("2d");
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      const ballRadius = 10;
      let angle = 0;

      function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Calculate ball position
          const ballX = centerX + radius * Math.cos(angle);
          const ballY = centerY + radius * Math.sin(angle);

          // Draw the ball
          ctx.beginPath();
          ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
          ctx.fillStyle = "red";
          ctx.fill();
          ctx.closePath();

          // Update angle for next frame
          angle += 0.02;

          requestAnimationFrame(draw);
      }

      draw();
        
        
        
    } catch (error) {
      console.error("Error loading game2d page:", error);
      displayLogoutError("An error occurred while loading the game2d page.");
    }
  }


// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Red Ball in Circle</title>
//     <style>
//         #circleCanvas {
//             display: block;
//             margin: auto;
//             background-color: #f0f0f0;
//         }
//     </style>
// </head>
// <body>
//     <canvas id="circleCanvas" width="400" height="400"></canvas>
//     <script>

//     </script>
// </body>
// </html>
