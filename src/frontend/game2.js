import * as THREE from "three";
import World from "./World/World.js";
import Game from "./Game/Game.js";

const GAME_HEIGHT = 1;
const GAME_WIDTH = 1;
const PADDLE_SIZE = 0.2;

let moveDown, moveUp, player1, player2, gameBall;
let canvas = document.querySelector(".webgl");

const world = new World(canvas, false);
world.addOrthographicCamera();

const game = new Game();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));

game.loadResources([
  { name: "floorChecker", type: "texture", url: "static/textures/checker.png" },
]);

window.addEventListener("resourcesLoaded", () => {
  game.loader.items["floorChecker"].colorSpace = THREE.SRGBColorSpace;
  game.loader.items["floorChecker"].generateMipmaps = false;
  game.loader.items["floorChecker"].wrapS = THREE.RepeatWrapping;
  game.loader.items["floorChecker"].wrapT = THREE.RepeatWrapping;
  game.loader.items["floorChecker"].minFilter = THREE.NearestFilter;
  game.loader.items["floorChecker"].magFilter = THREE.NearestFilter;
  game.loader.items["floorChecker"].repeat.set(3, 3);

  // floor
  const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GAME_HEIGHT, GAME_WIDTH),
    new THREE.MeshPhongMaterial({ map: game.loader.items["floorChecker"] })
  );
  planeMesh.receiveShadow = true;
  planeMesh.rotation.x = -Math.PI / 2;
  planeMesh.position.set(GAME_WIDTH / 2, 0, GAME_HEIGHT / 2);
  planeMesh.scale.set(GAME_WIDTH, 1, GAME_HEIGHT);

  // paddle 1
  const playerGeometry = new THREE.BoxGeometry(
    PADDLE_SIZE / 2,
    0.1,
    PADDLE_SIZE
  );
  player1 = new THREE.Mesh(
    playerGeometry,
    new THREE.MeshPhongMaterial({ color: 0xff0000 })
  );
  player1.castShadow = true;
  player1.receiveShadow = true;
  player1.position.set(
    GAME_HEIGHT - GAME_HEIGHT - 0.04,
    0.05,
    GAME_HEIGHT / 2 - PADDLE_SIZE / 2
  );
  player1.scale.set(1, 1, 1);
  playerGeometry.translate(0, 0, PADDLE_SIZE / 2);

  // paddle 2
  player2 = player1.clone();
  player2.position.set(
    GAME_HEIGHT + 0.04,
    0.05,
    GAME_HEIGHT / 2 - PADDLE_SIZE / 2
  );

  // ball
  gameBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0x0000ff })
  );
  gameBall.castShadow = true;
  gameBall.receiveShadow = true;
  gameBall.position.set(GAME_HEIGHT / 2, 0.05, GAME_WIDTH / 2);

  game.addObjects([planeMesh, player1, player2, gameBall]);
});

function gameLoop(world, scene) {
  // move paddle
  if (moveDown && world.game.socket) {
    world.game.socket.send(
      JSON.stringify({
        action: "move_paddle",
        direction: "down",
        user_id: world.game.playerId,
      })
    );
  }
  if (moveUp && world.game.socket) {
    world.game.socket.send(
      JSON.stringify({
        action: "move_paddle",
        direction: "up",
        user_id: world.game.playerId,
      })
    );
  }

  world.controls.update();
  world.composer.render(scene, world.camera);
}
game.addGameLoop(gameLoop);

function updateGame(gameState) {
  console.log("paddle", gameState.paddle_left.y);
  console.log("ball", gameState.ball.y);
  player2.position.z = gameState.paddle_right.y * GAME_WIDTH;
  player1.position.z = gameState.paddle_left.y * GAME_WIDTH;
  gameBall.position.z = gameState.ball.y * GAME_HEIGHT;
  gameBall.position.x = gameState.ball.x * GAME_WIDTH;
  // TODO: optimize
  document.querySelector(".score1").textContent = gameState.score.left;
  document.querySelector(".score2").textContent = gameState.score.right;
}
game.addSocket(updateGame);

// start game
world.addGame(game, false);

// ----------Event Listeners----------
// Move paddle
document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "KeyA":
      moveUp = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveDown = true;
      break;
  }
});

// Stop moving paddle
document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "ArrowLeft":
    case "KeyA":
      moveUp = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveDown = false;
      break;
  }
});

// Fullscreen
document.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
