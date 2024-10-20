import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';

export default class Game 
{
    constructor()
    {
        this.gameGroup = new THREE.Group();
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.add(this.gameGroup);

        // Cube
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 'red' })
        );
        this.gameGroup.add(cube);
    }

    addAmbientLight(intensity, color)
    {
        const ambientLight = new THREE.AmbientLight(color, intensity)
        this.scene.add(ambientLight)
    }

    addDirectionalLight(intensity, color, Vector3)
    {
        const directionalLight = new THREE.DirectionalLight(color, intensity)
        directionalLight.position.set(Vector3)

        this.scene.add(directionalLight)
    }

    addSky(size, turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition)
    {
        this.sky = new Sky();
        this.sky.scale.setScalar(size);
        this.sky.material.uniforms['turbidity'].value = turbidity;
        this.sky.material.uniforms['rayleigh'].value = rayleigh;
        this.sky.material.uniforms['mieCoefficient'].value = mieCoefficient;
        this.sky.material.uniforms['mieDirectionalG'].value = mieDirectionalG;
        this.sky.material.uniforms['sunPosition'].value.set(sunPosition);
        this.scene.add(this.sky);
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

    addGameLoop(loop)
    {
        this.gameLoop = loop;
    }
};