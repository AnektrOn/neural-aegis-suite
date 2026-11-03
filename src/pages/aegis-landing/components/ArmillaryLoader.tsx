import { ArmillarySphereCanvas } from "../armillary/ArmillarySphereCanvas";
import { LOADER_CAM, LOADER_CAM_SPEED } from "../armillary/armillaryConstants";

export function ArmillaryLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3EEEC]">
      <div className="relative h-[min(52vh,420px)] w-full max-w-[520px]">
        <ArmillarySphereCanvas
          className="pointer-events-none absolute inset-0"
          interactive={false}
          autoCamera
          autoCameraSpeed={LOADER_CAM_SPEED}
          initialAzimuth={LOADER_CAM.az}
          initialPolar={LOADER_CAM.pol}
          initialDistance={LOADER_CAM.dist}
          initialTarget={LOADER_CAM.target}
        />
      </div>
      <p className="font-cinzel text-lg tracking-[0.28em] text-[#121212]/70">AEGIS</p>
    </div>
  );
}
