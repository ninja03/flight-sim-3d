import * as THREE from 'three';

// Deterministic value-noise helpers used for both the terrain mesh and
// the collision height lookup, so they always agree.
function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x, z) {
  let val = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < 4; i++) {
    val += amp * smoothNoise(x * freq, z * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / norm;
}

// Ground height at world (x, z). Flattened near the origin for the runway.
export function terrainHeight(x, z) {
  const dist = Math.hypot(x, z);
  let h = (fbm(x * 0.004 + 100, z * 0.004 + 100) - 0.35) * 220;
  if (h < 0) h *= 0.4;
  const flat = Math.min(1, Math.max(0, (dist - 350) / 500));
  return h * flat;
}

// Build a low-poly terrain mesh colored by altitude.
export function createTerrain(size = 8000, segments = 220) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = [];
  const grass = new THREE.Color(0x2e6b34);
  const hill = new THREE.Color(0x6b8f3a);
  const rock = new THREE.Color(0x7a6a45);
  const snow = new THREE.Color(0xdfe6ea);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);

    if (h < 1) c.copy(grass);
    else if (h < 40) c.copy(grass).lerp(hill, h / 40);
    else if (h < 95) c.copy(hill).lerp(rock, (h - 40) / 55);
    else c.copy(rock).lerp(snow, Math.min(1, (h - 95) / 60));

    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
