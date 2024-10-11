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
const ambientLight = new THREE.AmbientLight('#86cdff', 0.3)
scene.add(ambientLight)

// Moon light
const directionalLight = new THREE.DirectionalLight('#86cdff', 1)
directionalLight.position.set(3, 2, -8)
directionalLight.shadow.mapSize.set(256, 256) // reduce resolution to improve performance
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.camera.left = -8
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 20
scene.add(directionalLight)

// Door light
const doorLight = new THREE.PointLight('#ff7d46', 5)
doorLight.position.set(0, 2.2, 2.5)
scene.add(doorLight)

// Ghosts
const ghost1 = new THREE.PointLight('#ff0088', 6)
const ghost2 = new THREE.PointLight('#ff0000', 6)
const ghost3 = new THREE.PointLight('#8800ff', 6)

ghost1.shadow.mapSize.set(256, 256) // reduce resolution to improve performance
ghost1.shadow.camera.far = 10
ghost2.shadow.mapSize.set(256, 256) // reduce resolution to improve performance
ghost2.shadow.camera.far = 10
ghost3.shadow.mapSize.set(256, 256) // reduce resolution to improve performance
ghost3.shadow.camera.far = 10
scene.add(ghost1, ghost2, ghost3)

// Sky
const sky = new Sky();
sky.scale.set(100, 100, 100);
sky.material.uniforms['turbidity'].value = 10;
sky.material.uniforms['rayleigh'].value = 3;
sky.material.uniforms['mieCoefficient'].value = 0.1;
sky.material.uniforms['mieDirectionalG'].value = 0.95;
sky.material.uniforms['sunPosition'].value.set(0.3, -0.038, -0.95);

gui.add(sky.material.uniforms['turbidity'], 'value').min(0).max(20).step(0.1).name('Turbidity');
gui.add(sky.material.uniforms['rayleigh'], 'value').min(0).max(4).step(0.1).name('Rayleigh');
gui.add(sky.material.uniforms['mieCoefficient'], 'value').min(0).max(0.1).step(0.001).name('Mie coefficient');
gui.add(sky.material.uniforms['mieDirectionalG'], 'value').min(0).max(1).step(0.001).name('Mie directional G');
gui.add(sky.material.uniforms['sunPosition'].value, 'x').min(-1).max(1).step(0.001).name('Sun x');

scene.add(sky);

// Fog
scene.fog = new THREE.FogExp2('#04343f', 0.1);

// renderer
let renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

// shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
directionalLight.castShadow = true;
ghost1.castShadow = true;
ghost2.castShadow = true;
ghost3.castShadow = true;

// textures
// const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader();
const floorAlphaTexture = textureLoader.load('/static/floor/alpha.webp');
const floorColorTexture = textureLoader.load('/static/floor/color.webp');
const floorARMTexture = textureLoader.load('/static/floor/arm.webp');
const floorNormalTexture = textureLoader.load('/static/floor/normal.webp');
const floorDisplacementTexture = textureLoader.load('/static/floor/displacement.webp');

floorColorTexture.colorSpace = THREE.SRGBColorSpace

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

floorColorTexture.colorSpace = THREE.SRGBColorSpace

const wallColorTexture = textureLoader.load('/static/wall/wall_dif.webp');
const wallNormalTexture = textureLoader.load('/static/wall/wall_nor.webp');
const wallARMTexture = textureLoader.load('/static/wall/wall_arm.webp');

wallColorTexture.colorSpace = THREE.SRGBColorSpace

const roofColorTexture = textureLoader.load('/static/roof/color.webp');
const roofNormalTexture = textureLoader.load('/static/roof/normal.webp');
const roofARMTexture = textureLoader.load('/static/roof/arm.webp');

roofColorTexture.repeat.set(3, 1);
roofNormalTexture.repeat.set(3, 1);
roofARMTexture.repeat.set(3, 1);

roofColorTexture.wrapS = THREE.RepeatWrapping;
roofNormalTexture.wrapS = THREE.RepeatWrapping;
roofARMTexture.wrapS = THREE.RepeatWrapping;

roofColorTexture.colorSpace = THREE.SRGBColorSpace

const bushColorTexture = textureLoader.load('/static/bush/color.webp');
const bushNormalTexture = textureLoader.load('/static/bush/normal.webp');
const bushARMTexture = textureLoader.load('/static/bush/arm.webp');

bushColorTexture.colorSpace = THREE.SRGBColorSpace

const graveColorTexture = textureLoader.load('/static/grave/color.webp');
const graveNormalTexture = textureLoader.load('/static/grave/normal.webp');
const graveARMTexture = textureLoader.load('/static/grave/arm.webp');

graveColorTexture.colorSpace = THREE.SRGBColorSpace

const doorColorTexture = textureLoader.load('/static/door/color.webp');
const doorNormalTexture = textureLoader.load('/static/door/normal.webp');
const doorAlphaTexture = textureLoader.load('/static/door/alpha.webp');
const doorAmbientOcclusionTexture = textureLoader.load('/static/door/ambientOcclusion.webp');
const doorHeightTexture = textureLoader.load('/static/door/height.webp');
const doorMetalnessTexture = textureLoader.load('/static/door/metalness.webp');
const doorRoughnessTexture = textureLoader.load('/static/door/roughness.webp');

doorColorTexture.colorSpace = THREE.SRGBColorSpace

// terrain
const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 100, 100), 
    new THREE.MeshStandardMaterial({
        alphaMap: floorAlphaTexture, 
        transparent: true,
        map: floorColorTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture, // height map
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        displacementScale: 0.3, // height scale
        displacementBias: -0.2, // height map offset
    })
);
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);

gui.add(terrain.material, 'displacementScale').min(0).max(1).step(0.001).name('Displacement scale');
gui.add(terrain.material, 'displacementBias').min(-1).max(1).step(0.001).name('Displacement bias');

// // ----------------- House -----------------
const house = new THREE.Group();

const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        aoMap: wallARMTexture,
        roughnessMap: wallARMTexture,
        metalnessMap: wallARMTexture,
        normalMap: wallNormalTexture
    })
);
walls.position.y = 1.25;
house.add(walls);

const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1.5, 4),
    new THREE.MeshStandardMaterial({
        map: roofColorTexture,
        normalMap: roofNormalTexture,
        aoMap: roofARMTexture,
        roughnessMap: roofARMTexture,
        metalnessMap: roofARMTexture
    })
);
roof.position.y = 2.5 + 0.5;
roof.rotation.y = Math.PI / 4;
house.add(roof);

const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 100, 100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture,
        normalMap: doorNormalTexture,
        displacementScale: 0.15,
        displacementBias: -0.04
    })
);
door.position.z = 2.01;
door.position.y = 1;
house.add(door);

const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({
    color: '#ccffcc',
    map: bushColorTexture,
    normalMap: bushNormalTexture,
    aoMap: bushARMTexture,
    roughnessMap: bushARMTexture,
    metalnessMap: bushARMTexture
});

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
bush1.scale.set(0.5, 0.5, 0.5);
bush1.position.set(-1.5, 0.2, 2.3);
bush1.rotation.x = -0.75;

const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
bush2.scale.set(0.25, 0.25, 0.25);
bush2.position.set(-1, 0.2, 2.3);

const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
bush3.scale.set(0.5, 0.5, 0.5);
bush3.position.set(1.5, 0.2, 2.3);
bush3.rotation.x = -0.75;

const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
bush4.scale.set(0.25, 0.25, 0.25);
bush4.position.set(1, 0.2, 2.3);

house.add(bush1, bush2, bush3, bush4);

const graves = new THREE.Group();
const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
const graveMaterial = new THREE.MeshStandardMaterial({
    map: graveColorTexture,
    normalMap: graveNormalTexture,
    aoMap: graveARMTexture,
    roughnessMap: graveARMTexture,
    metalnessMap: graveARMTexture
});

for (let i = 0; i < 30; ++i) {
    const grave = new THREE.Mesh(graveGeometry, graveMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 4;
    grave.position.set(Math.cos(angle) * radius, Math.random() * 0.4, Math.sin(angle) * radius);
    grave.rotation.y = (Math.random() - 0.5) * 0.4;
    grave.rotation.z = (Math.random() - 0.5) * 0.4;
    grave.rotation.x = (Math.random() - 0.5) * 0.4;
    graves.add(grave);
}
scene.add(graves);
scene.add(house);

// shadows
walls.castShadow = true;
walls.receiveShadow = true;
roof.castShadow = true;
terrain.receiveShadow = true;
for (const grave of graves.children) {
    grave.castShadow = true;
    grave.receiveShadow = true;
}

let time = Date.now();

renderer.setAnimationLoop( () => {

    const deltaTime = time - Date.now();
    const ghostAngle = deltaTime * 0.0005;
    ghost1.position.x = Math.cos(ghostAngle) * 4;
    ghost1.position.z = Math.sin(ghostAngle) * 4;
    ghost1.position.y = Math.sin(ghostAngle) * Math.sin(ghostAngle * 2.34) * Math.sin(ghostAngle * 3.45);
    
    const ghostAngle2 = -deltaTime * 0.0003;
    ghost2.position.x = Math.cos(ghostAngle2) * 5;
    ghost2.position.z = Math.sin(ghostAngle2) * 5;
    ghost2.position.y = Math.sin(ghostAngle2) * Math.sin(ghostAngle2 * 2.34) * Math.sin(ghostAngle2 * 3.45);

    const ghostAngle3 = deltaTime * 0.0002;
    ghost3.position.x = Math.cos(ghostAngle3) * 6;
    ghost3.position.z = Math.sin(ghostAngle3) * 6;
    ghost3.position.y = Math.sin(ghostAngle3) * Math.sin(ghostAngle3 * 2.34) * Math.sin(ghostAngle3 * 3.45);
    controls.update();
	renderer.render( scene, camera );
});