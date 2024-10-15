import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { Sky } from 'three/addons/objects/Sky.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const gui = new GUI();

// scene
let scene = new THREE.Scene();
// scene.background = new THREE.Color(0x08121E);

// canvas from html
const canvas = document.querySelector(".webgl");

// camera
const aspectRatio = window.innerWidth / window.innerHeight;
const vertical_field_of_view = 75;
let camera = new THREE.PerspectiveCamera( vertical_field_of_view, aspectRatio, 0.1, 1000 );
camera.position.set(5, 5, 10);

// controls
let controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // makes controls smoother
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

// lights
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

// Sun light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(3, 2, -8)
scene.add(directionalLight)

// Sky
const sky = new Sky();
sky.scale.set(100, 100, 100);
sky.material.uniforms['turbidity'].value = 10;
sky.material.uniforms['rayleigh'].value = 3;
sky.material.uniforms['mieCoefficient'].value = 0.1;
sky.material.uniforms['mieDirectionalG'].value = 0.95;
sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95);
scene.add(sky);

const skyGroup = gui.addFolder('Sky');
skyGroup.add(sky.material.uniforms['turbidity'], 'value').min(0).max(20).step(0.1).name('Turbidity');
skyGroup.add(sky.material.uniforms['rayleigh'], 'value').min(0).max(4).step(0.1).name('Rayleigh');
skyGroup.add(sky.material.uniforms['mieCoefficient'], 'value').min(0).max(0.1).step(0.001).name('Mie coefficient');
skyGroup.add(sky.material.uniforms['mieDirectionalG'], 'value').min(0).max(1).step(0.001).name('Mie directional G');
skyGroup.add(sky.material.uniforms['sunPosition'].value, 'x').min(-1).max(1).step(0.001).name('Sun x');

// Helper function to set properties
function setupModel(gltfScene, scale, position, rotation) {
    gltfScene.scale.set(scale.x, scale.y, scale.z);
    gltfScene.position.set(position.x, position.y, position.z);
    if (rotation) {
        gltfScene.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    }
    scene.add(gltfScene);
}


// Models
const gltfLoader = new GLTFLoader();
// Load models in parallel using Promise.all
Promise.all([
    gltfLoader.loadAsync('static/models/palm/quiver_tree_02_1k.gltf'),
    gltfLoader.loadAsync('static/models/bush/fern_02_1k.gltf'),
    gltfLoader.loadAsync('static/models/coconut/scene.gltf'),
    gltfLoader.loadAsync('static/models/umbrella/scene.gltf'),
    gltfLoader.loadAsync('static/models/ball/scene.gltf'),
    gltfLoader.loadAsync('static/models/chair/plastic_monobloc_chair_01_1k.gltf'),
    gltfLoader.loadAsync('static/models/log/dead_quiver_trunk_1k.gltf'),
    gltfLoader.loadAsync('static/models/duck/rubber_duck_toy_1k.gltf')
]).then(models => {
    // Palm trees
    setupModel(models[0].scene, {x: 6, y: 6, z: 6}, {x: 9, y: 0, z: 0});
    setupModel(models[0].scene.clone(), {x: 6, y: 6, z: 6}, {x: -9, y: 0, z: 0});

    // Bush
    setupModel(models[1].scene, {x: 3, y: 3, z: 3}, {x: 8, y: 0, z: -2});

    // Coconut
    setupModel(models[2].scene, {x: 1, y: 1, z: 1}, {x: 8, y: 0.5, z: -5});

    // Umbrella
    setupModel(models[3].scene, {x: 0.01, y: 0.01, z: 0.01}, {x: 9, y: -0.3, z: 5}, {x: Math.PI * 0.08});

    // Ball
    setupModel(models[4].scene, {x: 0.5, y: 0.5, z: 0.5}, {x: -9, y: 0.5, z: 5});

    // Chairs
    setupModel(models[5].scene, {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -6}, {y: Math.PI * 0.5});
    setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -4}, {y: Math.PI * 0.5});
    setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -2}, {y: Math.PI * 0.5});

    // Logs
    setupModel(models[6].scene, {x: 8, y: 10, z: 10}, {x: -6, y: 0.5, z: -10}, {x: Math.PI * 0.5, y: Math.PI * 0.5});
    setupModel(models[6].scene.clone(), {x: 8, y: 10, z: 10}, {x: 6, y: 0.5, z: 10}, {x: Math.PI * 0.5, z: Math.PI});

    // Rubber Duck
    setupModel(models[7].scene, {x: 2, y: 2, z: 2}, {x: -8.5, y: 0.9, z: -2}, {y: Math.PI * 0.5});
}).catch(error => {
    console.error('Error loading models:', error);
});

// Textures
const textureLoader = new THREE.TextureLoader();

// Floor textures
const floorAplhaTexture = textureLoader.load('static/floor/alpha.webp');
const floorColorTexture = textureLoader.load('static/floor/color.jpg');
const floorNormalTexture = textureLoader.load('static/floor/normal.jpg');
const floorDisplacementTexture = textureLoader.load('static/floor/displacement.jpg');
const floorARMTexture = textureLoader.load('static/floor/arm.jpg');

floorColorTexture.colorSpace = THREE.SRGBColorSpace

floorColorTexture.repeat.set(4, 4);
floorNormalTexture.repeat.set(4, 4);
floorDisplacementTexture.repeat.set(4, 4);
floorARMTexture.repeat.set(4, 4);
floorColorTexture.wrapS = THREE.RepeatWrapping;
floorColorTexture.wrapT = THREE.RepeatWrapping;
floorDisplacementTexture.wrapT = THREE.RepeatWrapping;
floorDisplacementTexture.wrapS = THREE.RepeatWrapping;
floorARMTexture.wrapT = THREE.RepeatWrapping;
floorARMTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;

// playground group
const playground = new THREE.Group();

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30, 100, 100),
    new THREE.MeshStandardMaterial({ 
        // color: '#fffdff',
        alphaMap: floorAplhaTexture,
        transparent: true,
        map: floorColorTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        roughnessMap: floorARMTexture,
        aoMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        displacementScale: 0.2,
        displacementBias: -0.1,
     })
)
gui.add(floor.material, 'displacementScale').min(0).max(1).step(0.001).name('Displacement scale');
gui.add(floor.material, 'displacementBias').min(-1).max(1).step(0.001).name('Displacement bias');
floor.rotation.x = - Math.PI * 0.5;
playground.add(floor);
scene.add(playground);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

// game loop
renderer.setAnimationLoop( () => {
    controls.update();
	renderer.render( scene, camera );
});