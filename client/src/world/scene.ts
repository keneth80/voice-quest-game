import * as THREE from 'three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101a2b);
scene.fog = new THREE.Fog(0x101a2b, 28, 85);

export const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 200);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x2a3d2a, .8));
export const sun = new THREE.DirectionalLight(0xffe9c0, 1.1);
sun.position.set(12, 20, 8); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18; sun.shadow.camera.far = 60;
scene.add(sun); scene.add(sun.target);

export function mountRenderer() {
  document.body.appendChild(renderer.domElement);
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}
