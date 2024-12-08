import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import Loader from "./loader3d.js";
import World from "./world3d.js";
import Debug from "./debug3d.js";
import GameWebSocket from "./websocket3d.js";
import Drawer from "./drawer3d.js";
import GameUI from "./gameui3d.js";
import { createGame } from "../services/gameService.js";
import {
  fetchWaitingGames,
  joinGame,
  findMatchingGame,
} from "../services/gameService.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { showToast } from "./toast.js";

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

    // User ID
    this.userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  }

  addAmbientLight(intensity, color) {
    const ambientLight = new THREE.AmbientLight(color, intensity);
    this.scene.add(ambientLight);
  }

  addDirectionalLight(intensity, color, Vector3) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(Vector3.x, Vector3.y, Vector3.z);
    directionalLight.castShadow = true;
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

  async connectToWebsockets() {
    try {
      const data = {
        mode: "circular",
        gameType: "circular",
        numPlayers: 2,
        numSides: 3,
        numBalls: 1,
        scoreMode: "classic",
        debug: true,
      };
      // const data = {
      //   mode: "classic",
      //   gameType: "classic",
      //   numPlayers: 2,
      //   numSides: 4,
      //   numBalls: 1,
      //   scoreMode: "classic",
      //   debug: true,
      // };
      this.type = "circular";

      const games = await fetchWaitingGames();
      const matchingGameId = findMatchingGame(games, data);

      let result = null;
      if (matchingGameId) {
        result = await joinGame(matchingGameId);
        console.log("Join game result:", result);
      } else {
        result = await createGame(data);
        console.log("Game creation result:", result);
      }

      this.websocket = new GameWebSocket(this.handleMessage.bind(this));
      this.websocket.connect(result.ws_url);
    } catch (error) {
      console.error("Error creating game:", error);
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
          this.lastWaitingMessage = Date.now();
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
            this.world.audio.playSound("static/sounds/paddle.mp3", 0.3);
          } else if (message.game_state.type == "wall_hit") {
            this.world.audio.playSound("static/sounds/wall-hit.mp3", 0.5);
          }
          break;
        case "player_joined":
          console.log("player_joined: ", message);
          while (message.player_index >= 0) {
            this.paddles.get(message.player_index).material.map = this.skins[0];
            message.player_index--;
          }
          showToast("Player joined");
          break;
        case "waiting":
          if (Date.now() - this.lastWaitingMessage > 10000) {
            showToast(
              `Waiting for ${
                message.required_players - message.current_players
              } player${
                message.required_players - message.current_players > 1
                  ? "s"
                  : ""
              }`
            );
            this.lastWaitingMessage = Date.now();
          }
          break;
        case "game_finished":
          console.log("game_finished: ", message);
          showToast("Game finished: " + message.message);
          break;
        case "error":
          console.error("Error message:", message);
          showToast(message.message, true);
          break;
        default:
          console.log("Unknown message type:", message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
}
