import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Loader {
  constructor(sources, game) {
    this.game = game;

    this.sources = sources;

    // this.loader = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();

    this.items = {};
    this.length = this.sources.length;

    this.startLoad();
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
    // save the loaded file
    this.items[source.name] = file;

    if (source.isSkin) {
      file.name = source.name;
      this.game.skins.push(file);
    }

    // check if all files are loaded
    this.length--;
    if (this.length == 0) {
      console.log("All files loaded");
      window.dispatchEvent(new Event("resourcesLoaded"));
    }
  }
}
