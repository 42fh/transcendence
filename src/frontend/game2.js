import * as THREE from "three";
import World from "./World/World.js";
import GameConstructor from "./Game/Game.js";

const game = new GameConstructor();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
game.addSky(1000, 10, 1.3, 0.001, 0.7, new THREE.Vector3(0.3, 0.001, -0.95));
game.addSea(1000, 1000, 0x001e0f, 0xffffff, 3.7);
game.loadResources([
  {
    name: "floorChecker",
    type: "texture",
    url: "static/textures/checker.png",
    isSkin: false,
  },
  {
    name: "sand",
    type: "texture",
    url: "static/textures/floor/color.jpg",
    isSkin: true,
  },
  {
    name: "stone",
    type: "texture",
    url: "static/textures/player/color.jpg",
    isSkin: true,
  },
]);
game.connectToWebsockets();

const world = new World(document.querySelector(".webgl"), false);
world.addPerspectiveCamera();
world.addGame(game, false);
