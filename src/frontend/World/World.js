import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import * as THREE from "three";
import Debug from "../Utils/Debug.js";
import Audio from "../Utils/Audio.js";

let instance = null;

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
    } else {
      this.addOrthographicCamera();
    }

    // Audio
    this.audio = new Audio(this.camera);
    this.audio.addBackgroundMusic("static/music/song1.mp3", this.gui);

    // Renderer
    this.addRenderer(canvas);

    this.game = null;
  }

  addOrthographicCamera() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -aspectRatio,
      aspectRatio,
      1,
      -1,
      0.1,
      10
    );
    this.camera.position.y = 2 * Math.tan(Math.PI / 5);
    this.camera.position.z = 2;
    this.camera.position.x = 2;

    if (this.gui.debug) {
      this.gui.gui
        .add(this.camera.position, "y")
        .min(-5)
        .max(10)
        .step(0.01)
        .name("Camera y");
      this.gui.gui
        .add(this.camera.position, "z")
        .min(-5)
        .max(10)
        .step(0.01)
        .name("Camera z");
      this.gui.gui
        .add(this.camera.position, "x")
        .min(-5)
        .max(10)
        .step(0.01)
        .name("Camera x");
    }
  }

  addPerspectiveCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(4, 12, 37);
  }

  addRenderer(canvas) {
    this.renderer = null;

    if (canvas == null) {
      this.renderer = new THREE.WebGLRenderer();
    } else {
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    }

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // ratio more than 2 is too computationally expensive
  }

  addGame(newGame, isASCII = false) {
    if (this.game) {
      return "Game already added";
    }
    this.game = newGame;

    if (!isASCII) {
      // Pixelated rendering
      this.composer = new EffectComposer(this.renderer);
      const outputPass = new OutputPass();
      this.composer.addPass(outputPass);
      const renderPixelatedPass = new RenderPixelatedPass(
        6,
        this.game.scene,
        this.camera
      );
      this.composer.addPass(renderPixelatedPass);
      let params = {
        pixelSize: 6,
        normalEdgeStrength: 0.3,
        depthEdgeStrength: 0.4,
        pixelAlignedPanning: true,
      };
      if (this.gui.debug) {
        this.gui.gui
          .add(params, "pixelSize")
          .min(1)
          .max(16)
          .step(1)
          .onChange(() => {
            renderPixelatedPass.setPixelSize(params.pixelSize);
          });
        this.gui.gui
          .add(renderPixelatedPass, "normalEdgeStrength")
          .min(0)
          .max(2)
          .step(0.05);
        this.gui.gui
          .add(renderPixelatedPass, "depthEdgeStrength")
          .min(0)
          .max(1)
          .step(0.05);
      }

      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true; // makes controls smoother
    } else {
      // ASCII rendering
      this.addRenderer(null); // replace renderer
      // hide old canvas
      this.canvas.style.display = "none";

      this.composer = new AsciiEffect(this.renderer, " .:-+*=%@#", {
        invert: true,
      });
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.domElement.style.color = "white";
      this.composer.domElement.style.backgroundColor = "black";
      document.body.appendChild(this.composer.domElement);

      this.controls = new OrbitControls(this.camera, this.composer.domElement);
      this.controls.enableDamping = true; // makes controls smoother
    }

    // Game loop
    if (this.game.loader != null) {
      window.addEventListener("resourcesLoaded", () => {
        this.renderer.setAnimationLoop(() => {
          this.game.gameLoop(this, this.game.scene);
        });
      });
    } else {
      this.renderer.setAnimationLoop(() => {
        this.game.gameLoop(this, this.game.scene);
      });
    }

    // Resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}
