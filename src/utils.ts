import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const W = "w";
export const A = "a";
export const S = "s";
export const D = "d";
export const SHIFT = "shift";
export const DIRECTIONS = [W, A, S, D];

export class KeyDisplay {
  map: Map<string, HTMLDivElement> = new Map();
  constructor() {
    const w: HTMLDivElement = document.createElement("div");
    const a: HTMLDivElement = document.createElement("div");
    const s: HTMLDivElement = document.createElement("div");
    const d: HTMLDivElement = document.createElement("div");
    const shift: HTMLDivElement = document.createElement("div");

    this.map.set(W, w);
    this.map.set(A, a);
    this.map.set(S, s);
    this.map.set(D, d);
    this.map.set(SHIFT, shift);

    this.map.forEach((v, k) => {
      v.style.color = "blue";
      v.style.fontSize = "50px";
      v.style.fontWeight = "800";
      v.style.position = "absolute";
      v.textContent = k;
    });

    this.updatePosition();

    this.map.forEach((v, _) => {
      document.body.append(v);
    });
  }

  public updatePosition() {
    //@ts-ignore
    this.map.get(W).style.top = `${window.innerHeight - 150}px`;
    //@ts-ignore

    this.map.get(A).style.top = `${window.innerHeight - 100}px`;
    //@ts-ignore

    this.map.get(S).style.top = `${window.innerHeight - 100}px`;
    //@ts-ignore

    this.map.get(D).style.top = `${window.innerHeight - 100}px`;
    //@ts-ignore

    this.map.get(SHIFT).style.top = `${window.innerHeight - 100}px`;
    //@ts-ignore

    //@ts-ignore

    this.map.get(W).style.left = `${300}px`;
    //@ts-ignore

    this.map.get(A).style.left = `${200}px`;
    //@ts-ignore

    this.map.get(S).style.left = `${300}px`;
    //@ts-ignore

    this.map.get(D).style.left = `${400}px`;
    //@ts-ignore

    this.map.get(SHIFT).style.left = `${50}px`;
  }

  public down(key: string) {
    if (this.map.get(key.toLowerCase())) {
      //@ts-ignore
      this.map.get(key.toLowerCase()).style.color = "red";
    }
  }

  public up(key: string) {
    if (this.map.get(key.toLowerCase())) {
      //@ts-ignore
      this.map.get(key.toLowerCase()).style.color = "blue";
    }
  }
}

const dir = new THREE.Vector3(1, 2, 0);

//normalize the direction vector (convert to vector of length 1)
dir.normalize();

const length = 1;
const hex = 0x000000;

export class CharacterControl {
  //state
  model: THREE.Group | undefined;
  orbitControlmodel: THREE.Group | undefined;
  mixer: THREE.AnimationMixer | undefined;
  animationsMap: Map<string, THREE.AnimationAction> | undefined;
  orbitControl: OrbitControls | undefined;
  camera: THREE.Camera | undefined;
  currentAction: string = "";
  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion: THREE.Quaternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();
  dir = new THREE.Vector3(1, 2, 0);
  origin = new THREE.Vector3(0, 0, 0);
  arrowHelper: THREE.ArrowHelper | undefined;

  // constants
  fadeDuration: number = 0.2;
  runVelocity = 5;
  walkVelocity = 2;

  constructor(
    model: THREE.Group,
    mixer: THREE.AnimationMixer,
    animationsMap: Map<string, THREE.AnimationAction>,
    orbitControl: OrbitControls,
    camera: THREE.Camera,
    currentAction: string,
    scene: THREE.Scene
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.animationsMap.forEach((value, key) => {
      if (key === currentAction) {
        value.play();
      }
    });
    this.arrowHelper = new THREE.ArrowHelper(
      this.dir,
      this.origin,
      length,
      hex
    );
    scene.add(this.arrowHelper);
  }

  public update(delta: number, keysPressed: any) {
    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true);
    const isRun = keysPressed?.shift;

    // const isRun = keysPressed
    var play = "";
    if (directionPressed && isRun) {
      play = "Run";
    } else if (directionPressed) {
      play = "Walk";
    } else {
      play = "Idle";
    }
    if (this.currentAction != play) {
      const toPlay = (
        this.animationsMap as Map<string, THREE.AnimationAction>
      ).get(play);
      const current = (
        this.animationsMap as Map<string, THREE.AnimationAction>
      ).get(this.currentAction);

      (current as THREE.AnimationAction).fadeOut(this.fadeDuration);
      (toPlay as THREE.AnimationAction)
        .reset()
        .fadeIn(this.fadeDuration)
        .play();

      this.currentAction = play;
    }

    (this.mixer as THREE.AnimationMixer).update(delta);

    if (this.currentAction == "Run" || this.currentAction == "Walk") {
      // calculate towards camera direction
      var angleYCameraDirection = Math.atan2(
        (this.camera as THREE.Camera).position.x -
          (this.model as THREE.Group).position.x,
        (this.camera as THREE.Camera).position.z -
          (this.model as THREE.Group).position.z
      );

      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // // rotate model
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        angleYCameraDirection + directionOffset
      );
      (this.model as THREE.Group).quaternion.rotateTowards(
        this.rotateQuarternion,
        0.2
      );

      // calculate direction
      (this.camera as THREE.Camera).getWorldDirection(this.walkDirection);

      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
      this.arrowHelper?.setDirection(this.walkDirection)

      // run/walk velocity
      const velocity =
        this.currentAction == "Run" ? this.runVelocity : this.walkVelocity;

      // // move model & camera
      const moveX = this.walkDirection.x * velocity * delta;
      const moveZ = this.walkDirection.z * velocity * delta;
      (this.model as THREE.Group).position.x += moveX;
      (this.model as THREE.Group).position.z += moveZ;
      this.updateCameraTarget(moveX, moveZ);
    }
  }

  private updateCameraTarget(moveX: number, moveZ: number) {
    // move camera
    (this.camera as THREE.Camera).position.x += moveX;
    (this.camera as THREE.Camera).position.z += moveZ;

    // update camera target
    this.cameraTarget.x = (this.model as THREE.Group).position.x;
    this.cameraTarget.y = (this.model as THREE.Group).position.y + 1;
    this.cameraTarget.z = (this.model as THREE.Group).position.z;
    (this.orbitControl as OrbitControls).target = this.cameraTarget;
  }

  private directionOffset(keysPressed: any) {
    var directionOffset = 0; // w

    if (keysPressed[W]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4; // w+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4; // w+d
      }
    } else if (keysPressed[S]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
      } else {
        directionOffset = Math.PI; // s
      }
    } else if (keysPressed[A]) {
      directionOffset = Math.PI / 2; // a
    } else if (keysPressed[D]) {
      directionOffset = -Math.PI / 2; // d
    }

    return directionOffset;
  }
}
