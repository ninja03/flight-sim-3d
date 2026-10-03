import * as THREE from 'three';
import { createWorld } from './world.js';
import { Aircraft } from './aircraft.js';
import { Input } from './input.js';
import { ChaseCamera } from './camera.js';
import { HUD } from './hud.js';
import { TouchControls } from './touch.js';

// Detect touch devices (phones/tablets) to enable on-screen controls + lower detail.
const isTouch =
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0;

// --- renderer / scene / camera ---
const canvas = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
renderer.shadowMap.enabled = !isTouch;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  6000
);

// --- game objects ---
const world = createWorld(
  scene,
  isTouch
    ? { shadows: false, terrainSegments: 120, shadowMapSize: 1024, detail: 0.5 }
    : {}
);
const aircraft = new Aircraft(scene);
const input = new Input();
const cam = new ChaseCamera(camera);
const hud = new HUD();

let score = 0;
const total = world.rings.length;

// --- camera toggle / reset (shared by keyboard + touch) ---
function toggleCamera() {
  const modes = ['chase', 'cockpit'];
  cam.mode = modes[(modes.indexOf(cam.mode) + 1) % modes.length];
  cam.initialized = false;
  hud.setMode(cam.mode.toUpperCase());
}

function doReset() {
  aircraft.reset();
  cam.initialized = false;
  score = 0;
  world.rings.forEach((r) => {
    r.passed = false;
    r.mesh.material.color.setHex(0xff8800);
    r.mesh.material.emissive.setHex(0x552200);
  });
  hud.clearMessage();
  hud.showMessage('リセットしました', 1500);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') toggleCamera();
  if (e.code === 'KeyR') doReset();
});

// --- on-screen touch controls (phones/tablets) ---
if (isTouch) {
  new TouchControls(input, { onCamera: toggleCamera, onReset: doReset });
}

// --- ring gate scoring ---
function checkRings() {
  for (const r of world.rings) {
    if (r.passed) continue;
    if (aircraft.position.distanceTo(r.position) < r.radius) {
      r.passed = true;
      score++;
      r.mesh.material.color.setHex(0x22cc55);
      r.mesh.material.emissive.setHex(0x0a4a1a);
      if (score === total) {
        hud.showMessage('全ゲートクリア！おめでとう 🎉', 6000);
      } else {
        hud.showMessage(`ゲート通過！ (${score}/${total})`, 1200);
      }
    }
  }
}

// --- main loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  let dt = clock.getDelta();
  dt = Math.min(dt, 0.05); // clamp to avoid physics blow-ups on tab switch

  aircraft.update(dt, input);

  // vertical speed readout
  if (dt > 0) {
    aircraft._vs = (aircraft.position.y - aircraft._lastY) / dt;
    aircraft._lastY = aircraft.position.y;
  }

  // spin the propeller with throttle
  aircraft.prop.rotation.z += (2 + aircraft.throttle * 40) * dt * 10;

  checkRings();

  if (aircraft.crashed) {
    hud.showMessage('墜落！ R キーでリセット', 999999);
  }

  cam.update(aircraft, dt);
  hud.update(aircraft, score, total);

  renderer.render(scene, camera);
}
animate();

// --- resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
