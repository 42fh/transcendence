import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as THREE from 'three';
import Debug from '../Utils/Debug.js';

let instance = null;
let music = null;

export default class World {
    constructor(canvas, isPerspectiveCamera = true) {
        // Singleton
        if (instance) {
            return instance;
        }
        instance = this;

        // Canvas
        this.canvas = canvas;

        // GUI
        this.gui = new Debug();

        // Camera
        if (isPerspectiveCamera) {
            this.addPerspectiveCamera();
        }
        else {
            this.addOrthographicCamera();
        }

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive

        this.composer = new EffectComposer(this.renderer);

        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        this.game = null;

        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addOrthographicCamera() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, - 1, 0.1, 10);
        this.camera.position.y = 2 * Math.tan(Math.PI / 6);
        this.camera.position.z = 2;
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true; // makes controls smoother

        // this.addMusic('static/music/song1.mp3');
    }

    addPerspectiveCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(4, 12, 37);
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true; // makes controls smoother
    }

    addMusic(song) {
        if (music) {
            return "Music already added";
        }
        music = song;
        console.log("Adding music");
        const listener = new THREE.AudioListener();
        this.camera.add(listener);
        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(song, function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.5);
            sound.play();
        });
    }

    addGame(newGame) {
        if (this.game) {
            return "Game already added";
        }
        this.game = newGame;

        // Pixelated rendering
        const renderPixelatedPass = new RenderPixelatedPass(6, this.game.scene, this.camera);
        this.composer.addPass(renderPixelatedPass);
        let params = { pixelSize: 6, normalEdgeStrength: .3, depthEdgeStrength: .4, pixelAlignedPanning: true };
        if (this.gui.debug) {
            this.gui.gui.add(params, 'pixelSize').min(1).max(16).step(1)
                .onChange(() => {

                    renderPixelatedPass.setPixelSize(params.pixelSize);

                });
            this.gui.gui.add(renderPixelatedPass, 'normalEdgeStrength').min(0).max(2).step(.05);
            this.gui.gui.add(renderPixelatedPass, 'depthEdgeStrength').min(0).max(1).step(.05);
        }

        // Game loop
        if (this.game.loader != null) {
            window.addEventListener('resourcesLoaded', () => {
                this.renderer.setAnimationLoop(() => {
                    this.game.gameLoop(this, this.game.scene);
                });
            });
        }
        else {
            this.renderer.setAnimationLoop(() => {
                this.game.gameLoop(this, this.game.scene);
            });
        }
    }
}