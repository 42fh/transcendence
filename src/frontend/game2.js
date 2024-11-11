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
    name: "floorAplhaTexture",
    type: "texture",
    url: "static/textures/floor/alpha.webp",
  },
  {
    name: "floorColorTexture",
    type: "texture",
    url: "static/textures/floor/color.jpg",
  },
  {
    name: "floorNormalTexture",
    type: "texture",
    url: "static/textures/floor/normal.jpg",
  },
  {
    name: "floorDisplacementTexture",
    type: "texture",
    url: "static/textures/floor/displacement.jpg",
  },
  {
    name: "floorARMTexture",
    type: "texture",
    url: "static/textures/floor/arm.jpg",
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
