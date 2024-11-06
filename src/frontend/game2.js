import * as THREE from "three";
import World from "./World/World.js";
import GameConstructor from "./Game/Game.js";

const game = new GameConstructor();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
game.loadResources([
  { name: "floorChecker", type: "texture", url: "static/textures/checker.png" },
]);
game.connectToWebsockets();

const world = new World(document.querySelector(".webgl"), false);
world.addPerspectiveCamera();
world.addGame(game, false);
