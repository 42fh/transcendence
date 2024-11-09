import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const width = 1;
const height = 0.3;
const depth = 0.1;

export default class GameUI {
  constructor(game) {
    this.game = game;
    this.selector = new THREE.Group();
    this.isActive = false;
    this.currentSkin = 0;
  }

  createSelector() {
    // Create main panel
    const panelGeometry = new THREE.BoxGeometry(width, height, depth);
    const panelMaterial = new THREE.MeshBasicMaterial({ color: "purple" });
    this.panel = new THREE.Mesh(panelGeometry, panelMaterial);

    this.mainText = this.createButton(
      width * 0.9,
      height * 0.9,
      0,
      0,
      depth / 2 + 0.001,
      "beach"
    );
    this.mainText.material.color.set("purple");
    this.panel.add(this.mainText);
    this.selector.add(this.panel);

    // Create left arrow
    this.leftArrow = this.createButton(
      0.3,
      height,
      -width / 2 - 0.15,
      0,
      0,
      "<"
    );
    this.leftArrow.customFunction = () => {
      if (this.currentSkin == 0) {
        this.currentSkin = this.game.skins.length - 1;
      } else {
        this.currentSkin--;
      }
      this.game.paddles.get(this.game.playerId).material.map =
        this.game.skins[this.currentSkin];

      this.updateMainText(this.game.skins[this.currentSkin].name);
    };
    this.leftArrow.originalColor = this.leftArrow.material.color.getHex();
    this.selector.add(this.leftArrow);

    // Create right arrow
    this.rightArrow = this.createButton(
      0.3,
      height,
      width / 2 + 0.15,
      0,
      0,
      ">"
    );
    this.rightArrow.customFunction = () => {
      if (this.currentSkin == this.game.skins.length - 1) {
        this.currentSkin = 0;
      } else {
        this.currentSkin++;
      }
      this.game.paddles.get(this.game.playerId).material.map =
        this.game.skins[this.currentSkin];

      this.updateMainText(this.game.skins[this.currentSkin].name);
    };
    this.rightArrow.originalColor = this.rightArrow.material.color.getHex();
    this.selector.add(this.rightArrow);

    this.game.addObjects([this.selector]);
    this.selector.rotation.y = Math.PI / 2;
    this.selector.position.set(-2, 0.5, 0);

    this.isActive = true;
  }

  createButton(width, height, x, y, z, text) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(x, y, z);

    // Add text to the button
    const fontUrl =
      "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/fonts/helvetiker_regular.typeface.json"; // TODO: download font and move to the static folder
    const loader = new FontLoader();
    loader.load(fontUrl, (font) => {
      const textGeometry = new TextGeometry(text, {
        font: font,
        size: height * 0.5,
        height: 0.01,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-width / 2 + 0.1, -height / 4, 0.13);
      button.add(textMesh);
    });

    this.game.addObjects([button]);
    return button;
  }

  createScoreTable(x, y, z, players) {
    // delete selector
    if (this.isActive) {
      this.selector.removeFromParent();
    }

    this.isActive = false;

    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);

    // Create table header
    const headerWidth = 1.2;
    const headerHeight = 0.2;
    const header = this.createButton(
      headerWidth,
      headerHeight,
      0,
      0,
      0,
      "Scores"
    );
    header.material.color.setHex(0x444444);
    tableGroup.add(header);

    // Create rows for each player
    const rowHeight = 0.15;
    const columnWidth = headerWidth / 2;

    players.forEach((player, index) => {
      const yOffset = -headerHeight - index * rowHeight - 0.05;

      // Player name column
      const nameButton = this.createButton(
        columnWidth,
        rowHeight,
        -columnWidth / 2,
        yOffset,
        0,
        player.name
      );
      nameButton.material.color.setHex(0x555555);
      tableGroup.add(nameButton);

      // Player score column
      const scoreButton = this.createButton(
        columnWidth,
        rowHeight,
        columnWidth / 2,
        yOffset,
        0,
        player.score.toString()
      );
      scoreButton.material.color.setHex(0x666666);
      tableGroup.add(scoreButton);

      // Store reference to score button for easy updating
      player.scoreButton = scoreButton;
    });

    tableGroup.rotation.y = Math.PI / 2;
    this.game.addObjects([tableGroup]);
    return tableGroup;
  }

  updateMainText(newText) {
    this.panel.remove(this.mainText);

    this.mainText = this.createButton(
      width * 0.9,
      height * 0.9,
      0,
      0,
      depth / 2 + 0.001,
      newText
    );
    this.mainText.material.color.set("purple");
    this.panel.add(this.mainText);
  }
}
