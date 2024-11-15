import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";

let instance = null;
export default class Debug {
  constructor() {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    this.debug = false;
    if (window.location.hash == "#debug") {
      this.gui = new GUI();
      this.debug = true;
    }
  }
}
