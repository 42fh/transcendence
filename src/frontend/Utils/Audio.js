import * as THREE from "three";

let instance = null;

export default class Audio {
  constructor(camera) {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    this.audioLoader = new THREE.AudioLoader();
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    this.masterVolume = this.listener.getMasterVolume();
  }

  addBackgroundMusic(song, gui = null) {
    const sound = new THREE.Audio(this.listener);
    this.audioLoader.load(song, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
      sound.play();
    });

    if (gui) {
      gui.gui
        .add(this, "masterVolume")
        .min(0)
        .max(1)
        .step(0.01)
        .name("Volume")
        .onChange(() => {
          this.listener.setMasterVolume(this.masterVolume);
        });
    }
  }
}
