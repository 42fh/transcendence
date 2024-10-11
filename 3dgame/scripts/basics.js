import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import gsap from 'gsap';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
// import { Timer } from 'three/addons/misc/Timer.js'; - use instead of Clock

// global variables
let moveLeft = false;
let moveRight = false;
const movementSpeed = 0.01;
let time = Date.now();

// ----------------- Fonts -----------------
// const loader = new FontLoader();
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
    
    /*You cannot use THREE.MeshMatcapMaterial with light. 
    This material is designed to work independently of scene lighting. 
    It uses a special kind of texture called a matcap (material capture), 
    which simulates the lighting and shading directly from the texture itself,
    making the object look like it’s already lit.*/

    const textMaterial = new THREE.MeshStandardMaterial({map: texture3});
    // const textMaterial = new THREE.MeshMatcapMaterial({matcap: texture3, metalness: 0.7, roughness: 0.5});
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
});
// -----------------------------------------
// ----------------- Textures -----------------
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const floorAlphaTexture = textureLoader.load('/static/floor/alpha.jpg');
const floorColorTexture = textureLoader.load('/static/floor/color.jpg');
const floorARMTexture = textureLoader.load('/static/floor/arm.jpg');
const floorNormalTexture = textureLoader.load('/static/floor/normal.jpg');
const floorDisplacementTexture = textureLoader.load('/static/floor/displacement.jpg');

floorColorTexture.repeat.set(8, 8);
floorNormalTexture.repeat.set(8, 8);
floorARMTexture.repeat.set(8, 8);
floorDisplacementTexture .repeat.set(8, 8);

floorColorTexture.wrapS = THREE.RepeatWrapping;
floorColorTexture.wrapT = THREE.RepeatWrapping; 
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping; 
floorARMTexture.wrapS = THREE.RepeatWrapping;
floorARMTexture.wrapT = THREE.RepeatWrapping; 
floorDisplacementTexture.wrapS = THREE.RepeatWrapping; // avoid last pixel to be stretched on x axis
floorDisplacementTexture.wrapT = THREE.RepeatWrapping; // avoid last pixel to be stretched on y axis

floorAlphaTexture.repeat.set(1, 1);
floorAlphaTexture.wrapS = THREE.RepeatWrapping;
floorAlphaTexture.wrapT = THREE.RepeatWrapping;

// texture2.colorSpace = THREE.SRGBColorSpace; // TODO: find out what this does

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
// texture2.minFilter = THREE.NearestFilter;

/*  magFilter (Magnification Filter):
    Defines how the texture is sampled when it is displayed larger than its actual size.
    Options:
        THREE.LinearFilter (default): Smoothens the texture when magnified.
        THREE.NearestFilter: Maintains a pixelated look, which can be desirable for certain visual styles like retro or pixel art.
*/
// texture2.magFilter = THREE.NearestFilter;

/*  Mipmapping is a technique used to improve rendering performance and 
    visual quality when textures are viewed at a distance or at smaller sizes. 
    It involves creating multiple scaled-down versions (mipmaps) of the original texture.
*/
// texture2.generateMipmaps = false; // disable mipmapping to reduce memory usage
// -----------------------------------------

// scene
let scene = new THREE.Scene();
// scene.background = new THREE.Color(0x08121E);

// canvas from html
const canvas = document.querySelector(".webgl");

// camera
const aspectRatio = window.innerWidth / window.innerHeight;
const vertical_field_of_view = 75;
let camera = new THREE.PerspectiveCamera( vertical_field_of_view, aspectRatio, 0.1, 1000 );
camera.position.set(0, 0, 5);

// ----------------- Lights -----------------
/* Minimal cost:
    - Ambient light
    - Hemisphere light
   Medium cost:
    - Directional light
    - Point light
   High cost:
    - Spot light
    - RectAreaLight

- Directional light is like the sun, it lights up the whole scene from a specific direction

- Ambient light lights up the whole scene
Ambient light is used together with directional light to simulate light bouncing

- Point light is like a light bulb, candle, it lights up from a specific point

- RectAreaLight is like a light panel from photoshoots, it lights up from a rectangle

- SpotLight is like a flashlight, it lights up from a specific point in a specific direction
To rotate the spot light, add spotLight.target to the scene and rotate the target

- HemisphereLight simulates the lighting difference between 
the top and bottom parts of a scene, creating a more natural look 
without needing specific directional lighting
*/
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// const hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 0.5);
// const pointLight = new THREE.PointLight(0xffffff, 1.5, 2, 2);
// const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 5, 3, 5);
// const spotLight = new THREE.SpotLight(0xffffff, 5, 10, Math.PI * 0.3, 0.25, 1);
const directLight = new THREE.DirectionalLight(0xffffff, 2);

// const spotLightHelper = new THREE.SpotLightHelper(spotLight);

directLight.position.set(10, 10, 10);
// pointLight.position.set(0, -1, 0);
// rectAreaLight.position.set(2, 2, 2);
// spotLight.position.set(0, 2, 3);
scene.add(directLight);
scene.add(ambientLight);
// scene.add(hemisphereLight);
// scene.add(pointLight);
// scene.add(rectAreaLight);
// scene.add(spotLight);
// scene.add(spotLightHelper, 0.2);
// -----------------------------------------

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

// ----------------- Basics lessions -----------------

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


// group
let geometry2 = new THREE.BoxGeometry(1, 1, 1);
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
scene.add(group);

cube2.position.x = 2;
group.position.y = -1;

gsap.to(cube1.position, {duration: 1, x: -2, delay: 1});

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

// --------------------------------------------------

// can be used instead of requestAnimationFrame. It will call the function every frame
renderer.setAnimationLoop( () => {
    // calculate deltaTime to move objects consistently
    // const currentTime = Date.now();
    // const deltaTime = currentTime - time;
    // time = currentTime;

    // if (moveLeft) cube1.position.x -= movementSpeed * deltaTime;
    // if (moveRight) cube1.position.x += movementSpeed * deltaTime;

    controls.update();
    // camera.lookAt(cube1.position);
    
    // update the screen
	renderer.render( scene, camera );
});



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