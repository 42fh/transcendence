import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
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
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

// Sun light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(3, 7.5, 3)
scene.add(directionalLight)
gui.add(directionalLight.position, 'x').min(-10).max(10).step(0.001).name('Light x');
gui.add(directionalLight.position, 'y').min(-10).max(10).step(0.001).name('Light y');
gui.add(directionalLight.position, 'z').min(-10).max(10).step(0.001).name('Light z');

// // Sky
const sky = new Sky();
sky.scale.setScalar(1000);
sky.material.uniforms['turbidity'].value = 10;
sky.material.uniforms['rayleigh'].value = 1.3;
sky.material.uniforms['mieCoefficient'].value = 0.001;
sky.material.uniforms['mieDirectionalG'].value = 0.7;
sky.material.uniforms['sunPosition'].value.set(0.3, 0.001, -0.95);
scene.add(sky);

const skyGroup = gui.addFolder('Sky');
skyGroup.add(sky.material.uniforms['turbidity'], 'value').min(0).max(20).step(0.1).name('Turbidity');
skyGroup.add(sky.material.uniforms['rayleigh'], 'value').min(0).max(4).step(0.1).name('Rayleigh');
skyGroup.add(sky.material.uniforms['mieCoefficient'], 'value').min(0).max(0.1).step(0.001).name('Mie coefficient');
skyGroup.add(sky.material.uniforms['mieDirectionalG'], 'value').min(0).max(1).step(0.001).name('Mie directional G');
skyGroup.add(sky.material.uniforms['sunPosition'].value, 'x').min(-1).max(1).step(0.001).name('Sun x');
skyGroup.add(sky.material.uniforms['sunPosition'].value, 'y').min(-1).max(1).step(0.001).name('Sun y');
skyGroup.add(sky.material.uniforms['sunPosition'].value, 'z').min(-1).max(1).step(0.001).name('Sun z');

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

let water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load( 'static/textures/waternormals.jpg', function ( texture ) {

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = - Math.PI / 2;
water.material.uniforms['size'].value = 10;
scene.add( water );

const waterUniforms = water.material.uniforms;
const folderWater = gui.addFolder( 'Water' );
folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );

const island = new THREE.Group();
island.position.y = 1;
scene.add(island);
// Helper function to set properties
function setupModel(gltfScene, scale, position, rotation) {
    gltfScene.scale.set(scale.x, scale.y, scale.z);
    gltfScene.position.set(position.x, position.y, position.z);
    if (rotation) {
        gltfScene.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    }
    island.add(gltfScene);
}

// // Models
const gltfLoader = new GLTFLoader();
Promise.all([
    gltfLoader.loadAsync('static/models/palm/quiver_tree_02_1k.gltf'),
    gltfLoader.loadAsync('static/models/bush/fern_02_1k.gltf'),
    gltfLoader.loadAsync('static/models/coconut/scene.gltf'),
    gltfLoader.loadAsync('static/models/umbrella/scene.gltf'),
    gltfLoader.loadAsync('static/models/ball/scene.gltf'),
    gltfLoader.loadAsync('static/models/chair/plastic_monobloc_chair_01_1k.gltf'),
    gltfLoader.loadAsync('static/models/log/dead_quiver_trunk_1k.gltf'),
    gltfLoader.loadAsync('static/models/duck/rubber_duck_toy_1k.gltf'),
    // gltfLoader.loadAsync('static/models/fin/scene.gltf')
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
    setupModel(models[4].scene, {x: 0.5, y: 0.5, z: 0.5}, {x: 8, y: 0.5, z: 4});

    // Chairs
    setupModel(models[5].scene, {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -6}, {y: Math.PI * 0.5});
    setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -4}, {y: Math.PI * 0.5});
    setupModel(models[5].scene.clone(), {x: 2, y: 2, z: 2}, {x: -8.5, y: 0, z: -2}, {y: Math.PI * 0.5});

    // Logs
    setupModel(models[6].scene, {x: 8, y: 10, z: 10}, {x: -6, y: 0.5, z: -10}, {x: Math.PI * 0.5, y: Math.PI * 0.5});
    setupModel(models[6].scene.clone(), {x: 8, y: 10, z: 10}, {x: 6, y: 0.5, z: 10}, {x: Math.PI * 0.5, z: Math.PI});

    // Rubber Duck
    setupModel(models[7].scene, {x: 2, y: 2, z: 2}, {x: -8.5, y: 0.9, z: -2}, {y: Math.PI * 0.5});

    // Shark Fins
    // setupModel(models[8].scene, {x: 2, y: 2, z: 2}, {x: 8, y: 2, z: -8});
}).catch(error => {
    console.error('Error loading models:', error);
});

let sharkFin1;
let sharkFin2;
let sharkFin3;

gltfLoader.load('static/models/fin/scene.gltf', (gltf) => {
    gltf.scene.scale.set(2, 2, 2);
    sharkFin1 = gltf.scene;
    sharkFin2 = gltf.scene.clone();
    sharkFin3 = gltf.scene.clone();
    scene.add(sharkFin1);
    scene.add(sharkFin2);
    scene.add(sharkFin3);
    sharkFin1.rotation.y = Math.PI; // 180 degrees in radians
    sharkFin2.rotation.y = Math.PI;
    sharkFin3.rotation.y = Math.PI;

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
        color: '#fffdff',
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
floor.position.y = 1;
playground.add(floor);
scene.add(playground);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

let time = Date.now();

renderer.setAnimationLoop( () => {

    const deltaTime = time - Date.now();
    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    
    const sharkAngle = deltaTime * 0.0003;

    if (sharkFin1) {
        sharkFin1.position.x = Math.cos(sharkAngle) * 20;
        sharkFin1.position.z = Math.sin(sharkAngle) * 20;
        sharkFin1.rotation.y = Math.PI - sharkAngle;
    }

    if (sharkFin2) {
        sharkFin2.position.x = Math.cos(-sharkAngle) * 30;
        sharkFin2.position.z = Math.sin(-sharkAngle) * 30;
        sharkFin2.rotation.y = sharkAngle;
    }

    if (sharkFin3) {
        sharkFin3.position.x = Math.cos(sharkAngle) * 40;
        sharkFin3.position.z = Math.sin(sharkAngle) * 40;
        sharkFin3.rotation.y = Math.PI - sharkAngle;
    }

    controls.update();
	renderer.render( scene, camera );
});