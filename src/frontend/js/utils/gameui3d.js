import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const width = 1;
const height = 0.3;
const depth = 0.1;

const sectorColors = [
  0xff0000, // Red
  0x00ff00, // Green
  0x0000ff, // Blue
  0xffff00, // Yellow
  0xff00ff, // Magenta
  0x00ffff, // Cyan
  0xff8000, // Orange
  0x8000ff, // Purple
  0x0080ff, // Light Blue
  0xff0080, // Pink
  0x80ff00, // Lime
];

export default class GameUI {
  constructor(game) {
    this.game = game;
    this.selector = new THREE.Group();
    this.tableGroup = new THREE.Group();
    this.isActive = false;
    this.currentSkin = 0;
    this.fontUrl =
      "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/fonts/helvetiker_regular.typeface.json";
    this.fontLoader = new FontLoader();
  }

  createSelector() {
    const panelGeometry = new THREE.BoxGeometry(width, height, depth);
    const panelMaterial = new THREE.MeshBasicMaterial({ color: "purple" });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);

    this.mainText = this.createButton(
      width * 0.9,
      height * 0.9,
      0,
      0,
      depth / 2 + 0.001,
      "random"
    );
    this.mainText.material.color.set("purple");
    this.selector.add(this.mainText);
    this.selector.add(panel);

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
      this.game.paddles.get(this.game.playerIndex).material.map =
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
      this.game.paddles.get(this.game.playerIndex).material.map =
        this.game.skins[this.currentSkin];

      this.updateMainText(this.game.skins[this.currentSkin].name);
    };
    this.rightArrow.originalColor = this.rightArrow.material.color.getHex();
    this.selector.add(this.rightArrow);

    this.selector.rotation.y = 0;

    this.isActive = true;
    this.selector.position.set(0.12, 0.6, -2.5);
    // this.game.world.gui.gui.add(this.selector.position, "x", -2, 2);
    // this.game.world.gui.gui.add(this.selector.position, "y", -2, 2);
    // this.game.world.gui.gui.add(this.selector.position, "z", -8, 2);

    this.game.scene.add(this.selector);
  }

  createButton(width, height, x, y, z, text) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: 0x2b2a28 });
    const button = new THREE.Mesh(geometry, material);
    button.position.set(x, y, z);

    this.fontLoader.load(this.fontUrl, (font) => {
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

    return button;
  }

  createScoreTable(x, y, z) {
    if (this.isActive) {
      this.selector.removeFromParent();
    }

    this.isActive = false;

    this.tableGroup.position.set(x, y, z);

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
    this.tableGroup.add(header);

    const rowHeight = 0.15;
    const columnWidth = headerWidth / 2;
    const colorSquareSize = rowHeight;

    this.game.paddles.forEach((player, index) => {
      const yOffset = -headerHeight - index * rowHeight - 0.05;

      // Create color indicator square
      const colorGeometry = new THREE.PlaneGeometry(
        colorSquareSize,
        colorSquareSize
      );
      const colorMaterial = new THREE.MeshBasicMaterial({
        color: sectorColors[index],
        side: THREE.DoubleSide,
      });
      const colorSquare = new THREE.Mesh(colorGeometry, colorMaterial);
      colorSquare.position.set(-columnWidth + colorSquareSize, yOffset, 0.01);
      this.tableGroup.add(colorSquare);

      const nameButton = this.createButton(
        columnWidth,
        rowHeight,
        -columnWidth / 2 + colorSquareSize * 1.2,
        yOffset,
        0,
        this.game.playerNames[index]
          ? this.game.playerNames[index].username
            ? this.game.playerNames[index].username
            : this.game.playerNames[index]
          : `Player ${index + 1}`
      );
      nameButton.material.color.setHex(0x555555);
      this.tableGroup.add(nameButton);

      const scoreButton = this.createButton(
        columnWidth / 3,
        rowHeight,
        columnWidth / 2,
        yOffset,
        0,
        "0"
      );
      scoreButton.material.color.setHex(0x666666);
      this.tableGroup.add(scoreButton);

      player.scoreButton = scoreButton;
    });

    this.tableGroup.rotation.y = 0;
    this.tableGroup.position.set(0.12, 0.9, -1.5);
    this.game.scene.add(this.tableGroup);
  }

  updateScoreTable(scores) {
    scores.forEach((score, index) => {
      if (score !== this.game.scores[index] && score !== 0) {
        console.log(`Player ${index + 1} score: ${score}`);
        this.game.scores[index] = score;

        const player = this.game.paddles.get(index);
        if (player.scoreButton && player.scoreButton.children[0]) {
          const textMesh = player.scoreButton.children[0];

          this.fontLoader.load(this.fontUrl, (font) => {
            textMesh.geometry.dispose();
            const newGeometry = new TextGeometry(score.toString(), {
              font: font,
              size: 0.1,
              height: 0.01,
            });
            newGeometry.computeBoundingBox();
            const centerOffset =
              -0.5 *
              (newGeometry.boundingBox.max.x - newGeometry.boundingBox.min.x);
            textMesh.geometry = newGeometry;
            textMesh.position.x = centerOffset;
          });
        }
      }
    });
  }

  updateMainText(newText) {
    this.selector.remove(this.mainText);

    this.mainText = this.createButton(
      width * 0.9,
      height * 0.9,
      0,
      0,
      depth / 2 + 0.001,
      newText
    );
    this.mainText.material.color.set("purple");
    this.selector.add(this.mainText);
  }
}
