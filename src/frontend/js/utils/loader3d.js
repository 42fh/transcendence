import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Loader {
  constructor(sources, game) {
    this.game = game;
    this.sources = sources;
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.items = {};
    this.length = this.sources.length;
    this.loaded = 0;

    // Create loading bar elements
    this.createLoadingScreen();
    this.startLoad();
  }

  createLoadingScreen() {
    this.loadingBar = document.createElement("div");
    this.loadingBar.className = "loading-bar";

    this.loadingBarFill = document.createElement("div");
    this.loadingBarFill.className = "loading-bar-fill";

    this.loadingText = document.createElement("div");
    this.loadingText.className = "loading-text";
    this.loadingText.textContent = "Loading... 0%";

    this.loadingBar.appendChild(this.loadingBarFill);
    this.loadingBar.appendChild(this.loadingText);
    document.body.appendChild(this.loadingBar);
  }

  updateLoadingBar() {
    const progress = (this.loaded / this.sources.length) * 100;
    this.loadingBarFill.style.width = `${progress}%`;
    this.loadingText.textContent = `Loading... ${Math.round(progress)}%`;
  }

  startLoad() {
    for (const source of this.sources) {
      if (source.type == "texture") {
        this.textureLoader.load(source.url, (texture) => {
          this.resourseLoaded(source, texture);
        });
      } else if (source.type == "gltf") {
        this.gltfLoader.load(source.url, (gltf) => {
          this.resourseLoaded(source, gltf);
        });
      }
    }
  }

  resourseLoaded(source, file) {
    this.items[source.name] = file;

    if (source.isSkin) {
      file.name = source.name;
      this.game.skins.push(file);
    }

    this.loaded++;
    this.updateLoadingBar();

    if (this.loaded === this.sources.length) {
      console.log("All files loaded");
      setTimeout(() => {
        document.body.removeChild(this.loadingBar);
        this.game.setupResources();
      }, 500);
    }
  }
}
