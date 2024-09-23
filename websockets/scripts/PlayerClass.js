import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


export class Player
{
	constructor(x, y)
	{
		// scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x08121E);

		// camera
		const aspectRatio = window.innerWidth / window.innerHeight;
		this.camera = new THREE.PerspectiveCamera( 75, aspectRatio, 0.1, 1000 );
		this.camera.position.set(0, 0, 5);

		// canvas from html
		const canvas = document.querySelector(".webgl");

		// light
		const light = new THREE.DirectionalLight('white', 8);
		light.position.set(10, 10, 10);
		this.scene.add(light);

		
		// controls
		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.enableDamping = true;
		this.controls.enablePan = true;
		this.controls.enableZoom = true;
		this.controls.enableRotate = true;
		
		// cube
		const geometry = new THREE.BoxGeometry( 1, 3, 1 );
		const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
		const cube = new THREE.Mesh( geometry, material );
		cube.position.set(x, y, 0);
		this.scene.add( cube );

		// renderer
		this.renderer = new THREE.WebGLRenderer({canvas});
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.setPixelRatio(window.devicePixelRatio);
      	this.renderer.physicallyCorrectLights = true;
	}
	render()
	{
		this.renderer.render(this.scene, this.camera);
	}
}