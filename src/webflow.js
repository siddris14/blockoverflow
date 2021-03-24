/*------------------------------
GLSL
------------------------------*/
const vertex = `

	attribute vec3 aRandom;

	uniform float uTime;
	uniform float uScale;
	uniform float uAmplitude;
	uniform float uFrequency;
	uniform float uTimeFrequency;
	uniform float uRandomFrequency;

	varying vec3 vPosition;

	void main() {

		float newTime = uTime * uTimeFrequency;

		vec3 newPosition = position;
		newPosition.x += sin(newTime * aRandom.x) * uRandomFrequency;
		newPosition.y += cos(newTime * aRandom.y) * uRandomFrequency;
		newPosition.z += cos(newTime * aRandom.z) * uRandomFrequency;

		newPosition.x *= uScale + (sin(newPosition.y * uFrequency + newTime) * (1. - uScale));
		newPosition.y *= uScale + (cos (newPosition.z * uFrequency + newTime) * (1. - uScale));
		newPosition.z *= uScale + (sin(newPosition.x * uFrequency + newTime) * (1. - uScale));

		newPosition *= uScale;

		vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.);

		gl_Position = projectionMatrix * mvPosition;
		gl_PointSize = uAmplitude / -mvPosition.z;

		// Varyings
		vPosition = position;

	}

`;

const fragment = `

	uniform float uTime;
	uniform vec3 uColour1;
	uniform vec3 uColour2;

	varying vec3 vPosition;

	void main(){

		vec3 color = vec3(0., 1., 1.);
		float sceneDepth = vPosition.z * .5 + .5;

		color = mix(uColour1, uColour2, sceneDepth);

		gl_FragColor = vec4(color, sceneDepth * 1. + .2);

	}

`;

/*------------------------------
GSAP Register Plugins
------------------------------*/
gsap.registerPlugin(CustomEase);
CustomEase.create("myEaseSmooth", "0.33,0,0,1");

/*------------------------------
Main Setup
------------------------------*/
// Canvas
const canvas = document.querySelector(".webgl");

// Scene
const scene = new THREE.Scene();

// Options
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

/*------------------------------
Camera – Perspective
------------------------------*/
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;

scene.add(camera);

/*------------------------------
Handle Mouse Move
------------------------------*/
const cursor = {
	x: 0,
	y: 0,
};

window.addEventListener("mousemove", (event) => {
	cursor.x = event.clientX / sizes.width - 0.5;
	cursor.y = -(event.clientY / sizes.height - 0.5);
});

/*------------------------------
Models Class
------------------------------*/

class Model {
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
		this.loader = new THREE.GLTFLoader();
		this.dracoLoader = new THREE.DRACOLoader();
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
			const sampler = new THREE.MeshSurfaceSampler(this.mesh).build();
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

/*------------------------------
Models
------------------------------*/
const bitcoin = new Model({
	name: "bitcoin",
	file: "./models/bitcoin.glb",
	scene: scene,
	colour1: "red",
	colour2: "yellow",
	background: "#0E1009",
	placeOnLoad: true,
});

const ethereum = new Model({
	name: "ethereum",
	file: "./models/ethereum.glb",
	scene: scene,
	colour1: "yellow",
	colour2: "green",
	background: "#1C100C",
});

const platonicman = new Model({
	name: "platonicman",
	file: "./models/platonicman.glb",
	scene: scene,
	colour1: "red",
	colour2: "green",
	background: "#0E1009",
});

const cubeman = new Model({
	name: "cubeman",
	file: "./models/cubeman.glb",
	scene: scene,
	colour1: "red",
	colour2: "yellow",
	background: "#0E1009",
});

const sphereman = new Model({
	name: "sphereman",
	file: "./models/sphereman.glb",
	scene: scene,
	colour1: "yellow",
	colour2: "green",
	background: "#1C100C",
});

/*------------------------------
Controller Butons
------------------------------*/
const buttons = document.querySelectorAll(".button");

// Bitcoin
buttons[0].addEventListener("click", () => {
	bitcoin.add();
	ethereum.remove();
	cubeman.remove();
	sphereman.remove();
	platonicman.remove();
});

// Ethereum
buttons[1].addEventListener("click", () => {
	bitcoin.remove();
	ethereum.add();
	cubeman.remove();
	sphereman.remove();
	platonicman.remove();
});

// Platonicman
buttons[2].addEventListener("click", () => {
	bitcoin.remove();
	ethereum.remove();
	cubeman.remove();
	sphereman.remove();
	platonicman.add();
});

// Cubeman
buttons[3].addEventListener("click", () => {
	bitcoin.remove();
	ethereum.remove();
	cubeman.add();
	sphereman.remove();
	platonicman.remove();
});

// Sphereman
buttons[4].addEventListener("click", () => {
	bitcoin.remove();
	ethereum.remove();
	cubeman.remove();
	sphereman.add();
	platonicman.remove();
});

// Intro animation
gsap.from(buttons, { y: 89, opacity: 0, duration: 1.29, ease: "myEaseSmooth", stagger: 0.13, delay: 0.5 });

// Hover animation
buttons.forEach((button) => {
	button.addEventListener("mouseenter", () => {
		gsap.to(button, { opacity: 0.3, scale: 0.9, duration: 0.8, ease: "myEaseSmooth" });
	});

	button.addEventListener("mouseleave", () => {
		gsap.to(button, { opacity: 1, scale: 1, duration: 0.8, ease: "myEaseSmooth" });
	});
});

/*------------------------------
Orbit Controls
------------------------------*/
const controls = new THREE.OrbitControls(camera, canvas);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/*------------------------------
Handle Resize
------------------------------*/
window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/*------------------------------
Handle Fullscreen All Browsers
------------------------------*/
window.addEventListener("dblclick", () => {
	const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

	if (!fullscreenElement) {
		// Element for fullscreen
		if (canvas.requestFullscreen) {
			canvas.requestFullscreen();
		} else if (canvas.webkitRequestFullscreen) {
			canvas.webkitRequestFullscreen();
		}
	} else {
		// Leave fullscreen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
});

/*------------------------------
Renderer
------------------------------*/
const renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/*------------------------------
Clock
------------------------------*/
const clock = new THREE.Clock();

/*------------------------------
Animations
------------------------------*/
const tick = () => {
	/*------------------------------
	Elapsed Time
	------------------------------*/
	const elapsedTime = clock.getElapsedTime();

	/*------------------------------
	Update Camera Position
	------------------------------*/
	gsap.to(camera.position, { x: cursor.x * Math.PI * 2 });
	gsap.to(camera.position, { y: cursor.y * Math.PI * 2 });
	camera.lookAt(new THREE.Vector3());

	/*------------------------------
	Update uTime for each model
	------------------------------*/

	// Bitcoin
	if (bitcoin.isActive) {
		bitcoin.particlesMaterial.uniforms.uTime.value = elapsedTime;
	}

	// Ethereum
	if (ethereum.isActive) {
		ethereum.particlesMaterial.uniforms.uTime.value = elapsedTime;
	}

	// Platonicman
	if (platonicman.isActive) {
		platonicman.particlesMaterial.uniforms.uTime.value = elapsedTime;
	}

	// Cubeman
	if (cubeman.isActive) {
		cubeman.particlesMaterial.uniforms.uTime.value = elapsedTime;
	}

	// Sphereman
	if (sphereman.isActive) {
		sphereman.particlesMaterial.uniforms.uTime.value = elapsedTime;
	}

	/*------------------------------
	Update orbit controls
	------------------------------*/
	controls.update();

	/*------------------------------
	Render & rAF
	------------------------------*/
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
