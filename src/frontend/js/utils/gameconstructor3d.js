import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import Loader from "./loader3d.js";
import World from "./world3d.js";
import Debug from "./debug3d.js";
import GameWebSocket from "./websocket3d.js";
import Drawer from "./drawer3d.js";
import GameUI from "./gameui3d.js";

export default class GameConstructor {
  constructor() {
    this.type = null;

    this.world = new World(document.querySelector(".webgl"), false, this);

    // Objects group
    this.gameGroup = new THREE.Group();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.add(this.gameGroup);

    // Loader
    this.loader = null;

    // Websocket
    this.websocket = null;

    // Skins
    this.skins = [];

    // Game Config
    this.config = {};

    this.balls = [];

    this.paddles = new Map();
    this.fin1 = null;

    // UI
    this.ui = new GameUI(this);
  }

  addAmbientLight(intensity, color) {
    const ambientLight = new THREE.AmbientLight(color, intensity);
    this.scene.add(ambientLight);
  }

  addDirectionalLight(intensity, color, Vector3) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(Vector3.x, Vector3.y, Vector3.z);
    this.scene.add(directionalLight);
  }

  addSky(
    size,
    turbidity,
    rayleigh,
    mieCoefficient,
    mieDirectionalG,
    sunPosition
  ) {
    const sky = new Sky();
    sky.scale.setScalar(size);
    sky.material.uniforms["turbidity"].value = turbidity;
    sky.material.uniforms["rayleigh"].value = rayleigh;
    sky.material.uniforms["mieCoefficient"].value = mieCoefficient;
    sky.material.uniforms["mieDirectionalG"].value = mieDirectionalG;
    sky.material.uniforms["sunPosition"].value.set(
      sunPosition.x,
      sunPosition.y,
      sunPosition.z
    );
    this.scene.add(sky);
  }

  addSea(width, height, waterColor, sunColor, distortionScale) {
    const waterGeometry = new THREE.PlaneGeometry(width, height);

    this.water = new Water(waterGeometry, {
      textureWidth: 200,
      textureHeight: 200,
      waterNormals: new THREE.TextureLoader().load(
        "static/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor,
      waterColor,
      distortionScale,
      fog: this.scene.fog !== undefined,
    });

    this.water.rotation.x = -Math.PI / 2;
    this.water.material.uniforms["size"].value = 10;
    this.water.position.y = -0.5;
    this.scene.add(this.water);
  }

  addObjects(objects) {
    for (const object of objects) {
      this.gameGroup.add(object);
    }
  }

  addGameLoop(loop) {
    this.gameLoop = loop;
  }

  loadResources(sources, setupResources) {
    console.log("loading...");
    this.loader = new Loader(sources, this);
    this.setupResources = setupResources;
  }

  connectToWebsockets() {
    document.querySelector(".joinGame").addEventListener("click", async () => {
      const gameId = document.getElementById("gameId").value;
      const playerId = this.generateRandomId();
      const gameType = document.getElementById("gameType").value;
      const numPlayers = document.getElementById("playerCount").value;
      const numBalls = 1;
      const debug = true;

      this.type = gameType;

      const gameConfig = {
        gameId,
        playerId,
        type: gameType == "circular" ? "circular" : "polygon",
        pongType: gameType,
        players: numPlayers,
        balls: numBalls,
        debug,
        sides: gameType == "circular" ? numPlayers : numPlayers * 2,
        shape: undefined,
        scoreMode: "classic",
      };
      console.log("Connecting to game", gameConfig);

      const success = await this.directConnect(gameId, {
        ...gameConfig,
        onMessage: (data) => {
          console.log(JSON.stringify(data));
        },
      });

      console.log("Connected to game", success);
    });
  }

  async directConnect(gameId, config = {}) {
    try {
      this.gameId = gameId;
      this.playerId =
        config.playerId || "player-" + Math.random().toString(36).substr(2, 9);

      this.websocket = new GameWebSocket(
        gameId,
        this.playerId,
        this.handleMessage.bind(this),
        config
      );
      this.websocket.connect();

      return true;
    } catch (error) {
      console.error("Failed to connect directly:", error);
      return false;
    }
  }

  createGame(initialState) {
    this.drawer = new Drawer(initialState, this);
    this.ui.createSelector();

    this.scores = new Map();
    for (let i = 0; i < initialState.paddles.length; i++) {
      this.scores.set(i, 0);
    }
    this.world.audio.addAmbientSound("static/music/sea.mp3");
  }

  generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
  }

  handleMessage(message) {
    try {
      switch (message.type) {
        case "initial_state":
          console.log("initial_state: ", message);
          this.playerIndex = message.player_index;
          this.createGame(message.game_state);

          const div = document.getElementById("menu");
          div.style.display = "none";

          if (this.type == "circular") {
            const playerAngle =
              (this.playerIndex / message.game_state.paddles.length) *
              Math.PI *
              2;
            this.drawer.field.rotation.y = -playerAngle - Math.PI / 2;
            this.drawer.field.position.y = -0.4;
          }
          this.world.zoomToPlayer();
          break;

        case "game_state":
          this.drawer.updateGame(message.game_state);
          break;

        case "game_event":
          console.log("game_event", message);
          if (message.game_state.type == "paddle_hit") {
            this.world.audio.playSound("static/sounds/paddle.mp3");
          }
          break;
        case "game_finished":
          console.log("game_finished: ", message);
          this.ui.createEndScreen(message);
          break;

        default:
          console.log("Unknown message type:", message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
}
