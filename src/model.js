/*------------------------------
Imports
------------------------------*/
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import vertex from "./shader/vertex.glsl";
import fragment from "./shader/fragment.glsl";
import * as dat from "dat.gui";

/*------------------------------
GSAP Register Plugins
------------------------------*/
gsap.registerPlugin(CustomEase);
CustomEase.create("myEaseSmooth", "0.33,0,0,1");

/*------------------------------
Models Class
------------------------------*/

export default class Model {
	constructor(object) {
		/*------------------------------
		Object Declarations
		------------------------------*/
		this.name = object.name;
		this.file = object.file;
		this.scene = object.scene;

		this.placeOnLoad = object.placeOnLoad;

		this.colour1 = object.colour1;
		this.colour2 = object.colour2;
		this.background = object.background;

		/*------------------------------
		Models States
		------------------------------*/
		this.isActive = false;

		/*------------------------------
		GLTF & Draco Loaders
		------------------------------*/
		this.loader = new GLTFLoader();
		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderPath("./draco/");
		this.loader.setDRACOLoader(this.dracoLoader);

		/*------------------------------
		Custom Parameters
		------------------------------*/
		this.myParams = {
			frames: 0,
			frames89: 1.29,
			frames144: 2.24,
			frames233: 3.53,
			easings: null,
			expo: "Expo.easeInOut",
			smooth: "myEaseSmooth",
			rotate: null,
			rotate180: Math.PI,
			rotate360: Math.PI * 2,
		};

		/*------------------------------
		Call Methods
		------------------------------*/
		this.init();
	}

	init() {
		/*------------------------------
		Start loader
		------------------------------*/
		this.loader.load(this.file, (response) => {
			/*------------------------------
			Initial Mesh
			------------------------------*/
			this.mesh = response.scene.children[0];

			/*------------------------------
			Particles Custom Geometry
			------------------------------*/
			const sampler = new MeshSurfaceSampler(this.mesh).build();
			const numberOfParticles = 20000;

			// Create the geometry
			this.particlesGeometry = new THREE.BufferGeometry();

			// Create Float 32 array
			const particlesPosition = new Float32Array(numberOfParticles * 3);
			const particlesRandomness = new Float32Array(numberOfParticles * 3);

			// Run count
			for (let i = 0; i < numberOfParticles; i++) {
				const newPosition = new THREE.Vector3();
				sampler.sample(newPosition);

				// Particles position
				particlesPosition.set([newPosition.x, newPosition.y, newPosition.z], i * 3);

				// Particles randomness
				particlesRandomness.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], i * 3);
			}

			// Create buffer attribute
			this.particlesPositionBufferAttribute = new THREE.BufferAttribute(particlesPosition, 3);
			this.particlesRandomBufferAttribute = new THREE.BufferAttribute(particlesRandomness, 3);

			// Set Attribute
			this.particlesGeometry.setAttribute("position", this.particlesPositionBufferAttribute);
			this.particlesGeometry.setAttribute("aRandom", this.particlesRandomBufferAttribute);

			/*------------------------------
			Particles Custom Material
			------------------------------*/

			this.particlesMaterial = new THREE.ShaderMaterial({
				uniforms: {
					uAlpha: { value: 1 },
					uTime: { value: 0 },
					uScale: { value: 0 },
					uAmplitude: { value: 8 },
					uFrequency: { value: 5 },
					uTimeFrequency: { value: 5 },
					uRandomFrequency: { value: 0.01 },
					uColour1: { value: new THREE.Color(this.colour1) },
					uColour2: { value: new THREE.Color(this.colour2) },
				},

				vertexShader: vertex,
				fragmentShader: fragment,

				transparent: true,
				depthTest: false,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
			});

			/*------------------------------
			Particles Mesh
			------------------------------*/
			this.particles = new THREE.Points(this.particlesGeometry, this.particlesMaterial);
			this.particles.rotation.x = Math.PI / 2;

			/*------------------------------
			Place on Load
			------------------------------*/
			if (this.placeOnLoad) {
				this.add();
			}
		});
	}

	add() {
		this.scene.add(this.particles);
		this.isActive = true;

		/*------------------------------
		Add GSAP animation
		------------------------------*/
		const timeline = new gsap.timeline({ defaults: { duration: this.myParams.frames89, ease: this.myParams.smooth } });

		timeline.to(this.particlesMaterial.uniforms.uScale, { value: 1, delay: 0.3 });
		timeline.to(this.particles.rotation, { x: this.particles.rotation.x + this.myParams.rotate360 }, "<");
		timeline.to("body", { background: this.background }, "<");

		/*------------------------------
		Run Debug
		------------------------------*/
		this.gui = new dat.GUI({ name: "Debug Panel", width: 377 });

		// Debug Folders
		const uniformsFolder = this.gui.addFolder("Uniforms Folder");

		/*------------------------------
		Debug – Uniforms
		------------------------------*/
		this.gui.add(this.particlesMaterial.uniforms.uScale, "value").min(-5).max(5).step(0.001).name("uScale");
		this.gui.add(this.particlesMaterial.uniforms.uAmplitude, "value").min(-50).max(50).step(0.001).name("uAmplitude");
		this.gui.add(this.particlesMaterial.uniforms.uFrequency, "value").min(-50).max(50).step(0.001).name("uFrequency");
		this.gui.add(this.particlesMaterial.uniforms.uTimeFrequency, "value").min(-50).max(50).step(1).name("uTimeFrequency");
		this.gui.add(this.particlesMaterial.uniforms.uRandomFrequency, "value").min(-1).max(1).step(0.001).name("uRandomFrequency");
	}

	remove() {
		/*------------------------------
		Add GSAP animation
		------------------------------*/
		const timeline = new gsap.timeline({ defaults: { duration: this.myParams.frames89, ease: this.myParams.smooth } });

		timeline.to(this.particlesMaterial.uniforms.uScale, {
			value: 0,
			onComplete: () => {
				this.scene.remove(this.particles);
				this.isActive = false;
			},
		});

		timeline.to(this.particles.rotation, { x: this.particles.rotation.x + this.myParams.rotate360 }, "<");
	}
}
