import { useEffect } from "react";
import { SheetProvider, useCurrentSheet } from "@theatre/r3f";
import { PerspectiveCamera } from "@theatre/r3f";
import {
  PORTAL_CENTER_X,
  PORTAL_WORLD_Z,
} from "@/pages/dev/prism-landing/layout/prismSceneConstants";
import {
  LANDING_R3F_CAMERA_SEQUENCE_LENGTH,
  landingR3fCameraSheet,
  landingR3fTheatreProject,
} from "../cinematic/landingR3fTheatre";
import { LandingR3fPostPipeline } from "./LandingR3fPostPipeline";

const LOOK_AT: [number, number, number] = [26.558, 3.362, 12.656];

function LandingR3fTheatrePlayback() {
  const sheet = useCurrentSheet();

  useEffect(() => {
    let cancelled = false;
    void landingR3fTheatreProject.ready.then(() => {
      if (cancelled) return;
      sheet.sequence.play({
        iterationCount: Infinity,
        range: [0, LANDING_R3F_CAMERA_SEQUENCE_LENGTH],
        rate: 1,
      });
    });
    return () => {
      cancelled = true;
      sheet.sequence.pause();
    };
  }, [sheet]);

  return null;
}

function ProceduralWastelandMvp() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[220, 220, 1, 1]} />
        <meshStandardMaterial color="#1a1410" roughness={0.92} metalness={0.04} />
      </mesh>

      {/* Occluder type monolithe (godrays) */}
      <mesh
        position={[PORTAL_CENTER_X - 6, 8, PORTAL_WORLD_Z - 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[5, 16, 4]} />
        <meshStandardMaterial color="#2a2520" roughness={0.85} metalness={0.08} />
      </mesh>

      {/* Pilier portail simplifié */}
      <mesh position={[PORTAL_CENTER_X + 3.5, 6, PORTAL_WORLD_Z]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 12, 2.2]} />
        <meshStandardMaterial color="#1f1c18" roughness={0.9} />
      </mesh>

      <mesh position={[PORTAL_CENTER_X - 3.5, 6, PORTAL_WORLD_Z]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 12, 2.2]} />
        <meshStandardMaterial color="#1f1c18" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function LandingR3fSceneContent() {
  return (
    <SheetProvider sheet={landingR3fCameraSheet}>
      <color attach="background" args={["#050406"]} />
      <fog attach="fog" args={["#0a0808", 35, 140]} />

      <ambientLight intensity={0.12} />
      <hemisphereLight color="#8a9ab8" groundColor="#1a1008" intensity={0.35} />

      <PerspectiveCamera
        theatreKey="Camera"
        makeDefault
        position={[49.064, 10.9, 57.797]}
        fov={52}
        near={0.4}
        far={320}
        lookAt={LOOK_AT}
      />

      <LandingR3fTheatrePlayback />
      <ProceduralWastelandMvp />
      <LandingR3fPostPipeline />
    </SheetProvider>
  );
}
