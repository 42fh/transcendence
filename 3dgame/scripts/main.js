import { Player } from "./PlayerClass.js";

let moveLeft = false;
let moveRight = false;

const movementSpeed = 0.1;

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

let player = new Player(5, 0);
player.render();

player.renderer.setAnimationLoop( animate );

function animate()
{
    if (moveLeft) player.cube.position.x -= movementSpeed;
    if (moveRight) player.cube.position.x += movementSpeed;

    player.controls.update();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    player.renderer.setSize( window.innerWidth, window.innerHeight );
    player.renderer.setPixelRatio(window.devicePixelRatio);
	player.renderer.render( player.scene, player.camera );
}