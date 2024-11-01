import * as THREE from 'three';
import World from './World/World.js';
import Game from './Game/Game.js';

let fin1, fin2, fin3, player1, player2, moveDown, moveUp, gameBall;

let canvas = document.querySelector('.webgl');

const world = new World(canvas);
const GAME_HEIGHT = 24;
const GAME_WIDTH = 14;

const game = new Game();
game.addAmbientLight(1, 0xffffff);
game.addDirectionalLight(1, 0xffffff, new THREE.Vector3(3, 7.5, 3));
game.addSky(1000, 10, 1.3, 0.001, 0.7, new THREE.Vector3(0.3, 0.001, -0.95));
game.addSea(1000, 1000, 0x001e0f, 0xffffff, 3.7);
game.loadResources([
    { name: 'floorAplhaTexture', type: 'texture', url: 'static/textures/floor/alpha.webp' },
    { name: 'floorColorTexture', type: 'texture', url: 'static/textures/floor/color.jpg' },
    { name: 'floorNormalTexture', type: 'texture', url: 'static/textures/floor/normal.jpg' },
    { name: 'floorDisplacementTexture', type: 'texture', url: 'static/textures/floor/displacement.jpg' },
    { name: 'floorARMTexture', type: 'texture', url: 'static/textures/floor/arm.jpg' },
    { name: 'playerColorTexture', type: 'texture', url: 'static/textures/player/color.jpg' },
    { name: 'playerNormalTexture', type: 'texture', url: 'static/textures/player/normal.jpg' },
    { name: 'playerARMTexture', type: 'texture', url: 'static/textures/player/arm.jpg' },
    { name: 'palmTree', type: 'gltf', url: 'static/models/palm/quiver_tree_02_1k.gltf' },
    { name: 'bush', type: 'gltf', url: 'static/models/bush/fern_02_1k.gltf' },
    { name: 'coconut', type: 'gltf', url: 'static/models/coconut/scene.gltf' },
    { name: 'umbrella', type: 'gltf', url: 'static/models/umbrella/scene.gltf' },
    { name: 'ball', type: 'gltf', url: 'static/models/ball/scene.gltf' },
    { name: 'chair', type: 'gltf', url: 'static/models/chair/plastic_monobloc_chair_01_1k.gltf' },
    { name: 'log', type: 'gltf', url: 'static/models/log/dead_quiver_trunk_1k.gltf' },
    { name: 'duck', type: 'gltf', url: 'static/models/duck/rubber_duck_toy_1k.gltf' },
    { name: 'glasses', type: 'gltf', url: 'static/models/glasses/scene.gltf' },
    { name: 'fin', type: 'gltf', url: 'static/models/fin/scene.gltf' },
]);

window.addEventListener('resourcesLoaded', () => {
    game.loader.items['playerColorTexture'].colorSpace = THREE.SRGBColorSpace;
    game.loader.items['floorColorTexture'].colorSpace = THREE.SRGBColorSpace;
    game.loader.items['floorColorTexture'].repeat.set(4, 4);
    game.loader.items['floorNormalTexture'].repeat.set(4, 4);
    game.loader.items['floorDisplacementTexture'].repeat.set(4, 4);
    game.loader.items['floorARMTexture'].repeat.set(4, 4);
    game.loader.items['floorColorTexture'].wrapS = THREE.RepeatWrapping;
    game.loader.items['floorColorTexture'].wrapT = THREE.RepeatWrapping;
    game.loader.items['floorNormalTexture'].wrapS = THREE.RepeatWrapping;
    game.loader.items['floorNormalTexture'].wrapT = THREE.RepeatWrapping;
    game.loader.items['floorDisplacementTexture'].wrapS = THREE.RepeatWrapping;
    game.loader.items['floorDisplacementTexture'].wrapT = THREE.RepeatWrapping;
    game.loader.items['floorARMTexture'].wrapS = THREE.RepeatWrapping;
    game.loader.items['floorARMTexture'].wrapT = THREE.RepeatWrapping;

    // Palm trees
    const palmTree = game.loader.items['palmTree'].scene;
    palmTree.scale.set(6, 6, 10);
    palmTree.position.set(18, 0, 12);

    const palmTree2 = palmTree.clone();
    palmTree2.position.set(-6, 0, 12);

    // Bush
    const bush = game.loader.items['bush'].scene;
    bush.scale.set(3, 3, 3);
    bush.position.set(17, 0, 10);

    // Coconut
    const coconut = game.loader.items['coconut'].scene;
    coconut.scale.set(1, 1, 1);
    coconut.position.set(17, 0.5, 7);

    const coconut2 = coconut.clone();
    coconut2.position.set(-5.5, 1.3, 16);
    coconut2.rotation.set(Math.PI, Math.PI * 0.2, 0);

    // Umbrella
    const umbrella = game.loader.items['umbrella'].scene;
    umbrella.scale.set(0.01, 0.01, 0.01);
    umbrella.position.set(18, -0.3, 17);
    umbrella.rotation.set(0, Math.PI * 0.08, 0);

    // Ball
    const ball = game.loader.items['ball'].scene;
    ball.scale.set(0.5, 0.5, 0.5);
    ball.position.set(17, 0.5, 16);

    // Chairs
    const chair = game.loader.items['chair'].scene;
    chair.scale.set(2, 2, 2);
    chair.position.set(-5.5, 0, 18);
    chair.rotation.set(0, Math.PI * 0.5, 0);

    const chair2 = chair.clone();
    chair2.position.set(-5.5, 0, 16);

    const chair3 = chair.clone();
    chair3.position.set(-5.5, 0, 14);

    // Logs
    const log = game.loader.items['log'].scene;
    log.scale.set(8, 14, 10);
    log.position.set(GAME_WIDTH - GAME_WIDTH - 0.8, 0.5, -3);
    log.rotation.set(Math.PI * 0.5, Math.PI * 0.5, 0);

    const log2 = log.clone();
    log2.position.set(GAME_WIDTH + 0.8, 0.5, 25);
    log2.rotation.set(Math.PI * 0.5, 0, Math.PI);

    // Rubber Duck
    const duck = game.loader.items['duck'].scene;
    duck.scale.set(4, 4, 4);
    duck.position.set(-5.5, 0.9, 14);
    duck.rotation.set(0, Math.PI * 0.5, 0);

    // Glasses
    const glasses = game.loader.items['glasses'].scene;
    glasses.scale.set(0.8, 0.8, 0.8);
    glasses.position.set(-5.32, 1.4, 16.02);
    glasses.rotation.set(0, Math.PI, 0);

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(45, 42, 100, 100),
        new THREE.MeshStandardMaterial({
            color: '#fffdff',
            alphaMap: game.loader.items['floorAplhaTexture'],
            transparent: true,
            map: game.loader.items['floorColorTexture'],
            normalMap: game.loader.items['floorNormalTexture'],
            displacementMap: game.loader.items['floorDisplacementTexture'],
            roughnessMap: game.loader.items['floorARMTexture'],
            aoMap: game.loader.items['floorARMTexture'],
            metalnessMap: game.loader.items['floorARMTexture'],
            displacementScale: 0.2,
            displacementBias: -0.1,
        })
    );
    floor.rotation.x = - Math.PI * 0.5;
    floor.position.y = 0.1;
    floor.position.x = 6;
    floor.position.z = 12;

    // Paddles
    const geometry = new THREE.BoxGeometry(3, 1, 1);
    geometry.center();
    player1 = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
            map: game.loader.items['playerColorTexture'],
            normalMap: game.loader.items['playerNormalTexture'],
            roughnessMap: game.loader.items['playerARMTexture'],
            aoMap: game.loader.items['playerARMTexture'],
            metalnessMap: game.loader.items['playerARMTexture'],
        })
    );
    player1.position.set(GAME_WIDTH / 2, 0.63, GAME_HEIGHT);
    player1.name = 'player1';
    player2 = player1.clone();
    player2.name = 'player2';
    player2.position.set(GAME_WIDTH / 2, 0.63, GAME_HEIGHT - GAME_HEIGHT);

    // Ball
    gameBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    gameBall.position.set(GAME_WIDTH / 2, 0.7, GAME_HEIGHT / 2);

    // Fins
    const sharkFin1 = game.loader.items['fin'].scene;
    sharkFin1.name = 'sharkFin1';
    sharkFin1.scale.set(2, 2, 2);
    sharkFin1.position.set(6, 0, 12);
    sharkFin1.rotation.y = Math.PI;

    const sharkFin2 = sharkFin1.clone();
    sharkFin2.name = 'sharkFin2';

    const sharkFin3 = sharkFin1.clone();
    sharkFin3.name = 'sharkFin3';

    game.addObjects([
        palmTree, palmTree2, bush, coconut, coconut2,
        umbrella, ball, chair, chair2, chair3, log, floor,
        log2, duck, glasses, sharkFin1, sharkFin2, sharkFin3,
        player1, player2, gameBall
    ]);

    fin1 = game.scene.children[0].getObjectByName('sharkFin1');
    fin2 = game.scene.children[0].getObjectByName('sharkFin2');
    fin3 = game.scene.children[0].getObjectByName('sharkFin3');
    player1 = game.scene.children[0].getObjectByName('player1');
    player2 = game.scene.children[0].getObjectByName('player2');
});

let time = Date.now();
function gameLoop(world, scene) {

    const deltaTime = time - Date.now();

    // water animation
    world.game.water.material.uniforms['time'].value += 1.0 / 60.0;

    // shark animation
    const sharkAngle = 0.0003 * deltaTime;
    fin1.position.x = (Math.cos(sharkAngle) * 25) + 6;
    fin1.position.z = (Math.sin(sharkAngle) * 25) + 6;
    fin1.rotation.y = Math.PI - sharkAngle;

    fin2.position.x = (Math.cos(-sharkAngle) * 30) + 6;
    fin2.position.z = (Math.sin(-sharkAngle) * 30) + 6;
    fin2.rotation.y = Math.PI - sharkAngle;

    fin3.position.x = (Math.cos(sharkAngle) * 45) + 6;
    fin3.position.z = (Math.sin(sharkAngle) * 45) + 6;
    fin3.rotation.y = sharkAngle;

    // move paddle
    if (moveDown && world.game.socket) {
        world.game.socket.send(JSON.stringify({
            action: 'move_paddle',
            direction: 'down',
            user_id: world.game.playerId
        }));
    }
    if (moveUp && world.game.socket) {
        world.game.socket.send(JSON.stringify({
            action: 'move_paddle',
            direction: 'up',
            user_id: world.game.playerId
        }));
    }

    world.controls.update();
    world.renderer.render(scene, world.camera);
};
game.addGameLoop(gameLoop);

function updateGame(gameState) {
    console.log('paddle', gameState.paddle_left.y);
    console.log('ball', gameState.ball.y);
    player1.position.x = gameState.paddle_right.y * GAME_WIDTH;
    player2.position.x = gameState.paddle_left.y * GAME_WIDTH;
    gameBall.position.z = gameState.ball.x * GAME_HEIGHT;
    gameBall.position.x = gameState.ball.y * GAME_WIDTH;
    // TODO: optimize
    document.querySelector('.score1').textContent = gameState.score.left;
    document.querySelector('.score2').textContent = gameState.score.right;
}
game.addSocket(updateGame);

// ---------START GAME------------
world.addGame(game);
// TODO: add destroy game method(destroys all objects and removes event listeners)

// Move paddle
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveUp = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveDown = true;
            break;
    }
});

// Stop moving paddle
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            moveUp = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveDown = false;
            break;
    }
});

// Fullscreen
document.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
    }
    else {
        document.exitFullscreen();
    }
});