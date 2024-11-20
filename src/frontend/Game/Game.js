import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import Loader from "../Utils/Loader.js";
import World from "../World/World.js";
import Debug from "../Utils/Debug.js";
import GameWebSocket from "../Utils/Websocket.js";
import Drawer from "../Utils/Drawer.js";
import GameUI from "../Utils/GameUI.js";

export default class GameConstructor {
  constructor() {
    this.world = new World(document.querySelector(".webgl"), false);

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

  loadResources(sources) {
    this.loader = new Loader(sources, this);

    window.addEventListener("resourcesLoaded", () => {
      this.loader.items["floorColorTexture"].colorSpace = THREE.SRGBColorSpace;
      this.loader.items["floorColorTexture"].repeat.set(4, 4);
      this.loader.items["floorNormalTexture"].repeat.set(4, 4);
      this.loader.items["floorDisplacementTexture"].repeat.set(4, 4);
      this.loader.items["floorARMTexture"].repeat.set(4, 4);
      this.loader.items["floorColorTexture"].wrapS = THREE.RepeatWrapping;
      this.loader.items["floorColorTexture"].wrapT = THREE.RepeatWrapping;
      this.loader.items["floorNormalTexture"].wrapS = THREE.RepeatWrapping;
      this.loader.items["floorNormalTexture"].wrapT = THREE.RepeatWrapping;
      this.loader.items["floorDisplacementTexture"].wrapS =
        THREE.RepeatWrapping;
      this.loader.items["floorDisplacementTexture"].wrapT =
        THREE.RepeatWrapping;
      this.loader.items["floorARMTexture"].wrapS = THREE.RepeatWrapping;
      this.loader.items["floorARMTexture"].wrapT = THREE.RepeatWrapping;
    });
  }

  connectToWebsockets() {
    document.querySelector(".joinGame").addEventListener("click", async () => {
      const gameId = document.getElementById("gameId").value;
      const playerId = this.generateRandomId();
      const gameType = "circular";
      const numPlayers = document.getElementById("playerCount").value;
      console.log("numPlayers: ", numPlayers);
      const numBalls = 1;
      const debug = true;

      try {
        this.config = {
          playerId,
          type: gameType,
          players: numPlayers,
          balls: numBalls,
          debug,
        };

        this.websocket = new GameWebSocket(
          gameId,
          playerId,
          this.handleMessage.bind(this),
          this.config
        );
        this.websocket.connect();

        console.log(`Connected to game ${gameId} as player ${playerId}`);
      } catch (error) {
        console.error("Game initialization error:", error);
      }
    });
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
          this.playerId = message.player_index;
          console.log("playerId: ", this.playerId);
          this.createGame(message.game_state);

          const playerAngle =
            (this.playerId / message.game_state.paddles.length) * Math.PI * 2;

          this.drawer.field.rotation.y = -playerAngle - Math.PI / 2;
          this.drawer.field.position.y = -0.4;
          break;

        case "game_state":
          this.drawer.updateGame(message.game_state);
          break;

        case "game_finished":
          console.log("game_finished: ", message);
          break;

        case "error":
          console.error("Error:", message);
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
}
