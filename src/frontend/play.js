const CONFIG = {
  ballSpeed: 2,
  ballSize: 20,
  paddleSpeed: 10,
};

let ballSpeed = CONFIG.ballSpeed;
const ballSize = CONFIG.ballSize;
const paddleSpeed = CONFIG.paddleSpeed;

const gameArea = document.getElementById("gameArea");
const ball = document.getElementById("ball");
const leftPaddle = document.getElementById("leftPaddle");
const rightPaddle = document.getElementById("rightPaddle");
const startButton = document.getElementById("startButton");

let directionX = 1;
let directionY = 1;

let ballX,
  ballY = 0;

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

function movePaddle(paddle, yPos) {
  const gameAreaRect = gameArea.getBoundingClientRect();
  const gameAreaStyles = getComputedStyle(gameArea);
  const borderTop = parseFloat(gameAreaStyles.borderTopWidth);
  const borderBottom = parseFloat(gameAreaStyles.borderBottomWidth);

  const topBoundary = 0;

  const maxPaddleY = gameAreaRect.height - paddle.offsetHeight - borderBottom - borderTop;

  yPos = Math.max(topBoundary, Math.min(yPos, maxPaddleY));

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

  if (ballRect.left <= leftPaddleRect.right && ballRect.right >= leftPaddleRect.left) {
    if (ballRect.bottom >= leftPaddleRect.top && ballRect.top <= leftPaddleRect.bottom) {
      directionX *= -1;
      ballX = leftPaddleRect.right;
    }
  }

  if (ballRect.right >= rightPaddleRect.left && ballRect.left <= rightPaddleRect.right) {
    if (ballRect.bottom >= rightPaddleRect.top && ballRect.top <= rightPaddleRect.bottom) {
      directionX *= -1;
      ballX = rightPaddleRect.left - ballSize;
    }
  }
}

window.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "w":
      leftPaddleY -= paddleSpeed;
      movePaddle(leftPaddle, leftPaddleY);
      break;
    case "s":
      leftPaddleY += paddleSpeed;
      movePaddle(leftPaddle, leftPaddleY);
      break;
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
let isMoving = false;
let animationFrameId;

function setInitialBallPosition() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  ballX = (gameAreaRect.width - ballSize) / 2;
  ballY = (gameAreaRect.height - ballSize) / 2;
}

setInitialBallPosition();

function moveBall() {
  const gameAreaRect = gameArea.getBoundingClientRect();
  const gameAreaStyles = getComputedStyle(gameArea);
  const borderTop = parseFloat(gameAreaStyles.borderTopWidth);
  const borderRight = parseFloat(gameAreaStyles.borderRightWidth);
  const borderBottom = parseFloat(gameAreaStyles.borderBottomWidth);
  const borderLeft = parseFloat(gameAreaStyles.borderLeftWidth);

  const gameAreaWidth = gameAreaRect.width - borderLeft - borderRight;
  const gameAreaHeight = gameAreaRect.height - borderTop - borderBottom;

  ballX += ballSpeed * directionX;
  ballY += ballSpeed * directionY;

  checkCollisionWithPaddles();

  if (ballX <= 0 || ballX + ballSize >= gameAreaWidth) {
    resetBall(); // Reset the ball to the center
  }

  if (ballY <= borderTop || ballY + ballSize >= gameAreaHeight + borderTop) {
    directionY *= -1; // Reverse direction
    ballY = ballY <= borderTop ? borderTop : gameAreaHeight + borderTop - ballSize; // Prevent the ball from "sticking" into the wall
  }

  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";

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
  ballX = (gameArea.clientWidth - ballSize) / 2;
  ballY = (gameArea.clientHeight - ballSize) / 2;

  directionX = Math.random() > 0.5 ? 1 : -1;
  directionY = Math.random() > 0.5 ? 1 : -1;
}

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

  redDot.style.top = gameAreaRect.top + borderTop + "px";
  redDot.style.left = gameAreaRect.left + gameAreaRect.width / 2 - 10 + "px";
  redDot.style.display = "block";

  blueDot.style.top = gameAreaRect.bottom - borderBottom - 20 + "px";
  blueDot.style.left = gameAreaRect.left + gameAreaRect.width / 2 - 10 + "px";
  blueDot.style.display = "block";
}

// positionDebugDots();
