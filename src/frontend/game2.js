import * as THREE from "three";
import World from "./World/World.js";
import GameConstructor from "./Game/Game.js";

const game = new GameConstructor();
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
