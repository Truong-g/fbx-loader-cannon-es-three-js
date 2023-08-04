import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterControl, KeyDisplay } from "./utils";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

//sence
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

//renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

//camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 2, 3);

// control
const orbitControl = new OrbitControls(camera, renderer.domElement);
orbitControl.enableDamping = true;
orbitControl.minDistance = 3;
orbitControl.maxDistance = 15;
orbitControl.enablePan = false;
orbitControl.maxPolarAngle = Math.PI / 2 - 0.5;

//axes
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

//light
light();

//floor
generateFloor();

//models with animation
let characterControl: CharacterControl;
const gtlfLoader = new GLTFLoader();
gtlfLoader.load("./models/Soldier.glb", (gtlf) => {
  const model = gtlf.scene;
  model.traverse((object: any) => {
    if (object.isMesh) {
      object.castShadow = true;
    }
  });
  scene.add(model);
  //animations
  const gtlfAnimations = gtlf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  gtlfAnimations
    .filter((a) => a.name !== "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });
  characterControl = new CharacterControl(
    model,
    mixer,
    animationsMap,
    orbitControl,
    camera,
    "Idle",
    scene
  );
});

const vertices = [];

for (let i = 0; i < 10000; i++) {
  const x = THREE.MathUtils.randFloatSpread(2000);
  const y = THREE.MathUtils.randFloatSpread(2000);
  const z = THREE.MathUtils.randFloatSpread(2000);

  vertices.push(x, y, z);
}

//control keys
const keyPressed: any = {};
const keyDisplayQueue = new KeyDisplay();
window.addEventListener("keydown", (event) => {
  keyDisplayQueue.down(event.key);

  keyPressed[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keyDisplayQueue.up(event.key);
  keyPressed[event.key.toLowerCase()] = false;
});
const clock = new THREE.Clock();

const animate = (time: DOMHighResTimeStamp) => {
  let mixerUpdateDelta = clock.getDelta();
  if (characterControl) {
    characterControl.update(mixerUpdateDelta, keyPressed);
  }
  orbitControl.update();
  renderer.render(scene, camera);
};

//event
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
});

//run
renderer.setAnimationLoop(animate);

//functions
function light() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
  //   scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}

function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const placeholder = textureLoader.load(
    "./textures/placeholder/placeholder.png"
  );
  const sandBaseColor = textureLoader.load(
    "./textures/sand/Sand 002_COLOR.jpg"
  );
  const sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
  const sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
  const sandAmbientOcclusion = textureLoader.load(
    "./textures/sand/Sand 002_OCC.jpg"
  );

  const geometry = new THREE.PlaneGeometry(80, 80);
  const material = new THREE.MeshStandardMaterial({
    map: placeholder,
    // normalMap: sandNormalMap,
    // displacementMap: sandHeightMap,
    // displacementScale: 0.1,
    // aoMap: sandAmbientOcclusion,
  });
  wrapAndRepeatTexture(material.map as THREE.Texture);
  //   wrapAndRepeatTexture(material.normalMap as THREE.Texture);
  //   wrapAndRepeatTexture(material.displacementMap as THREE.Texture);
  //   wrapAndRepeatTexture(material.aoMap as THREE.Texture);
  // const material = new THREE.MeshPhongMaterial({ map: placeholder})

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.x = map.repeat.y = 100;
}
