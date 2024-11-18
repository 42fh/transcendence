import * as THREE from "three";
import GameConstructor from "./Game/Game.js";

const game = new GameConstructor();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
game.addSky(100, 10, 1.3, 0.001, 0.7, new THREE.Vector3(0.3, 0.001, -0.95));
game.addSea(300, 300, 0x001e0f, 0xffffff, 3.7);
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
    name: "paddle",
    type: "gltf",
    url: "static/models/paddle.gltf",
  },
  {
    name: "42berlin",
    type: "texture",
    url: "static/textures/player/42berlin.jpg",
    isSkin: true,
  },
  {
    name: "latvia",
    type: "texture",
    url: "static/textures/player/latvia.png",
    isSkin: true,
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
]);
game.connectToWebsockets();
game.world.addPerspectiveCamera();
game.world.addGame(game, false);
