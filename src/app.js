/*------------------------------
Imports
------------------------------*/
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase.js";
import Model from "./model.js";

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
Models
------------------------------*/
const bitcoin = new Model({
	name: "bitcoin",
	file: "./models/bitcoin.glb",
	scene: scene,
	colour1: "#F3654F",
	colour2: "#F3654F",
	background: "#0D1B2C",
	placeOnLoad: true,
});

const ethereum = new Model({
	name: "ethereum",
	file: "./models/ethereum.glb",
	scene: scene,
	colour1: "#F3654F",
	colour2: "#F3654F",
	background: "#0D1B2C",
});

const platonicman = new Model({
	name: "platonicman",
	file: "./models/platonicman.glb",
	scene: scene,
	colour1: "#F3654F",
	colour2: "#F3654F",
	background: "#0D1B2C",
});

const cubeman = new Model({
	name: "cubeman",
	file: "./models/cubeman.glb",
	scene: scene,
	colour1: "#F3654F",
	colour2: "#F3654F",
	background: "#0D1B2C",
});

const sphereman = new Model({
	name: "sphereman",
	file: "./models/sphereman.glb",
	scene: scene,
	colour1: "#F3654F",
	colour2: "#F3654F",
	background: "#0D1B2C",
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
const controls = new OrbitControls(camera, canvas);
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
