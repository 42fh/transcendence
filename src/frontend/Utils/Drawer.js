import * as THREE from "three";

const GAME_HEIGHT = 1;
const GAME_WIDTH = 0.5;

const sectorColors = [
  0xff0000, // Red
  0x00ff00, // Green
  0x0000ff, // Blue
  0xffff00, // Yellow
  0xff00ff, // Magenta
  0x00ffff, // Cyan
  0xff8000, // Orange
  0x8000ff, // Purple
  0x0080ff, // Light Blue
  0xff0080, // Pink
  0x80ff00, // Lime
];

export default class Drawer {
  constructor(initialConfig, game) {
    this.config = initialConfig;
    this.game = game;
    this.radius = 1;
    this.field = new THREE.Group();

    if (this.game.type == "circular") {
      this.generatePaddlesCircular(this.config.paddles.length, this.radius);
      this.createGameFieldCircular(this.radius);
    } else {
      this.generatePaddles(this.config.paddles.length);
      this.createGameField();
    }
    this.game.scene.add(this.field);
    this.createBalls(this.config.balls);
  }

  createGameField() {
    const wallGeometry = new THREE.BoxGeometry(0.05, 0.5, GAME_HEIGHT * 2);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(-GAME_WIDTH, 0.25, 0);
    wall1.receiveShadow = true;
    this.field.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(GAME_WIDTH, 0.25, 0);
    this.field.add(wall2);
  }

  generatePaddles(_player_count) {
    const playerGeometry = new THREE.BoxGeometry(
      this.config.dimensions.paddle_length,
      this.config.dimensions.paddle_width * 2.5,
      this.config.dimensions.paddle_length / 2
    );
    playerGeometry.center();
    const player1 = new THREE.Mesh(
      playerGeometry,
      new THREE.MeshStandardMaterial({
        map: this.game.loader.items["42berlin"],
      })
    );
    player1.position.set(0, 0.15, -GAME_HEIGHT);

    const player2 = player1.clone();
    player2.position.set(0, 0.15, GAME_HEIGHT);

    this.game.paddles.set(0, player1);
    this.game.paddles.set(1, player2);
    this.field.add(this.game.paddles.get(0));
    this.field.add(this.game.paddles.get(1));
  }
  generatePaddlesCircular(player_count, radius) {
    const sectorSize = (2 * Math.PI) / player_count;
    const playerGeometry = new THREE.BoxGeometry(
      this.config.dimensions.paddle_length * sectorSize,
      this.config.dimensions.paddle_width * 2.5,
      this.config.dimensions.paddle_width
    );

    for (let i = 0; i < player_count; i++) {
      const playerMaterial = new THREE.MeshMatcapMaterial({
        map: this.game.skins[0],
      });
      const paddle = new THREE.Mesh(playerGeometry, playerMaterial);

      const angle = -(i * sectorSize - Math.PI / 2 + sectorSize / 2);

      const x = 0.96 * Math.cos(angle);
      const z = 0.96 * Math.sin(angle);
      paddle.position.set(x, 0.15, z);
      paddle.lookAt(0, 0.11, 0);
      paddle.castShadow = true;
      paddle.receiveShadow = true;

      this.game.paddles.set(i, paddle);
      this.field.add(this.game.paddles.get(i));

      const ringAngle = i * sectorSize - Math.PI / 2;
      const ringGeometry = new THREE.RingGeometry(
        radius - 0.05,
        radius,
        32,
        1,
        ringAngle,
        sectorSize
      );
      const ringMaterial = new THREE.MeshMatcapMaterial({
        color: sectorColors[i],
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.01;

      this.field.add(ringMesh);
    }
  }

  createGameFieldCircular(radius) {
    const fieldGeometry = new THREE.CircleGeometry(radius + 0.5, 64);
    const fieldMaterial = new THREE.MeshStandardMaterial({
      map: this.game.loader.items["floorColorTexture"],
      alphaMap: this.game.loader.items["floorAplhaTexture"],
      transparent: true,
      normalMap: this.game.loader.items["floorNormalTexture"],
      displacementMap: this.game.loader.items["floorDisplacementTexture"],
      roughnessMap: this.game.loader.items["floorARMTexture"],
      aoMap: this.game.loader.items["floorARMTexture"],
      metalnessMap: this.game.loader.items["floorARMTexture"],
      displacementScale: 0.06,
      displacementBias: -0.05,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;

    this.field.add(field);
  }

  createBalls(ballsConfig) {
    const ballGeometry = new THREE.SphereGeometry(ballsConfig[0].size, 32, 32);
    const ballMaterial = new THREE.MeshMatcapMaterial({ color: 0xffffff });

    this.game.balls = [];
    for (const ballConfig of ballsConfig) {
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(ballConfig.x, ballConfig.size, ballConfig.y);
      ball.castShadow = true;
      ball.receiveShadow = true;
      this.game.balls.push(ball);
      this.field.add(ball);
    }
  }

  updateGame(gameState) {
    console.log("Updating game state", gameState);
    if (this.game.ui.isActive) {
      this.game.ui.createScoreTable(-2, 1, 0);
    }
    this.game.ui.updateScoreTable(gameState.scores);

    if (this.game.type == "circular") {
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
      const radius = 0.96;

      const paddleArcLength = this.config.dimensions.paddle_length / radius;
      const sectorAngle = (2 * Math.PI) / totalSides;
      const availableRange = sectorAngle - paddleArcLength;

      for (let i = 0; i < totalSides; i++) {
        const paddle = this.game.paddles.get(i);
        if (!paddle) continue;

        const sideIndex = gameState.paddles[i].side_index;
        const position = 1 - gameState.paddles[i].position;

        const sectorSize = (2 * Math.PI) / totalSides;
        const clampedPosition = position * availableRange;
        const startAngle = -(sideIndex * sectorSize - Math.PI / 2 + sectorSize);
        const angle = startAngle + paddleArcLength / 2 + clampedPosition;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        paddle.position.set(x, 0.15, z);
        paddle.lookAt(0, -0.28, 0);
      }
    } else {
      for (let i = 0; i < gameState.balls.length; i++) {
        this.game.balls[i].position.set(
          gameState.balls[i].y,
          0.08,
          gameState.balls[i].x
        );
      }
      // update paddles
      for (let i = 0; i < gameState.paddles.length; i++) {
        const paddle = this.game.paddles.get(i);
        if (!paddle) continue;

        console.log(gameState.paddles[i].position);
        paddle.position.x = (gameState.paddles[i].position - GAME_WIDTH) * -1;
      }
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
