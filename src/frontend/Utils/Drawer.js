import * as THREE from "three";

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

    this.generatePaddles(this.config.paddles.length, this.radius);
    this.createGameField(this.radius);
    this.createBalls(this.config.balls);

    this.game.scene.add(this.field);
  }

  generatePaddles(player_count, radius) {
    const playerGeometry = new THREE.BoxGeometry(
      this.config.dimensions.paddle_length,
      this.config.dimensions.paddle_width,
      this.config.dimensions.paddle_length / 2
    );

    for (let i = 0; i < player_count; i++) {
      const playerMaterial = new THREE.MeshMatcapMaterial({
        map: this.game.skins[0],
      });
      const paddle = new THREE.Mesh(playerGeometry, playerMaterial);
      const angle = (i / player_count) * Math.PI * 2;
      const x = 0.9 * Math.cos(angle);
      const z = 0.9 * Math.sin(angle);
      paddle.position.set(x, 0.11, z);
      paddle.lookAt(0, 0.11, 0);
      paddle.castShadow = true;
      paddle.receiveShadow = true;

      this.game.paddles.set(i, paddle);
      this.field.add(this.game.paddles.get(i));

      const sectorAngle = (2 * Math.PI) / player_count;
      const startAngle = ((i - 0.5) / player_count) * Math.PI * 2;
      const ringGeometry = new THREE.RingGeometry(
        radius - 0.05,
        radius,
        32,
        1,
        startAngle,
        sectorAngle
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
  createGameField(radius) {
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
    if (this.game.ui.isActive) {
      this.game.ui.createScoreTable(-2, 1, 0);
    }
    this.game.ui.updateScoreTable(gameState.scores);

    // update balls
    for (let i = 0; i < gameState.balls.length; i++) {
      this.game.balls[i].position.set(
        gameState.balls[i].x,
        0.08,
        gameState.balls[i].y
      );
    }

    // update paddles
    const totalSides = gameState.paddles.length;
    const radius = 0.9;

    const paddleArcLength = this.config.dimensions.paddle_length / radius;
    const sectorAngle = (2 * Math.PI) / totalSides;
    const availableRange = sectorAngle - paddleArcLength;

    for (let i = 0; i < totalSides; i++) {
      const paddle = this.game.paddles.get(i);
      if (!paddle) continue;

      const sideIndex = gameState.paddles[i].side_index;
      const position = gameState.paddles[i].position;

      const clampedPosition = position * availableRange;
      const startAngle = (sideIndex - 0.5) * sectorAngle;
      const angle = startAngle + paddleArcLength / 2 + clampedPosition;

      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      paddle.position.set(x, 0.11, z);

      paddle.lookAt(0, -0.29, 0);
      paddle.rotateY(Math.PI);
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
