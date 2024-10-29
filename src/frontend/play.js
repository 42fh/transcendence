// Configuration object for easily adjustable values
const CONFIG = {
  ballSpeed: 2, // Single speed value
  ballSize: 20, // Ball size in pixels
  paddleSpeed: 10, // Padle speed in pixels
};

let ballSpeed = CONFIG.ballSpeed;
const ballSize = CONFIG.ballSize;
const paddleSpeed = CONFIG.paddleSpeed;

// Get references to the game area and ball elements
const gameArea = document.getElementById("gameArea");
const ball = document.getElementById("ball");
const leftPaddle = document.getElementById("leftPaddle");
const rightPaddle = document.getElementById("rightPaddle");
const startButton = document.getElementById("startButton");

// Directions for ball movement (-1 for left/up, 1 for right/down)
let directionX = 1;
let directionY = 1;

// Ball position
let ballX,
  ballY = 0;

// Padle position
let leftPaddleY,
  rightPaddleY = 0;

function setInitialPaddlePosition() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  leftPaddleY = (gameAreaRect.height - leftPaddle.offsetHeight) / 2;
  rightPaddleY = (gameAreaRect.height - rightPaddle.offsetHeight) / 2;
  leftPaddle.style.top = leftPaddleY + "px";
  rightPaddle.style.top = rightPaddleY + "px";
}

setInitialPaddlePosition();

// Update paddle position
function movePaddle(paddle, yPos) {
  const gameAreaRect = gameArea.getBoundingClientRect();
  const gameAreaStyles = getComputedStyle(gameArea);
  const borderTop = parseFloat(gameAreaStyles.borderTopWidth);
  const borderBottom = parseFloat(gameAreaStyles.borderBottomWidth);

  // Calculate top and bottom boundaries for the paddle
  const topBoundary = 0;

  // The bottom boundary is the game area height minus the paddle height and the bottom border
  const maxPaddleY = gameAreaRect.height - paddle.offsetHeight - borderBottom - borderTop;

  console.log("Game Area Height:", gameAreaRect.height);
  console.log("Paddle Offset Height:", paddle.offsetHeight);
  console.log("Max Paddle Y (bottom boundary):", maxPaddleY);

  yPos = Math.max(topBoundary, Math.min(yPos, maxPaddleY)); // Clamp the Y position to the game areaA

  console.log("yPos after clamp:", yPos);

  paddle.style.top = yPos + "px";

  if (paddle === leftPaddle) {
    leftPaddleY = yPos;
  } else if (paddle === rightPaddle) {
    rightPaddleY = yPos;
  }
}

function checkCollisionWithPaddles() {
  const ballRect = ball.getBoundingClientRect();
  const leftPaddleRect = leftPaddle.getBoundingClientRect();
  const rightPaddleRect = rightPaddle.getBoundingClientRect();

  // Left paddle collision (ball hits right side of left paddle)
  if (ballRect.left <= leftPaddleRect.right && ballRect.right >= leftPaddleRect.left) {
    // Check if the ball's vertical range overlaps with the paddle's vertical range
    if (ballRect.bottom >= leftPaddleRect.top && ballRect.top <= leftPaddleRect.bottom) {
      // Collision detected, reverse X direction
      directionX *= -1;
      // Move the ball outside of the paddle to avoid repeated collisions
      ballX = leftPaddleRect.right;

      console.log("Collision with left paddle!");
    }
  }

  // Right paddle collision (ball hits left side of right paddle)
  if (ballRect.right >= rightPaddleRect.left && ballRect.left <= rightPaddleRect.right) {
    // Check if the ball's vertical range overlaps with the paddle's vertical range
    if (ballRect.bottom >= rightPaddleRect.top && ballRect.top <= rightPaddleRect.bottom) {
      // Collision detected, reverse X direction
      directionX *= -1;
      // Move the ball outside of the paddle to avoid repeated collisions
      ballX = rightPaddleRect.left - ballSize;
      console.log("Collision with right paddle!");
    }
  }
}

// Keyborad input for paddle movement
window.addEventListener("keydown", function (event) {
  switch (event.key) {
    // Left paddle (W - Up, S - Down)
    case "w":
      leftPaddleY -= paddleSpeed;
      movePaddle(leftPaddle, leftPaddleY);
      break;
    case "s":
      leftPaddleY += paddleSpeed;
      movePaddle(leftPaddle, leftPaddleY);
      break;
    // Right paddle (ArrowUp - Up, ArrowDown - Down)
    case "ArrowUp":
      rightPaddleY -= paddleSpeed;
      movePaddle(rightPaddle, rightPaddleY);
      break;
    case "ArrowDown":
      rightPaddleY += paddleSpeed;
      movePaddle(rightPaddle, rightPaddleY);
      break;
  }
});
// Initialize control variables
let isMoving = false;
let animationFrameId;

function setInitialBallPosition() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  ballX = (gameAreaRect.width - ballSize) / 2;
  ballY = (gameAreaRect.height - ballSize) / 2;
}

setInitialBallPosition();

function moveBall() {
  // Recalculate the game area size in case it has changed
  const gameAreaRect = gameArea.getBoundingClientRect();
  const gameAreaStyles = getComputedStyle(gameArea);
  const borderTop = parseFloat(gameAreaStyles.borderTopWidth);
  const borderRight = parseFloat(gameAreaStyles.borderRightWidth);
  const borderBottom = parseFloat(gameAreaStyles.borderBottomWidth);
  const borderLeft = parseFloat(gameAreaStyles.borderLeftWidth);

  const gameAreaWidth = gameAreaRect.width - borderLeft - borderRight;
  const gameAreaHeight = gameAreaRect.height - borderTop - borderBottom;

  // Update ball position based on speed
  ballX += ballSpeed * directionX;
  ballY += ballSpeed * directionY;

  // Check for collisions with paddles
  checkCollisionWithPaddles();

  // Check if the ball hits the left or right boundary
  //   if (ballX <= borderLeft || ballX + ballSize >= gameAreaWidth + borderLeft) {
  //     directionX *= -1; // Reverse direction
  //     ballX = ballX <= borderLeft ? borderLeft : gameAreaWidth + borderLeft - ballSize; // Prevent the ball from "sticking" into the wall
  //   }

  // Check if the ball goes out of bounds (left or right)
  if (ballX <= 0 || ballX + ballSize >= gameAreaWidth) {
    resetBall(); // Reset the ball to the center
  }

  // Check if the ball hits the top or bottom boundary
  if (ballY <= borderTop || ballY + ballSize >= gameAreaHeight + borderTop) {
    directionY *= -1; // Reverse direction
    ballY = ballY <= borderTop ? borderTop : gameAreaHeight + borderTop - ballSize; // Prevent the ball from "sticking" into the wall
  }

  // Set the new position of the ball
  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";

  // Call moveBall again to keep moving
  animationFrameId = requestAnimationFrame(moveBall);
}

function startBall() {
  if (!isMoving) {
    isMoving = true;
    startButton.textContent = "Stop";
    moveBall();
  }
}

function stopBall() {
  if (isMoving) {
    isMoving = false;
    startButton.textContent = "Start";
    cancelAnimationFrame(animationFrameId);
  }
}

function resetBall() {
  // Reset ball to the center of the game area
  ballX = (gameArea.clientWidth - ballSize) / 2;
  ballY = (gameArea.clientHeight - ballSize) / 2;

  // Optionally randomize the direction of the ball after reset
  directionX = Math.random() > 0.5 ? 1 : -1; // Randomize horizontal direction
  directionY = Math.random() > 0.5 ? 1 : -1; // Randomize vertical direction

  console.log("Ball reset to the center!");
}

// Toggle the ball's movement when the start button is clicked
startButton.addEventListener("click", function () {
  if (isMoving) {
    stopBall();
  } else {
    startBall();
  }
});

function positionDebugDots() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  const gameAreaStyles = getComputedStyle(gameArea);
  const borderTop = parseFloat(gameAreaStyles.borderTopWidth);
  const borderBottom = parseFloat(gameAreaStyles.borderBottomWidth);

  const redDot = document.getElementById("redDot");
  const blueDot = document.getElementById("blueDot");

  // Position the red dot at the top boundary of the game area (including the border)
  redDot.style.top = gameAreaRect.top + borderTop + "px";
  redDot.style.left = gameAreaRect.left + gameAreaRect.width / 2 - 10 + "px";
  redDot.style.display = "block";

  // Position the blue dot at the bottom boundary of the game area (including the border)
  blueDot.style.top = gameAreaRect.bottom - borderBottom - 20 + "px";
  blueDot.style.left = gameAreaRect.left + gameAreaRect.width / 2 - 10 + "px";
  blueDot.style.display = "block";

  console.log("Red dot top:", redDot.style.top);
  console.log("Blue dot top:", blueDot.style.top);
}

// positionDebugDots();
