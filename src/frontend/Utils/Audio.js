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

    this.currentSongIndex = 0;
    this.isBackgroundMusicPlaying = false;

    this.masterVolume = this.listener.getMasterVolume();
  }

  addBackgroundMusic(songs, gui = null) {
    this.backgroundMusic = [];
    this.backgroundMusicCurrentTime = [];
    this.backgroundMusicStartTime = [];

    songs.forEach((song, index) => {
      const audio = new THREE.Audio(this.listener);
      this.audioLoader.load(song, (buffer) => {
        audio.setBuffer(buffer);
        audio.setVolume(0.5);
        audio.setLoop(false);
        this.backgroundMusic[index] = audio;
        this.backgroundMusicCurrentTime[index] = 0;
        this.backgroundMusicStartTime[index] = 0;
      });
    });

    console.log("Background music added ", songs);

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

    document.querySelector(".stopMusic").addEventListener("click", (event) => {
      this.stopBackgroundMusic(this.currentSongIndex);
    });

    document.querySelector(".startMusic").addEventListener("click", (event) => {
      this.startBackgroundMusic(this.currentSongIndex, false);
    });

    document
      .querySelector(".previousSong")
      .addEventListener("click", (event) => {
        this.previousSong();
      });

    document.querySelector(".nextSong").addEventListener("click", (event) => {
      this.nextSong();
    });
  }

  stopBackgroundMusic(index) {
    if (this.backgroundMusic[index]) {
      // calculate the time that has passed since the last play
      this.backgroundMusicCurrentTime[index] =
        (Date.now() - this.backgroundMusicStartTime[index]) / 1000 +
        this.backgroundMusicCurrentTime[index];

      this.backgroundMusic[index].stop();
      this.isBackgroundMusicPlaying = false;
    }
  }

  startBackgroundMusic(index, fromStart = false) {
    if (this.backgroundMusic[index] && !this.isBackgroundMusicPlaying) {
      if (fromStart) {
        this.backgroundMusic[index].offset = 0;
      } else {
        this.backgroundMusic[index].offset =
          this.backgroundMusicCurrentTime[index];
      }

      // set the start time
      this.backgroundMusicStartTime[index] = Date.now();

      this.backgroundMusic[index].play();
      this.isBackgroundMusicPlaying = true;
    }
  }

  previousSong() {
    if (this.currentSongIndex <= 0) {
      return;
    }

    this.stopBackgroundMusic(this.currentSongIndex);

    this.currentSongIndex--;
    this.startBackgroundMusic(this.currentSongIndex, true);
  }

  nextSong() {
    if (this.currentSongIndex >= this.backgroundMusic.length) {
      return;
    }

    this.stopBackgroundMusic(this.currentSongIndex);

    this.currentSongIndex++;
    this.startBackgroundMusic(this.currentSongIndex, true);
  }
}
