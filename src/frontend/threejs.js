import * as THREE from "three";
import GameConstructor from "./Game/Game.js";

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
      name: "palmTree",
      type: "gltf",
      url: "static/models/palm/quiver_tree_02_1k.gltf",
    },
    { name: "bush", type: "gltf", url: "static/models/bush/fern_02_1k.gltf" },
    { name: "coconut", type: "gltf", url: "static/models/coconut/scene.gltf" },
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
      name: "log",
      type: "gltf",
      url: "static/models/log/dead_quiver_trunk_1k.gltf",
    },
    {
      name: "duck",
      type: "gltf",
      url: "static/models/duck/rubber_duck_toy_1k.gltf",
    },
    { name: "glasses", type: "gltf", url: "static/models/glasses/scene.gltf" },
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
    this.loader.items["floorColorTexture"].repeat.set(4, 4);
    this.loader.items["floorNormalTexture"].repeat.set(4, 4);
    this.loader.items["floorDisplacementTexture"].repeat.set(4, 4);
    this.loader.items["floorARMTexture"].repeat.set(4, 4);
    this.loader.items["floorColorTexture"].wrapS = THREE.RepeatWrapping;
    this.loader.items["floorColorTexture"].wrapT = THREE.RepeatWrapping;
    this.loader.items["floorNormalTexture"].wrapS = THREE.RepeatWrapping;
    this.loader.items["floorNormalTexture"].wrapT = THREE.RepeatWrapping;
    this.loader.items["floorDisplacementTexture"].wrapS = THREE.RepeatWrapping;
    this.loader.items["floorDisplacementTexture"].wrapT = THREE.RepeatWrapping;
    this.loader.items["floorARMTexture"].wrapS = THREE.RepeatWrapping;
    this.loader.items["floorARMTexture"].wrapT = THREE.RepeatWrapping;

    const GAME_HEIGHT = 1;
    const GAME_WIDTH = 0.5;

    // Palm trees
    const palmTree = this.loader.items["palmTree"].scene;
    palmTree.scale.set(6, 6, 10);
    palmTree.position.set(18, 0, 12);

    const palmTree2 = palmTree.clone();
    palmTree2.position.set(-6, 0, 12);

    // Bush
    const bush = this.loader.items["bush"].scene;
    bush.scale.set(3, 3, 3);
    bush.position.set(17, 0, 10);

    // Coconut
    const coconut = this.loader.items["coconut"].scene;
    coconut.scale.set(1, 1, 1);
    coconut.position.set(17, 0.5, 7);

    const coconut2 = coconut.clone();
    coconut2.position.set(-5.5, 1.3, 16);
    coconut2.rotation.set(Math.PI, Math.PI * 0.2, 0);

    // Umbrella
    const umbrella = this.loader.items["umbrella"].scene;
    umbrella.scale.set(0.01, 0.01, 0.01);
    umbrella.position.set(18, -0.3, 17);
    umbrella.rotation.set(0, Math.PI * 0.08, 0);

    // Ball
    const ball = this.loader.items["ball"].scene;
    ball.scale.set(0.5, 0.5, 0.5);
    ball.position.set(17, 0.5, 16);

    // Chairs
    const chair = this.loader.items["chair"].scene;
    chair.scale.set(2, 2, 2);
    chair.position.set(-5.5, 0, 18);
    chair.rotation.set(0, Math.PI * 0.5, 0);

    const chair2 = chair.clone();
    chair2.position.set(-5.5, 0, 16);

    const chair3 = chair.clone();
    chair3.position.set(-5.5, 0, 14);

    // Logs
    const log = this.loader.items["log"].scene;
    log.scale.set(8, 14, 10);
    log.position.set(GAME_WIDTH - GAME_WIDTH - 0.8, 0.5, -3);
    log.rotation.set(Math.PI * 0.5, Math.PI * 0.5, 0);

    const log2 = log.clone();
    log2.position.set(GAME_WIDTH + 0.8, 0.5, 25);
    log2.rotation.set(Math.PI * 0.5, 0, Math.PI);

    // Rubber Duck
    const duck = this.loader.items["duck"].scene;
    duck.scale.set(4, 4, 4);
    duck.position.set(-5.5, 0.9, 14);
    duck.rotation.set(0, Math.PI * 0.5, 0);

    // Glasses
    const glasses = this.loader.items["glasses"].scene;
    glasses.scale.set(0.8, 0.8, 0.8);
    glasses.position.set(-5.32, 1.4, 16.02);
    glasses.rotation.set(0, Math.PI, 0);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(45, 42, 100, 100),
      new THREE.MeshStandardMaterial({
        color: "#fffdff",
        alphaMap: this.loader.items["floorAplhaTexture"],
        transparent: true,
        map: this.loader.items["floorColorTexture"],
        normalMap: this.loader.items["floorNormalTexture"],
        displacementMap: this.loader.items["floorDisplacementTexture"],
        roughnessMap: this.loader.items["floorARMTexture"],
        aoMap: this.loader.items["floorARMTexture"],
        metalnessMap: this.loader.items["floorARMTexture"],
        displacementScale: 0.2,
        displacementBias: -0.1,
      })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = 0.1;
    floor.position.x = 6;
    floor.position.z = 12;

    // Fins
    const sharkFin1 = this.loader.items["fin"].scene;
    sharkFin1.name = "sharkFin1";
    sharkFin1.scale.set(2, 2, 2);
    sharkFin1.position.set(6, 0, 12);
    sharkFin1.rotation.y = Math.PI;

    const sharkFin2 = sharkFin1.clone();
    sharkFin2.name = "sharkFin2";

    const sharkFin3 = sharkFin1.clone();
    sharkFin3.name = "sharkFin3";

    this.addObjects([
      // palmTree,
      // palmTree2,
      // bush,
      // coconut,
      // coconut2,
      // umbrella,
      // ball,
      // chair,
      // chair2,
      // chair3,
      // log,
      // floor,
      // log2,
      // duck,
      // glasses,
      sharkFin1,
      sharkFin2,
      sharkFin3,
    ]);

    // this.fin1 = this.scene.children[0].getObjectByName("sharkFin1");
    // this.fin2 = this.scene.children[0].getObjectByName("sharkFin2");
    // this.fin3 = this.scene.children[0].getObjectByName("sharkFin3");
  }
);
game.connectToWebsockets();
game.world.addPerspectiveCamera();
game.world.addGame(game, false);
