import * as THREE from 'three';
import { createTerrain, terrainHeight } from './terrain.js';

// Assembles the whole environment and returns the ring gates for scoring.
export function createWorld(scene, opts = {}) {
  const shadows = opts.shadows !== false;
  const terrainSegments = opts.terrainSegments ?? 220;
  const shadowMapSize = opts.shadowMapSize ?? 2048;
  const detail = opts.detail ?? 1;

  scene.background = new THREE.Color(0x87b5e0);
  scene.fog = new THREE.Fog(0x9fc0e0, 900, 4200);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x40502f, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
  sun.position.set(600, 900, 400);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  const d = 1000;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 3000;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  // Terrain
  scene.add(createTerrain(8000, terrainSegments));

  // Static scenery
  scene.add(createRunway());
  scene.add(createCity(detail));
  scene.add(createTrees(detail));
  scene.add(createClouds(detail));

  // Ring gates (fly through to score)
  const rings = createRings();
  rings.forEach((r) => scene.add(r.mesh));

  return { rings, sun };
}

function createRunway() {
  const g = new THREE.Group();
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 700),
    new THREE.MeshStandardMaterial({ color: 0x33333a, roughness: 1 })
  );
  strip.rotateX(-Math.PI / 2);
  strip.position.set(0, 0.15, -120);
  strip.receiveShadow = true;
  g.add(strip);

  const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (let i = 0; i < 22; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 14), dashMat);
    dash.rotateX(-Math.PI / 2);
    dash.position.set(0, 0.2, -460 + i * 30);
    g.add(dash);
  }
  return g;
}

function createCity(detail = 1) {
  const g = new THREE.Group();
  const palette = [0x8899aa, 0x99aabb, 0x7788a0, 0xb0b8c0, 0x667788];
  for (let i = 0; i < Math.round(70 * detail); i++) {
    const x = THREE.MathUtils.randFloatSpread(520);
    const z = THREE.MathUtils.randFloatSpread(520);
    if (Math.abs(x) < 45 && Math.abs(z) < 380) continue; // keep runway clear
    const w = THREE.MathUtils.randFloat(12, 30);
    const dep = THREE.MathUtils.randFloat(12, 30);
    const h = THREE.MathUtils.randFloat(20, 120);
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, dep),
      new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.85 })
    );
    const gy = terrainHeight(x, z);
    b.position.set(x, gy + h / 2, z);
    b.castShadow = true;
    b.receiveShadow = true;
    g.add(b);
  }
  return g;
}

function createTrees(detail = 1) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32 });
  for (let i = 0; i < Math.round(220 * detail); i++) {
    const x = THREE.MathUtils.randFloatSpread(3200);
    const z = THREE.MathUtils.randFloatSpread(3200);
    const h = terrainHeight(x, z);
    if (h < 2 || h > 80) continue; // only on green hills
    const s = THREE.MathUtils.randFloat(0.8, 2.2);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 4 * s, 6), trunkMat);
    trunk.position.set(x, h + 2 * s, z);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(3 * s, 8 * s, 7), leafMat);
    leaf.position.set(x, h + 8 * s, z);
    trunk.castShadow = true;
    leaf.castShadow = true;
    g.add(trunk, leaf);
  }
  return g;
}

function createClouds(detail = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    roughness: 1,
  });
  for (let i = 0; i < Math.round(45 * detail); i++) {
    const cloud = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 4);
    for (let j = 0; j < n; j++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(THREE.MathUtils.randFloat(20, 50), 8, 6),
        mat
      );
      puff.position.set(
        THREE.MathUtils.randFloatSpread(90),
        THREE.MathUtils.randFloatSpread(22),
        THREE.MathUtils.randFloatSpread(90)
      );
      cloud.add(puff);
    }
    cloud.position.set(
      THREE.MathUtils.randFloatSpread(6000),
      THREE.MathUtils.randFloat(420, 900),
      THREE.MathUtils.randFloatSpread(6000)
    );
    g.add(cloud);
  }
  return g;
}

function createRings() {
  const points = [
    new THREE.Vector3(0, 70, -750),
    new THREE.Vector3(450, 100, -1150),
    new THREE.Vector3(950, 130, -900),
    new THREE.Vector3(1250, 160, -300),
    new THREE.Vector3(950, 130, 450),
    new THREE.Vector3(300, 100, 650),
    new THREE.Vector3(-450, 85, 350),
    new THREE.Vector3(-550, 75, -450),
  ];
  const radius = 48;
  const rings = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = points[(i + 1) % points.length];
    const geo = new THREE.TorusGeometry(radius, 4, 16, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0x552200,
      roughness: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p);
    mesh.lookAt(next); // torus hole axis (+Z) points along the course
    rings.push({ mesh, position: p.clone(), radius, passed: false, index: i });
  }
  return rings;
}
