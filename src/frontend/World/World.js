import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

let instance = null;

export default class World
{
    constructor(canvas) 
    {
        // Singleton
        if (instance) {
            return instance;
        }
        instance = this;

        // Canvas
        this.canvas = canvas;
        
        // GUI - TODO: make one global GUI
        this.gui = new GUI();

        // Camera
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set(0, 8, 19);
        this.gui.add(this.camera.position, 'x').min(-10).max(100).step(0.001).name('Camera x');
        this.gui.add(this.camera.position, 'y').min(-10).max(100).step(0.001).name('Camera y');
        this.gui.add(this.camera.position, 'z').min(-10).max(100).step(0.001).name('Camera z');

        // Renderer
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true; // makes controls smoother

        this.game = null;

        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    addGame(newGame)
    {
        if (this.game) {
            return "Game already added";
        }

        this.game = newGame;

        if (this.game.loader != null) {
            window.addEventListener('resourcesLoaded', () => {
                this.renderer.setAnimationLoop( () => {
                    this.game.gameLoop(this, this.game.scene);
                });
            });
        }
        else {
            this.renderer.setAnimationLoop( () => {
                this.game.gameLoop(this, this.game.scene);
            });
        }
    }
}