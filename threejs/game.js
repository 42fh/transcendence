import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { Sky } from 'three/addons/objects/Sky.js';

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

// Walls textures
const wallColorTexture = textureLoader.load('static/walls/color.jpg');
const wallNormalTexture = textureLoader.load('static/walls/normal.jpg');
const wallARMTexture = textureLoader.load('static/walls/arm.jpg');
const wallDisplacementTexture = textureLoader.load('static/walls/displacement.jpg');

wallColorTexture.colorSpace = THREE.SRGBColorSpace

wallColorTexture.repeat.set(1, 5);
wallNormalTexture.repeat.set(1, 5);
wallARMTexture.repeat.set(1, 5);
wallDisplacementTexture.repeat.set(1, 5);
wallColorTexture.wrapS = THREE.RepeatWrapping;
wallColorTexture.wrapT = THREE.RepeatWrapping;
wallNormalTexture.wrapS = THREE.RepeatWrapping;
wallNormalTexture.wrapT = THREE.RepeatWrapping;
wallARMTexture.wrapS = THREE.RepeatWrapping;
wallARMTexture.wrapT = THREE.RepeatWrapping;

// playground group
const playground = new THREE.Group();
scene.add(playground);

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

const leftWall = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.7, 15, 2, 50, 50),
    new THREE.MeshStandardMaterial({ 
        map: wallColorTexture,
        normalMap: wallNormalTexture,
        roughnessMap: wallARMTexture,
        aoMap: wallARMTexture,
        metalnessMap: wallARMTexture,
        displacementMap: wallDisplacementTexture,
        displacementScale: 0.2,
     })
)
leftWall.rotation.x = - Math.PI * 0.5;
leftWall.position.y = 0.5;
leftWall.position.x = -6;
playground.add(leftWall);

const rightWall = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 15, 2, 50, 50),
    new THREE.MeshStandardMaterial({ 
        map: wallColorTexture,
        normalMap: wallNormalTexture,
        roughnessMap: wallARMTexture,
        aoMap: wallARMTexture,
        metalnessMap: wallARMTexture,
        displacementMap: wallDisplacementTexture,
        displacementScale: 0.2,
     })
)
rightWall.rotation.x = - Math.PI * 0.5;
rightWall.position.y = 0.5;
rightWall.position.x = 6;
playground.add(rightWall);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

// game loop
renderer.setAnimationLoop( () => {
    controls.update();
	renderer.render( scene, camera );
});