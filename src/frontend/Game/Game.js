import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import Loader from '../Utils/Loader.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import World from '../World/World.js';
export default class Game 
{
    constructor()
    {
        // Does not create a new instance of World because it is a singleton
        this.world = new World(document.querySelector('.webgl'));

        // Objects group
        this.gameGroup = new THREE.Group();
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.add(this.gameGroup);

        // Loader
        this.loader = null;

        // GUI - TODO: make one global GUI
        this.gui = new GUI();
    }

    addAmbientLight(intensity, color)
    {
        const ambientLight = new THREE.AmbientLight(color, intensity)
        this.scene.add(ambientLight)
    }

    addDirectionalLight(intensity, color, Vector3)
    {
        const directionalLight = new THREE.DirectionalLight(color, intensity)
        directionalLight.position.set(Vector3.x, Vector3.y, Vector3.z);
        this.gui.add(directionalLight.position, 'x').min(-10).max(10).step(0.001).name('Light x');
        this.gui.add(directionalLight.position, 'y').min(-10).max(10).step(0.001).name('Light y');
        this.gui.add(directionalLight.position, 'z').min(-10).max(10).step(0.001).name('Light z');
        this.scene.add(directionalLight)
    }

    addSky(size, turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition)
    {
        const sky = new Sky();
        sky.scale.setScalar(size);
        sky.material.uniforms['turbidity'].value = turbidity;
        sky.material.uniforms['rayleigh'].value = rayleigh;
        sky.material.uniforms['mieCoefficient'].value = mieCoefficient;
        sky.material.uniforms['mieDirectionalG'].value = mieDirectionalG;
        sky.material.uniforms['sunPosition'].value.set(sunPosition.x, sunPosition.y, sunPosition.z);
        this.scene.add(sky);
    }

    addSea(width, height, waterColor, sunColor, distortionScale) 
    {
        const waterGeometry = new THREE.PlaneGeometry( width, height );

        this.water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load( 'static/textures/waternormals.jpg', 
                    function ( texture ) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    } 
                ),
                sunDirection: new THREE.Vector3(),
                sunColor,
                waterColor,
                distortionScale,
                fog: this.scene.fog !== undefined
            }
        );

        this.water.rotation.x = - Math.PI / 2;
        this.water.material.uniforms['size'].value = 10;
        this.scene.add( this.water );
    }

    addObjects(objects)
    {
        for (const object of objects) {
            this.gameGroup.add(object);
        }
    }

    addGameLoop(loop)
    {
        this.gameLoop = loop;
    }

    loadResources(sources) {
        this.loader = new Loader(sources);
    }
};