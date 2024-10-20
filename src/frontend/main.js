import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import World from './World/World.js';
import Game from './Game/Game.js';

const world = new World(document.querySelector('.webgl'));

const game = new Game();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
game.addSky(1000, 10, 1.3, 0.001, 0.7, new THREE.Vector3(0.3, 0.001, -0.95));
game.addSea(1000, 1000, 0x001e0f, 0xffffff, 3.7);

function gameLoop(world, scene) {

    world.game.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    
    // const sharkAngle = 0.0003;

    // if (this.sharkFin1) {
    //     this.sharkFin1.position.x = Math.cos(sharkAngle) * 20;
    //     this.sharkFin1.position.z = Math.sin(sharkAngle) * 20;
    //     this.sharkFin1.rotation.y = Math.PI - sharkAngle;
    // }

    // if (this.sharkFin2) {
    //     this.sharkFin2.position.x = Math.cos(-sharkAngle) * 30;
    //     this.sharkFin2.position.z = Math.sin(-sharkAngle) * 30;
    //     this.sharkFin2.rotation.y = sharkAngle;
    // }

    // if (this.sharkFin3) {
    //     this.sharkFin3.position.x = Math.cos(sharkAngle) * 40;
    //     this.sharkFin3.position.z = Math.sin(sharkAngle) * 40;
    //     this.sharkFin3.rotation.y = Math.PI - sharkAngle;
    // }
    console.log(world.game.sky)
    world.controls.update();
	world.renderer.render( scene, world.camera );
};

game.addGameLoop(gameLoop);

world.addGame(game);

// const waterUniforms = water.material.uniforms;

// const island = new THREE.Group();
// island.position.y = 1;
// scene.add(island);
// // Helper function to set properties
// function setupModel(gltfScene, scale, position, rotation) {
//     gltfScene.scale.set(scale.x, scale.y, scale.z);
//     gltfScene.position.set(position.x, position.y, position.z);
//     if (rotation) {
//         gltfScene.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
//     }
//     island.add(gltfScene);
// }

// // Models
// const gltfLoader = new GLTFLoader();
// Promise.all([
//     gltfLoader.loadAsync('static/models/palm/quiver_tree_02_1k.gltf'),
//     gltfLoader.loadAsync('static/models/bush/fern_02_1k.gltf'),
//     gltfLoader.loadAsync('static/models/coconut/scene.gltf'),
//     gltfLoader.loadAsync('static/models/umbrella/scene.gltf'),
//     gltfLoader.loadAsync('static/models/ball/scene.gltf'),
//     gltfLoader.loadAsync('static/models/chair/plastic_monobloc_chair_01_1k.gltf'),
//     gltfLoader.loadAsync('static/models/log/dead_quiver_trunk_1k.gltf'),
//     gltfLoader.loadAsync('static/models/duck/rubber_duck_toy_1k.gltf'),
//     gltfLoader.loadAsync('static/models/glasses/scene.gltf'),
//     // gltfLoader.loadAsync('static/models/fin/scene.gltf')
// ]).then(models => {
//     // Palm trees
//     setupModel(models[0].scene, {x: 6, y: 6, z: 6}, {x: 12, y: 0, z: 0});
//     setupModel(models[0].scene.clone(), {x: 6, y: 6, z: 6}, {x: -12, y: 0, z: 0});

//     // Bush
//     setupModel(models[1].scene, {x: 3, y: 3, z: 3}, {x: 11, y: 0, z: -2});

//     // Coconut
//     setupModel(models[2].scene, {x: 1, y: 1, z: 1}, {x: 11, y: 0.5, z: -5});
//     setupModel(models[2].scene.clone(), {x: 1, y: 1, z: 1}, {x: -11.5, y: 1.3, z: 4}, {z: Math.PI, x: Math.PI * 0.2});

//     // Umbrella
//     setupModel(models[3].scene, {x: 0.01, y: 0.01, z: 0.01}, {x: 12, y: -0.3, z: 5}, {x: Math.PI * 0.08});

//     // Ball
//     setupModel(models[4].scene, {x: 0.5, y: 0.5, z: 0.5}, {x: 11, y: 0.5, z: 4});

//     // Chairs
//     setupModel(models[5].scene, {x: 2, y: 2, z: 2}, {x: -11.5, y: 0, z: 6}, {y: Math.PI * 0.5});
//     setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -11.5, y: 0, z: 4}, {y: Math.PI * 0.5});
//     setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -11.5, y: 0, z: 2}, {y: Math.PI * 0.5});

//     // Logs
//     setupModel(models[6].scene, {x: 8, y: 14, z: 10}, {x: -9, y: 0.5, z: -15}, {x: Math.PI * 0.5, y: Math.PI * 0.5});
//     setupModel(models[6].scene.clone(), {x: 8, y: 14, z: 10}, {x: 9, y: 0.5, z: 13}, {x: Math.PI * 0.5, z: Math.PI});

//     // Rubber Duck
//     setupModel(models[7].scene, {x: 4, y: 4, z: 4}, {x: -11.5, y: 0.9, z: 2}, {y: Math.PI * 0.5});

//     // Glasses
//     setupModel(models[8].scene, {x: 0.8, y: 0.8, z: 0.8}, {x: -11.32, y: 1.4, z: 3.97}, {y: Math.PI});
// }).catch(error => {
//     console.error('Error loading models:', error);
// });

// let sharkFin1;
// let sharkFin2;
// let sharkFin3;

// gltfLoader.load('static/models/fin/scene.gltf', (gltf) => {
//     gltf.scene.scale.set(2, 2, 2);
//     sharkFin1 = gltf.scene;
//     sharkFin2 = gltf.scene.clone();
//     sharkFin3 = gltf.scene.clone();
//     scene.add(sharkFin1);
//     scene.add(sharkFin2);
//     scene.add(sharkFin3);
//     sharkFin1.rotation.y = Math.PI; // 180 degrees in radians
//     sharkFin2.rotation.y = Math.PI;
//     sharkFin3.rotation.y = Math.PI;

// });

// Textures
// const textureLoader = new THREE.TextureLoader();

// // Floor textures
// const floorAplhaTexture = textureLoader.load('static/textures/floor/alpha.webp');
// const floorColorTexture = textureLoader.load('static/textures/floor/color.jpg');
// const floorNormalTexture = textureLoader.load('static/textures/floor/normal.jpg');
// const floorDisplacementTexture = textureLoader.load('static/textures/floor/displacement.jpg');
// const floorARMTexture = textureLoader.load('static/textures/floor/arm.jpg');

// floorColorTexture.colorSpace = THREE.SRGBColorSpace

// floorColorTexture.repeat.set(4, 4);
// floorNormalTexture.repeat.set(4, 4);
// floorDisplacementTexture.repeat.set(4, 4);
// floorARMTexture.repeat.set(4, 4);
// floorColorTexture.wrapS = THREE.RepeatWrapping;
// floorColorTexture.wrapT = THREE.RepeatWrapping;
// floorDisplacementTexture.wrapT = THREE.RepeatWrapping;
// floorDisplacementTexture.wrapS = THREE.RepeatWrapping;
// floorARMTexture.wrapT = THREE.RepeatWrapping;
// floorARMTexture.wrapS = THREE.RepeatWrapping;
// floorNormalTexture.wrapS = THREE.RepeatWrapping;
// floorNormalTexture.wrapT = THREE.RepeatWrapping;

// // Player textures
// const playerColorTexture = textureLoader.load('static/textures/player/color.jpg');
// const playerNormalTexture = textureLoader.load('static/textures/player/normal.jpg');
// const playerARMTexture = textureLoader.load('static/textures/player/arm.jpg');

// playerColorTexture.colorSpace = THREE.SRGBColorSpace

// // playground group
// const playground = new THREE.Group();

// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(45, 42, 100, 100),
//     new THREE.MeshStandardMaterial({ 
//         color: '#fffdff',
//         alphaMap: floorAplhaTexture,
//         transparent: true,
//         map: floorColorTexture,
//         normalMap: floorNormalTexture,
//         displacementMap: floorDisplacementTexture,
//         roughnessMap: floorARMTexture,
//         aoMap: floorARMTexture,
//         metalnessMap: floorARMTexture,
//         displacementScale: 0.2,
//         displacementBias: -0.1,
//      })
// );

// floor.rotation.x = - Math.PI * 0.5;
// floor.position.y = 1;
// playground.add(floor);

// const player1 = new THREE.Mesh(
//     new THREE.BoxGeometry(3, 1, 1),
//     new THREE.MeshStandardMaterial({ 
//         map: playerColorTexture,
//         normalMap: playerNormalTexture,
//         roughnessMap: playerARMTexture,
//         aoMap: playerARMTexture,
//         metalnessMap: playerARMTexture,
//      })
// )
// player1.position.set(0, 1.6, 12);
// playground.add(player1);

// const player2 = new THREE.Mesh(
//     new THREE.BoxGeometry(3, 1, 1),
//     new THREE.MeshStandardMaterial({ color: 'blue' })
// )
// player2.position.set(0, 1.6, -12);
// playground.add(player2);
// scene.add(playground);
