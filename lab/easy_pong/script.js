// Configuration object for easily adjustable values
const CONFIG = {
  baseSpeed: 0.1, // Base speed factor (adjust this to control overall speed)

  ballSize: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ball-size")), // Get ball size from CSS
};

let ballSpeedX = CONFIG.baseSpeed * CONFIG.ballSize; // Speed proportional to ball size
let ballSpeedY = CONFIG.baseSpeed * CONFIG.ballSize;

// Get references to the game area and ball elements
const gameArea = document.getElementById("gameArea");
const ball = document.getElementById("ball");

let ballX = (gameArea.offsetWidth - CONFIG.ballSize) / 2; // Center horizontally
let ballY = (gameArea.offsetHeight - CONFIG.ballSize) / 2; // Center vertically

// Update the ball's position on the screen
function moveBall() {
  // Update ball position based on speed
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Detect collision with the left or right wall
  if (ballX <= 0 || ballX + CONFIG.ballSize >= gameArea.offsetWidth) {
    ballSpeedX *= -1; // Reverse horizontal direction
  }

  // Detect collision with the top or bottom wall
  if (ballY <= 0 || ballY + CONFIG.ballSize >= gameArea.offsetHeight) {
    ballSpeedY *= -1; // Reverse vertical direction
  }

  // Set the new position of the ball
  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";

  // Call moveBall again to keep moving
  requestAnimationFrame(moveBall);
}

// Start the ball moving when the page loads
window.onload = function () {
  moveBall();
};
