import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import cinzelFontUrl from "../assets/fonts/Cinzel_SemiBold.json?url";

export type AegisText3D = {
  group: THREE.Group;
  transform: TransformControls | null;
  setPosition: (x: number, y: number, z: number) => void;
  /** 0 = masqué, 1 = pleine intensité (acte portail). */
  setReveal: (t: number) => void;
  dispose: () => void;
};

type CreateAegisText3DOptions = {
  scene: THREE.Scene;
  camera: THREE.Camera;
  domElement: HTMLElement;
  orbitControls: OrbitControls;
  initialPosition: THREE.Vector3;
  getGroundHeight: (x: number, z: number) => number;
  applyLightFalloff: (material: THREE.Material) => void;
  /** Désactive les gizmos TransformControls (landing publique). */
  enableTransform?: boolean;
};

function centerGeometry(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
}

export function createAegisText3D(options: CreateAegisText3DOptions): Promise<AegisText3D> {
  const {
    scene,
    camera,
    domElement,
    orbitControls,
    initialPosition,
    getGroundHeight,
    applyLightFalloff,
    enableTransform = true,
  } = options;

  return new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(
      cinzelFontUrl,
      (font) => {
        const group = new THREE.Group();
        group.name = "AegisText3D";

        const geometry = new TextGeometry("AEGIS", {
          font,
          size: 1.11,
          depth: 0.15,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.004,
          bevelSegments: 3,
        });
        centerGeometry(geometry);

        const baseEmissiveIntensity = 1.35;
        const letterMat = new THREE.MeshStandardMaterial({
          color: 0xfff0d4,
          emissive: 0xffb347,
          emissiveIntensity: 0,
          metalness: 0.42,
          roughness: 0.28,
          transparent: true,
          opacity: 0,
        });
        applyLightFalloff(letterMat);

        const letters = new THREE.Mesh(geometry, letterMat);
        letters.castShadow = true;
        letters.receiveShadow = true;
        group.add(letters);

        const coreLight = new THREE.PointLight(0xffc978, 2.8, 14, 1.6);
        group.add(coreLight);

        const fillLight = new THREE.PointLight(0xffe8c0, 1.1, 8, 2);
        group.add(fillLight);

        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0xffd080,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        group.add(halo);

        const reflection = new THREE.Mesh(
          new THREE.PlaneGeometry(2.8, 1.05),
          new THREE.MeshStandardMaterial({
            color: 0x2a1810,
            metalness: 0.72,
            roughness: 0.38,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          }),
        );
        applyLightFalloff(reflection.material as THREE.MeshStandardMaterial);
        reflection.rotation.x = -Math.PI / 2;
        reflection.receiveShadow = true;
        group.add(reflection);

        const syncGroundReflection = () => {
          const groundY = getGroundHeight(group.position.x, group.position.z);
          const lift = group.position.y - groundY;
          reflection.position.set(0, -lift + 0.02, 0);
          reflection.scale.setScalar(Math.max(0.65, Math.min(1.35, 1 - lift * 0.012)));
        };

        group.position.copy(initialPosition);
        syncGroundReflection();
        group.visible = false;

        const setReveal = (t: number) => {
          const clamped = THREE.MathUtils.clamp(t, 0, 1);
          letterMat.opacity = clamped;
          letterMat.emissiveIntensity = baseEmissiveIntensity * clamped;
          coreLight.intensity = 2.8 * clamped;
          fillLight.intensity = 1.1 * clamped;
          (halo.material as THREE.MeshBasicMaterial).opacity = 0.22 * clamped;
          group.visible = clamped > 0.02;
        };

        let transform: TransformControls | null = null;
        if (enableTransform) {
          transform = new TransformControls(camera, domElement);
          transform.attach(group);
          transform.setMode("translate");
          transform.setSize(0.85);
          scene.add(transform.getHelper());

          transform.addEventListener("dragging-changed", (event) => {
            orbitControls.enabled = !event.value;
          });
          transform.addEventListener("objectChange", () => {
            syncGroundReflection();
          });
        }

        scene.add(group);

        resolve({
          group,
          transform: transform as TransformControls,
          setReveal,
          setPosition(x, y, z) {
            group.position.set(x, y, z);
            syncGroundReflection();
          },
          dispose() {
            if (transform) {
              transform.detach();
              transform.dispose();
              scene.remove(transform.getHelper());
            }
            scene.remove(group);
            geometry.dispose();
            letterMat.dispose();
            reflection.geometry.dispose();
            (reflection.material as THREE.Material).dispose();
            halo.geometry.dispose();
            (halo.material as THREE.Material).dispose();
          },
        });
      },
      undefined,
      (err) => reject(err),
    );
  });
}
