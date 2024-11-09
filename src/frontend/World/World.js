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
    this.audio.addBackgroundMusic(
      ["/static/music/song1.mp3", "/static/music/song2.mp3"],
      this.gui
    );

    // Raycaster
    this.raycaster = new THREE.Raycaster();

    // Intersection
    this.currentIntersect = null;

    // Renderer
    this.addRenderer(canvas);

    this.game = null;

    this.moveUp = false;
    this.moveDown = false;

    this.mouse = new THREE.Vector2();

    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
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
  }

  addPerspectiveCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(3.22, 1.75, 0.2);

    if (this.gui.debug) {
      this.gui.gui
        .add(this.camera.position, "y")
        .min(-115)
        .max(20)
        .step(0.01)
        .name("Camera y");
      this.gui.gui
        .add(this.camera.position, "z")
        .min(-15)
        .max(20)
        .step(0.01)
        .name("Camera z");
      this.gui.gui
        .add(this.camera.position, "x")
        .min(-15)
        .max(20)
        .step(0.01)
        .name("Camera x");
    }
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
        1,
        this.game.scene,
        this.camera
      );
      this.composer.addPass(renderPixelatedPass);
      let params = {
        pixelSize: 1,
        normalEdgeStrength: 0.1,
        depthEdgeStrength: 0.1,
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
    this.renderer.setAnimationLoop(() => {
      this.gameLoop();
    });

    // Event listeners
    this.addEventListeners();
  }

  gameLoop() {
    // move paddle
    if (this.moveDown && this.game.websocket) {
      this.game.drawer.movePaddle("left");
    }
    if (this.moveUp && this.game.websocket) {
      this.game.drawer.movePaddle("right");
    }

    if (this.game.ui.isActive) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const objectsToTest = [this.game.ui.leftArrow, this.game.ui.rightArrow];
      const intersects = this.raycaster.intersectObjects(objectsToTest);

      // set to red if intersected
      if (intersects.length) {
        intersects[0].object.material.color.set("red");
        this.currentIntersect = intersects[0].object;
      } else {
        if (this.currentIntersect) {
          this.currentIntersect.material.color.set(
            objectsToTest[0].originalColor
          );
          this.currentIntersect = null;
        }
      }
    }

    this.controls.update();
    this.composer.render(this.scene, this.camera);
  }

  addEventListeners() {
    // Move paddle
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          this.moveUp = true;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveDown = true;
          break;
      }
    });
    // Stop moving paddle
    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          this.moveUp = false;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveDown = false;
          break;
      }
    });
    // Fullscreen
    document.addEventListener("dblclick", () => {
      if (!document.fullscreenElement) {
        this.canvas.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
    document.addEventListener("click", () => {
      if (this.currentIntersect) {
        this.currentIntersect.customFunction();
      }
    });
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
