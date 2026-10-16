import type { ReactNode } from "react";
import type { LandingStageLayout } from "../landingStageLayout";

type ItemTransform = LandingStageLayout["items"]["shield"];

function StageTransformGroup({
  transform,
  children,
}: {
  transform: ItemTransform;
  children: ReactNode;
}) {
  return (
    <group
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      <group visible={transform.visible}>{children}</group>
    </group>
  );
}

export type LandingStageRigSlots = {
  shield: ReactNode;
  ring: ReactNode;
  aegis: ReactNode;
};

export function LandingStageRig({
  layout,
  slots,
}: {
  layout: LandingStageLayout;
  slots: LandingStageRigSlots;
}) {
  const { link, cluster, items } = layout;

  const shieldNode = (
    <StageTransformGroup transform={items.shield}>{slots.shield}</StageTransformGroup>
  );
  const ringNode = (
    <StageTransformGroup transform={items.ring}>{slots.ring}</StageTransformGroup>
  );
  const aegisNode = (
    <StageTransformGroup transform={items.aegis}>{slots.aegis}</StageTransformGroup>
  );

  const clusterWrap = (child: ReactNode) => (
    <group
      position={cluster.position}
      rotation={cluster.rotation}
      scale={cluster.scale}
    >
      {child}
    </group>
  );

  switch (link) {
    case "independent":
      return (
        <>
          {ringNode}
          {shieldNode}
          {aegisNode}
        </>
      );
    case "all":
      return clusterWrap(
        <>
          {ringNode}
          {shieldNode}
          {aegisNode}
        </>,
      );
    case "shield-ring":
      return (
        <>
          {aegisNode}
          <group
            position={items.ring.position}
            rotation={items.ring.rotation}
            scale={items.ring.scale}
          >
            <group visible={items.ring.visible}>{slots.ring}</group>
            <group
              position={items.shield.position}
              rotation={items.shield.rotation}
              scale={items.shield.scale}
            >
              <group visible={items.shield.visible}>{slots.shield}</group>
            </group>
          </group>
        </>
      );
    case "shield-aegis":
      return (
        <>
          {ringNode}
          <group
            position={items.aegis.position}
            rotation={items.aegis.rotation}
            scale={items.aegis.scale}
          >
            <group visible={items.aegis.visible}>{slots.aegis}</group>
            <group
              position={items.shield.position}
              rotation={items.shield.rotation}
              scale={items.shield.scale}
            >
              <group visible={items.shield.visible}>{slots.shield}</group>
            </group>
          </group>
        </>
      );
    case "ring-aegis":
      return (
        <>
          {shieldNode}
          <group
            position={items.aegis.position}
            rotation={items.aegis.rotation}
            scale={items.aegis.scale}
          >
            <group visible={items.aegis.visible}>{slots.aegis}</group>
            <group
              position={items.ring.position}
              rotation={items.ring.rotation}
              scale={items.ring.scale}
            >
              <group visible={items.ring.visible}>{slots.ring}</group>
            </group>
          </group>
        </>
      );
    default:
      return (
        <>
          {ringNode}
          {shieldNode}
          {aegisNode}
        </>
      );
  }
}
