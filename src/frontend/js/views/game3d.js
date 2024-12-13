import * as THREE from "three";
import GameConstructor from "../utils/gameconstructor3d.js";

export async function loadGame3D(wsUrl) {
  try {
    const template = document.getElementById("3d-game-template");
    if (!template) {
      throw new Error("Game template not found");
    }
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));
  } catch (error) {
    console.error("Error loading 3D game page:", error);
    return;
  }

  console.log("Loading 3D game...");
  const game = new GameConstructor();
  game.addAmbientLight(1, 0xffffff);
  game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
  game.addSky(1000, 10, 1.3, 0.001, 0.7, new THREE.Vector3(0.3, 0.001, -0.95));
  game.addSea(1000, 1000, 0x001e0f, 0xffffff, 3.7);
  game.loadResources(
    [
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
        name: "coconut",
        type: "gltf",
        url: "static/models/coconut/scene.gltf",
      },
      {
        name: "umbrella",
        type: "gltf",
        url: "static/models/umbrella/scene.gltf",
      },
      { name: "ball", type: "gltf", url: "static/models/ball/scene.gltf" },
      {
        name: "chair",
        type: "gltf",
        url: "static/models/chair/plastic_monobloc_chair_01_1k.gltf",
      },
      {
        name: "duck",
        type: "gltf",
        url: "static/models/duck/rubber_duck_toy_1k.gltf",
      },
      {
        name: "glasses",
        type: "gltf",
        url: "static/models/glasses/scene.gltf",
      },
      { name: "fin", type: "gltf", url: "static/models/fin/scene.gltf" },
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
    ],
    function setupResources() {
      this.loader.items["42berlin"].colorSpace = THREE.SRGBColorSpace;

      // Coconut
      const coconut = this.loader.items["coconut"].scene;
      coconut.scale.set(0.2, 0.2, 0.2);
      coconut.position.set(-1.5, -0.12, 0.5);
      coconut.rotation.set(Math.PI, Math.PI * 0.6, 0);

      // Umbrella
      const umbrella = this.loader.items["umbrella"].scene;
      umbrella.scale.set(0.002, 0.002, 0.002);
      umbrella.position.set(-1.6, -0.5, 0);
      umbrella.rotation.set(0, Math.PI * 2, 0);

      // Ball
      const ball = this.loader.items["ball"].scene;
      ball.scale.set(0.08, 0.08, 0.08);
      ball.position.set(1.32, -0.35, 0.82);

      // Chairs
      const chair = this.loader.items["chair"].scene;
      chair.scale.set(0.4, 0.4, 0.4);
      chair.position.set(-1.5, -0.4, 0.5);
      chair.rotation.set(0, Math.PI * 0.5, 0);

      const chair2 = chair.clone();
      chair2.position.set(-1.5, -0.4, -0.5);

      // Rubber Duck
      const duck = this.loader.items["duck"].scene;
      duck.scale.set(0.9, 0.9, 0.9);
      duck.position.set(-1.5, -0.23, -0.52);
      duck.rotation.set(0, Math.PI * 0.5, 0);

      // Glasses
      const glasses = this.loader.items["glasses"].scene;
      glasses.scale.set(0.15, 0.15, 0.15);
      glasses.position.set(-1.45, -0.1, 0.5);
      glasses.rotation.set(0, Math.PI, 0);

      // Fins
      const sharkFin1 = this.loader.items["fin"].scene;
      sharkFin1.name = "sharkFin1";
      sharkFin1.scale.set(0.4, 0.4, 0.4);
      sharkFin1.position.set(6, -0.5, 12);
      sharkFin1.rotation.y = Math.PI;

      const sharkFin2 = sharkFin1.clone();
      sharkFin2.name = "sharkFin2";

      const sharkFin3 = sharkFin1.clone();
      sharkFin3.name = "sharkFin3";

      this.addObjects([
        coconut,
        umbrella,
        ball,
        chair,
        chair2,
        duck,
        glasses,
        sharkFin1,
        sharkFin2,
        sharkFin3,
      ]);

      this.fin1 = this.scene.children[0].getObjectByName("sharkFin1");
      this.fin2 = this.scene.children[0].getObjectByName("sharkFin2");
      this.fin3 = this.scene.children[0].getObjectByName("sharkFin3");
    }
  );
  game.connectToWebsockets(wsUrl);
  game.world.addPerspectiveCamera();
  game.world.addGame(game, false);
}
