import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import Debug from "./debug3d.js";
import Audio from "./audio3d.js";
import gsap from "gsap";

export default class World {
  constructor(canvas, isPerspectiveCamera = true, game) {
    // Canvas
    this.canvas = canvas;

    this.game = game;

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
    this.audio.addBackgroundMusic([], this.gui);

    // Raycaster
    this.raycaster = new THREE.Raycaster();

    // Intersection
    this.currentIntersect = null;

    // Renderer
    this.addRenderer(canvas);

    this.moveUp = false;
    this.moveDown = false;

    this.mouse = new THREE.Vector2();
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

    if (this.game.type == "circular") {
      this.camera.position.set(0.22, 1, 2);
    } else {
      this.camera.position.set(6, 7, 35);
      this.camera.lookAt(10, -4, 10);
    }
    this.cameraAnimation = this.animateCamera();

    if (this.gui.debug) {
      this.gui.gui
        .add(this.camera.position, "y")
        .min(-115)
        .max(40)
        .step(0.01)
        .name("Camera y");
      this.gui.gui
        .add(this.camera.position, "z")
        .min(-15)
        .max(40)
        .step(0.01)
        .name("Camera z");
      this.gui.gui
        .add(this.camera.position, "x")
        .min(-15)
        .max(40)
        .step(0.01)
        .name("Camera xx");
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

  addGame(newGame) {
    this.game = newGame;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true; // makes controls smoother

    this.time = Date.now();
    this.renderer.setAnimationLoop(() => {
      this.regularGameLoop();
    });

    // Event listeners
    this.addEventListeners();
  }

  regularGameLoop() {
    const deltaTime = this.time - Date.now();

    this.game.water.material.uniforms["time"].value += 1.0 / 240.0;

    // shark animation
    if (this.game.fin1) {
      const sharkAngle = 0.00023 * deltaTime;
      this.game.fin1.position.x = Math.cos(sharkAngle) * 4;
      this.game.fin1.position.z = Math.sin(sharkAngle) * 4;
      this.game.fin1.rotation.y = Math.PI - sharkAngle;

      this.game.fin2.position.x = Math.cos(-sharkAngle) * 7;
      this.game.fin2.position.z = Math.sin(-sharkAngle) * 7;
      this.game.fin2.rotation.y = Math.PI - sharkAngle;

      this.game.fin3.position.x = Math.cos(sharkAngle) * 10;
      this.game.fin3.position.z = Math.sin(sharkAngle) * 10;
      this.game.fin3.rotation.y = sharkAngle;
    }

    // move paddle
    if (this.moveDown && this.game.websocket) {
      this.game.drawer.movePaddle("right");
    }
    if (this.moveUp && this.game.websocket) {
      this.game.drawer.movePaddle("left");
    }

    // UI
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
    this.renderer.render(this.game.scene, this.camera);
  }

  animateCamera() {
    this.cameraTarget = new THREE.Vector3(4, -4, 4);
    this.cameraRotation = { angle: 0 };

    const radius = 1;
    const height = 2;
    const centerX = 1;
    const centerZ = 1;

    return gsap.to(this.cameraRotation, {
      angle: Math.PI * 2,
      duration: 30,
      repeat: -1,
      ease: "none",
      onUpdate: () => {
        const angle = this.cameraRotation.angle;
        this.camera.position.x = Math.cos(angle) * radius + centerX;
        this.camera.position.z = Math.sin(angle) * radius + centerZ;
        this.camera.position.y = height;
        this.camera.lookAt(this.cameraTarget);
      },
    });
  }

  zoomToPlayer() {
    this.cameraAnimation.pause();
    gsap.killTweensOf(this.cameraAnimation);

    gsap.to(this.camera.position, {
      duration: 2,
      x: 0,
      y: 1,
      z: 2.1,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camera.lookAt(1, 1, 1);
      },
    });
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
      if (this.currentIntersect && this.game.ui.isActive) {
        this.currentIntersect.customFunction();
      }
    });
    // Resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    // Mouse position
    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
  }
}
