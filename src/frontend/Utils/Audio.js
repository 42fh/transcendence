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

    this.backgroundMusic = null;
    this.backgroundMusicTime = 0;
    this.isBackgroundMusicPlaying = false;

    this.masterVolume = this.listener.getMasterVolume();
  }

  addBackgroundMusic(song, gui = null) {
    this.backgroundMusic = new THREE.Audio(this.listener);
    this.audioLoader.load(
      song,
      function (buffer) {
        this.backgroundMusic.setBuffer(buffer);
        this.backgroundMusic.setVolume(0.5);
        this.backgroundMusic.setLoop(false);
        this.backgroundMusicTime = 0;
        this.audioBuffer = buffer;
      }.bind(this)
    );

    console.log("Background music added ", song);

    if (gui.debug === true) {
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

    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyP":
          this.stopBackgroundMusic();
          break;
        case "KeyS":
          this.startBackgroundMusic();
          break;
      }
    });
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
      this.isBackgroundMusicPlaying = false;
    }
  }

  startBackgroundMusic() {
    if (this.backgroundMusic && !this.isBackgroundMusicPlaying) {
      // resume
      this.backgroundMusic.offset = this.backgroundMusic.context.currentTime;
      this.backgroundMusic.startTime = this.backgroundMusic.context.currentTime;
      this.backgroundMusic.play();
      this.isBackgroundMusicPlaying = true;
    }
  }
}
