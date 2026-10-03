import * as THREE from 'three';
import { terrainHeight } from './terrain.js';

// Arcade flight model. Orientation is stored as Euler angles (YXZ order):
//   heading = yaw about world Y, pitch = nose up/down, roll = bank angle.
// The aircraft travels along its nose; bank drives coordinated turns.
export class Aircraft {
  constructor(scene) {
    this.group = new THREE.Group();
    this.buildModel();
    scene.add(this.group);

    // --- start state (airborne) ---
    this.startAltitude = 300; // meters above the flat terrain near origin
    this.startSpeed = 60; // m/s cruise so it doesn't stall on spawn
    this.startThrottle = 0.5;

    // --- state ---
    const gy = terrainHeight(0, 260);
    this.position = new THREE.Vector3(0, gy + this.startAltitude, 260);
    this.heading = 0; // facing -Z, straight down the runway
    this.pitch = 0;
    this.roll = 0;
    this.speed = this.startSpeed;
    this.throttle = this.startThrottle;
    this.altitude = this.startAltitude;
    this.crashed = false;

    // --- tuning ---
    this.maxThrust = 32; // m/s^2 at full throttle
    this.dragCoef = 0.0016;
    this.g = 9.81;
    this.stallSpeed = 24;
    this.maxSpeed = 120;
    this.pitchRate = 0.9; // rad/s
    this.rollRate = 1.9; // rad/s
    this.yawRate = 0.5; // rudder rad/s

    // --- scratch ---
    this.forward = new THREE.Vector3(0, 0, -1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.right = new THREE.Vector3(1, 0, 0);
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._q = new THREE.Quaternion();
    this._lastY = this.position.y;
    this._vs = 0;

    this.updateOrientation();
  }

  buildModel() {
    const body = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6, metalness: 0.2 });
    const red = new THREE.MeshStandardMaterial({ color: 0xd23b3b, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.5, metalness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.7 });

    // Fuselage (nose toward -Z)
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 12, 16), white);
    fus.rotateX(Math.PI / 2);
    body.add(fus);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 16), red);
    nose.rotateX(-Math.PI / 2);
    nose.position.z = -7.5;
    body.add(nose);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), glass);
    canopy.scale.set(1, 0.9, 1.6);
    canopy.position.set(0, 0.9, -2);
    body.add(canopy);

    // Main wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 3), white);
    wing.position.set(0, 0, -0.5);
    body.add(wing);
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 3), red);
    tipL.position.set(-8, 0, -0.5);
    body.add(tipL);
    const tipR = tipL.clone();
    tipR.position.x = 8;
    body.add(tipR);

    // Tail
    const tailWing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 2), white);
    tailWing.position.set(0, 0, 5.5);
    body.add(tailWing);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 2.5), red);
    fin.position.set(0, 1.5, 5.5);
    body.add(fin);

    // Propeller
    this.prop = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.2), dark);
    this.prop.add(b1);
    const b2 = b1.clone();
    b2.rotation.z = Math.PI / 2;
    this.prop.add(b2);
    this.prop.position.set(0, 0, -9);
    body.add(this.prop);

    body.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });

    // Lift the model so its wheels rest on the group origin (ground level).
    body.position.y = 1.5;

    this.model = body;
    this.group.add(body);
  }

  updateOrientation() {
    this._euler.set(this.pitch, this.heading, this.roll, 'YXZ');
    this._q.setFromEuler(this._euler);
    this.group.quaternion.copy(this._q);
    this.group.position.copy(this.position);

    this.forward.set(0, 0, -1).applyQuaternion(this._q);
    this.up.set(0, 1, 0).applyQuaternion(this._q);
    this.right.set(1, 0, 0).applyQuaternion(this._q);
  }

  update(dt, input) {
    if (this.crashed) return;

    const groundY = terrainHeight(this.position.x, this.position.z);
    const onGround = this.position.y <= groundY + 0.05;

    // Throttle
    if (input.throttleUp) this.throttle = Math.min(1, this.throttle + dt * 0.5);
    if (input.throttleDown) this.throttle = Math.max(0, this.throttle - dt * 0.5);

    // Roll (bank) — only while airborne.
    let rollInput = 0;
    if (input.rollLeft) rollInput += 1;
    if (input.rollRight) rollInput -= 1;
    if (onGround) {
      this.roll = 0;
    } else {
      this.roll += rollInput * this.rollRate * dt;
      if (rollInput === 0) {
        const level = Math.sign(this.roll) * Math.min(Math.abs(this.roll), dt * 0.6);
        this.roll -= level; // auto-level
      }
    }
    this.roll = THREE.MathUtils.clamp(this.roll, -Math.PI * 0.45, Math.PI * 0.45);

    // Pitch
    let pitchInput = 0;
    if (input.pitchUp) pitchInput += 1;
    if (input.pitchDown) pitchInput -= 1;
    this.pitch += pitchInput * this.pitchRate * dt;
    if (onGround) {
      // On the runway only nose-up rotation is allowed (for takeoff).
      this.pitch = Math.max(0, this.pitch);
    } else {
      if (pitchInput === 0) {
        const trim = Math.sign(this.pitch) * Math.min(Math.abs(this.pitch), dt * 0.4);
        this.pitch -= trim; // gentle auto-level toward the horizon
      }
      // Below stall the nose drops, giving a natural recovery.
      if (this.speed < this.stallSpeed) {
        this.pitch -= dt * 0.6 * (1 - this.speed / this.stallSpeed);
      }
    }
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI * 0.32, Math.PI * 0.32);

    // Rudder yaw
    let yawInput = 0;
    if (input.yawLeft) yawInput += 1;
    if (input.yawRight) yawInput -= 1;
    this.heading += yawInput * this.yawRate * dt;

    // Coordinated turn: bank angle curves the flight path (airborne only).
    if (!onGround && this.speed > 1) {
      const turnRate = (this.g * Math.tan(this.roll)) / this.speed;
      this.heading += turnRate * dt;
    }

    // Refresh orientation so forward reflects this frame's angles.
    this.updateOrientation();

    // Speed: thrust - drag - gravity-along-path (gravity only in the air).
    const thrust = this.throttle * this.maxThrust;
    const drag = this.dragCoef * this.speed * this.speed;
    const gravityAlongPath = onGround ? 0 : -this.g * this.forward.y;
    let accel = thrust - drag + gravityAlongPath;
    if (onGround) accel -= this.speed * 0.12; // rolling friction on the runway
    if (input.brake) accel -= 20;
    this.speed = Math.max(0, Math.min(this.maxSpeed, this.speed + accel * dt));

    // Move along the nose; stall sink applies only while airborne.
    const velocity = this.forward.clone().multiplyScalar(this.speed);
    if (!onGround && this.speed < this.stallSpeed) {
      velocity.y -= (this.stallSpeed - this.speed) * 0.6;
    }
    this.position.addScaledVector(velocity, dt);

    // Ground contact / crash detection.
    // `onGround` is the state at the START of this frame, so a crash only
    // fires when the aircraft crosses into the ground from the air.
    const newGroundY = terrainHeight(this.position.x, this.position.z);
    this.altitude = this.position.y - newGroundY;
    if (this.altitude <= 0) {
      const tooFast = this.speed > 80;
      const badAttitude = this.pitch < -0.9 || Math.abs(this.roll) > 1.2;
      if (!onGround && (tooFast || badAttitude)) {
        this.crashed = true;
      } else {
        this.position.y = newGroundY; // sit on the runway
      }
    }
  }

  reset() {
    const gy = terrainHeight(0, 260);
    this.position.set(0, gy + this.startAltitude, 260);
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
    this.speed = this.startSpeed;
    this.throttle = this.startThrottle;
    this.altitude = this.startAltitude;
    this.crashed = false;
    this._lastY = this.position.y;
    this._vs = 0;
    this.updateOrientation();
  }
}
