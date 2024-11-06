import * as THREE from "three";

export default class Drawer {
  constructor(initialConfig, game) {
    this.config = initialConfig;
    this.game = game;
    this.radius = 1;

    this.generatePaddles(this.config.paddles.length, this.radius);
    this.createGameField(this.radius);
    this.createBalls(this.config.balls);
  }

  generatePaddles(player_count, radius) {
    const playerGeometry = new THREE.BoxGeometry(
      this.config.dimensions.paddle_length,
      this.config.dimensions.paddle_width,
      this.config.dimensions.paddle_length / 2
    );
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

    for (let i = 0; i < player_count; i++) {
      const paddle = new THREE.Mesh(playerGeometry, playerMaterial);
      const angle = (i / player_count) * Math.PI * 2;
      const x = 0.9 * Math.cos(angle);
      const z = 0.9 * Math.sin(angle);
      paddle.position.set(x, 0.11, z);
      paddle.lookAt(0, 0.11, 0);
      paddle.castShadow = true;
      paddle.receiveShadow = true;

      this.game.paddles.push(paddle);
    }

    this.game.addObjects(this.game.paddles);
  }

  createGameField(radius) {
    const fieldGeometry = new THREE.CircleGeometry(radius, 64);
    const fieldMaterial = new THREE.MeshPhongMaterial({
      map: this.game.loader.items["floorChecker"],
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;

    const boundaryGeometry = new THREE.RingGeometry(radius - 0.05, radius, 64); // Thin ring
    const boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    boundary.rotation.x = -Math.PI / 2;
    boundary.position.y = 0.01; // z-fighting fix

    const gameField = new THREE.Group();
    gameField.add(field);
    gameField.add(boundary);

    this.game.addObjects([gameField]);
  }

  createBalls(ballsConfig) {
    const ballGeometry = new THREE.SphereGeometry(ballsConfig[0].size, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    for (const ballConfig of ballsConfig) {
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(ballConfig.x, ballConfig.size, ballConfig.y);
      ball.castShadow = true;
      ball.receiveShadow = true;
      this.game.balls.push(ball);
    }
    this.game.addObjects(this.game.balls);
  }

  updateGame(gameState) {
    // update balls
    for (let i = 0; i < gameState.balls.length; i++) {
      this.game.balls[i].position.set(
        gameState.balls[i].y,
        0.08,
        gameState.balls[i].x
      );
    }

    // update paddles
    const totalSides = gameState.paddles.length;
    const radius = 0.9;
    for (let i = 0; i < totalSides; i++) {
      const baseAngle =
        (gameState.paddles[i].side_index / totalSides) * Math.PI * 2;

      const angle =
        baseAngle +
        gameState.paddles[i].position * ((Math.PI * 2) / totalSides);

      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      this.game.paddles[i].position.set(x, 0.12, z);

      this.game.paddles[i].lookAt(0, 0.12, 0);
    }
  }

  movePaddle(direction) {
    this.game.websocket.sendMessage({
      action: "move_paddle",
      direction,
      user_id: this.game.playerId,
    });
  }
}
