import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import gsap from 'gsap';

let moveLeft = false;
let moveRight = false;
const movementSpeed = 0.01;

// scene
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x08121E);

// canvas from html
const canvas = document.querySelector(".webgl");

// camera
const aspectRatio = window.innerWidth / window.innerHeight;
const vertical_field_of_view = 75;
let camera = new THREE.PerspectiveCamera( vertical_field_of_view, aspectRatio, 1, 1000 );
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
const helper = new THREE.AxesHelper(5);
scene.add(helper);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive
renderer.physicallyCorrectLights = true;

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
let custom = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}));
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

// group
let group = new THREE.Group();
let cube1 = new THREE.Mesh (
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
        color: 0xff0000,
        wireframe: true
    })
)
let cube2 = new THREE.Mesh (
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({color: 0x00ff00})
)
cube2.position.x = 2;
group.add(cube1);
group.add(cube2);
group.position.y = -1;
scene.add(group);

renderer.render(scene, camera)

let time = Date.now();

// can be used instead of requestAnimationFrame. It will call the function every frame
renderer.setAnimationLoop( gameLoop );

// animation
gsap.to(cube1.position, {duration: 1, x: -2, delay: 1});

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