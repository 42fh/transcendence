import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import gsap from 'gsap';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';


// global variables
let moveLeft = false;
let moveRight = false;
const movementSpeed = 0.01;
let time = Date.now();

// ----------------- Fonts -----------------
const loader = new FontLoader();
const fontUrl = 'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/fonts/helvetiker_regular.typeface.json'; // TODO: download font and move to the static folder
loader.load(fontUrl, (font) => {
    const textGeometry = new TextGeometry('42 Berlin', {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 4, // the smoothness of the text
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 2, // roundness of the bevel
    });
    const textMaterial = new THREE.MeshMatcapMaterial({matcap: texture3});
    const text = new THREE.Mesh(textGeometry, textMaterial);
    textGeometry.center();
    scene.add(text);

    const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);

    for (let i = 0; i < 300; ++i) {
        const donut = new THREE.Mesh(donutGeometry, textMaterial);

        donut.position.x = (Math.random() - 0.5) * 10; // -0.5 to get negative values too
        donut.position.y = (Math.random() - 0.5) * 10;
        donut.position.z = (Math.random() - 0.5) * 10;

        donut.rotation.x = Math.random() * Math.PI;
        donut.rotation.y = Math.random() * Math.PI;

        const scale = Math.random();
        donut.scale.set(scale, scale, scale);

        scene.add(donut);
    }
    gui.add(textMaterial, 'wireframe').name('text wireframe');
});
// -----------------------------------------

// ----------------- Textures -----------------
const loadingManager = new THREE.LoadingManager();
const texture = new THREE.TextureLoader(loadingManager).load('/static/textures/checkerboard-1024x1024.png');
const texture2 = new THREE.TextureLoader(loadingManager).load('/static/textures/checkerboard-8x8.png');
const texture3 = new THREE.TextureLoader(loadingManager).load('/static/textures/matcaps/3.png');
texture.colorSpace = THREE.SRGBColorSpace; // TODO: find out what this does

/*  Texture filtering determines how a texture is sampled 
    when it needs to be scaled down (minification) or up (magnification)
    to fit a surface in 3D space 
*/

/*  Nearest Neighbor (THREE.NearestFilter):
    How It Works: Selects the color of the closest texel (texture pixel) without any interpolation.
    
    Linear Filtering (THREE.LinearFilter):
    How It Works: Computes the color by averaging the colors of neighboring texels, resulting in smoother transitions.
/*

/*  minFilter (Minification Filter):
    Defines how the texture is sampled when it is displayed smaller than its actual size.
    Options:
        THREE.LinearFilter (default): Uses linear interpolation for smoother results.
        THREE.NearestFilter: Chooses the nearest texel's color, resulting in a blocky appearance but faster performance.
*/
texture.minFilter = THREE.NearestFilter;

/*  magFilter (Magnification Filter):
    Defines how the texture is sampled when it is displayed larger than its actual size.
    Options:
        THREE.LinearFilter (default): Smoothens the texture when magnified.
        THREE.NearestFilter: Maintains a pixelated look, which can be desirable for certain visual styles like retro or pixel art.
*/
texture2.magFilter = THREE.NearestFilter;

/*  Mipmapping is a technique used to improve rendering performance and 
    visual quality when textures are viewed at a distance or at smaller sizes. 
    It involves creating multiple scaled-down versions (mipmaps) of the original texture.
*/
texture.generateMipmaps = false; // disable mipmapping to reduce memory usage
texture2.generateMipmaps = false; // disable mipmapping to reduce memory usage
// -----------------------------------------

// Debug UI to tweak values
const gui = new GUI({
    title: 'Transendence UI',
});
// Create a folder to structure the UI
const firstCube = gui.addFolder('First Cube');

let debugObject = {};
debugObject.color = '#64b8c9';
debugObject.spin = () => {
    gsap.to(group.rotation, {duration: 1, y: group.rotation.y + Math.PI * 2});
}
debugObject.subdivision = 2;

// scene
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x08121E);

// canvas from html
const canvas = document.querySelector(".webgl");

// camera
const aspectRatio = window.innerWidth / window.innerHeight;
const vertical_field_of_view = 75;
let camera = new THREE.PerspectiveCamera( vertical_field_of_view, aspectRatio, 0.1, 1000 );
camera.position.set(0, 0, 5);

// light
const light = new THREE.DirectionalLight('white', 8);
light.position.set(10, 10, 10);
scene.add(light);

// controls
let controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // makes controls smoother
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;

// axes helper
// const helper = new THREE.AxesHelper(5);
// scene.add(helper);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive
renderer.physicallyCorrectLights = true;

/*
// custom geometry
let geometry = new THREE.BufferGeometry();
// create custom geometry with 50 triangles with 3 vertices each where each vertex has 3 values (x, y, z)
const positions = new Float32Array(50 * 3 * 3);
// fill the positions with random values
for (let i = 0; i < 50 * 3 * 3; ++i) {
    positions[i] = Math.random();
}
// one vertex is 3 values (x, y, z)
const positionAttribute = new THREE.BufferAttribute(positions, 3);
geometry.setAttribute('position', positionAttribute);
let custom = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: '#c47e7e', wireframe: true}));
scene.add(custom);

// custom triangle
let triangle = new THREE.BufferGeometry();
const vertices = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0
]);
const positionAttribute2 = new THREE.BufferAttribute(vertices, 3);
triangle.setAttribute('position', positionAttribute2);
let customTriangle = new THREE.Mesh(triangle, new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true}));
scene.add(customTriangle);
*/

// group
let geometry = new THREE.BoxGeometry(1, 1, 1);
let group = new THREE.Group();
let cube1 = new THREE.Mesh (
    geometry,
    new THREE.MeshBasicMaterial({color: debugObject.color, wireframe: true})
)
let cube2 = new THREE.Mesh (
    geometry,
    new THREE.MeshBasicMaterial({map: texture})
)
let cube3 = new THREE.Mesh (
    geometry,
    new THREE.MeshBasicMaterial({map: texture2})
)

group.add(cube1);
group.add(cube2);
group.add(cube3);
// scene.add(group);

cube2.position.x = 2;
group.position.y = -1;

renderer.render(scene, camera);

// can be used instead of requestAnimationFrame. It will call the function every frame
renderer.setAnimationLoop( gameLoop );

// initial animation
gsap.to(cube1.position, {duration: 1, x: -2, delay: 1});

// GUI
gui.add(group.position, 'x').min(-3).max(3).step(0.01).name('group x');
gui.add(group, 'visible').name('group visible');
firstCube.add(cube1.material, 'wireframe').name('wireframe');
firstCube.addColor(debugObject, 'color').name('cube1 color').onChange((value) => {
    cube1.material.color.set(value);
});
firstCube.add(debugObject, 'spin').name('spin');
firstCube.add(debugObject, 'subdivision').min(1).max(20).step(1).name('subdivision').onFinishChange((value) => {
    cube1.geometry.dispose(); // dispose of the old geometry
    cube1.geometry = new THREE.BoxGeometry(1, 1, 1, value, value, value);
});

// function to be called every frame
function gameLoop()
{
    // calculate deltaTime to move objects consistently
    const currentTime = Date.now();
    const deltaTime = currentTime - time;
    time = currentTime;

    if (moveLeft) cube1.position.x -= movementSpeed * deltaTime;
    if (moveRight) cube1.position.x += movementSpeed * deltaTime;

    controls.update();
    camera.lookAt(cube1.position);
    
    // update the screen
	renderer.render( scene, camera );
}

// ----------------- Event Listeners -----------------
document.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    }
    else {
        document.exitFullscreen();
    }
});

document.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive
});

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
});
// --------------------------------------------------