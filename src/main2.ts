import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterControl, KeyDisplay } from "./utils";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import light from "./utils/light";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

//sence
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78c1f3);

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
// orbitControl.minDistance = 3;
// orbitControl.maxDistance = 15;
// orbitControl.enablePan = false;
// orbitControl.maxPolarAngle = Math.PI / 2 - 0.5;

//axes
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

//light
const directionalLight = light(scene);

//world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});
//ground
const sizeGroundBody = new CANNON.Box(new CANNON.Vec3(100, 1, 100));
const width = sizeGroundBody.halfExtents.x * 2;
const height = sizeGroundBody.halfExtents.y * 2;
const dept = sizeGroundBody.halfExtents.z * 2;
const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: sizeGroundBody,
});
// groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
world.addBody(groundBody);

const cannonDebugger = CannonDebugger(scene, world, {});

const texture = new THREE.TextureLoader();
const groundTexture = texture.load("./public/textures/ground.jpg");

const groundGeometry = new THREE.BoxGeometry(width, height, dept);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  map: groundTexture,
  roughness: 0.5,
  metalness: 0.5,
});
(groundMaterial.map as THREE.Texture).wrapS = THREE.RepeatWrapping;
(groundMaterial.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
(groundMaterial.map as THREE.Texture).repeat.x = 50;
(groundMaterial.map as THREE.Texture).repeat.y = 50;
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(ground);

//model
let model: THREE.Mesh;
let boxBody: CANNON.Body;
const fbxLoader = new FBXLoader();
fbxLoader.load("./public/models/charactor0.fbx", (object) => {
  // object.traverse((child) => {
  //   if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
  //     ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent =
  //       false;
  //   }
  // });
  object.scale.set(0.01, 0.01, 0.01);
  object.updateMatrix();
  object.updateMatrixWorld();
  model = object.clone() as unknown as THREE.Mesh;
  scene.add(model);

  // its not working
  model.position.x = 20

  // let bbox = new THREE.Box3().setFromObject(model);
  // let size = bbox.getSize(new THREE.Vector3()); // HEREyou get the size
  // boxBody = new CANNON.Body({
  //   mass: 1,
  //   shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
  // });
  // boxBody.position.set(1, 100, 0);
  // world.addBody(boxBody);
});

//event
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
});

const animate = (time: DOMHighResTimeStamp) => {
  world.fixedStep();
  cannonDebugger.update();

  ground.position.copy(groundBody.position as unknown as THREE.Vector3);
  if (model && boxBody) {
    // model.position.copy(boxBody.position as unknown as THREE.Vector3);
    // model.quaternion.copy(boxBody.quaternion as unknown as THREE.Quaternion);
  }

  orbitControl.update();
  renderer.render(scene, camera);
};

//run
renderer.setAnimationLoop(animate);
