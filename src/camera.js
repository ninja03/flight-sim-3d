import * as THREE from 'three';

// Chase / cockpit camera that follows the aircraft.
export class ChaseCamera {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'chase'; // 'chase' | 'cockpit'
    this.smoothPos = new THREE.Vector3();
    this.initialized = false;
    this._offset = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._eye = new THREE.Vector3();
  }

  update(aircraft, dt) {
    const q = aircraft.group.quaternion;
    const pos = aircraft.position;

    if (this.mode === 'cockpit') {
      this._eye.set(0, 2.4, -1).applyQuaternion(q).add(pos);
      this.camera.position.copy(this._eye);
      this._look.set(0, 2.0, -30).applyQuaternion(q).add(pos);
      this.camera.up.copy(aircraft.up);
      this.camera.lookAt(this._look);
      return;
    }

    // Chase view: behind and slightly above, smoothed.
    this._offset.set(0, 4, 22).applyQuaternion(q).add(pos);
    if (!this.initialized) {
      this.smoothPos.copy(this._offset);
      this.initialized = true;
    }
    this.smoothPos.lerp(this._offset, Math.min(1, dt * 4));
    this.camera.position.copy(this.smoothPos);
    this.camera.up.set(0, 1, 0);
    this._look.set(0, 1, -12).applyQuaternion(q).add(pos);
    this.camera.lookAt(this._look);
  }
}
