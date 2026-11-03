import { R3F_GODRAYS_HALL_FOG } from "../scene/godraysHall/r3fGodraysHallConstants";

const [BASE_FOG_COLOR, BASE_FOG_NEAR, BASE_FOG_FAR] = R3F_GODRAYS_HALL_FOG;

/** Profil d’ambiance « hold » par chapitre — variations légères autour du fog lab. */
export type PrismLandingAtmosphereHold = {
  fogColor: string;
  fogNear: number;
  fogFar: number;
  environmentIntensity: number;
  travelFogNear: number;
  travelFogFar: number;
};

const HOLDS: PrismLandingAtmosphereHold[] = [
  {
    fogColor: BASE_FOG_COLOR,
    fogNear: BASE_FOG_NEAR,
    fogFar: BASE_FOG_FAR,
    environmentIntensity: 0.14,
    travelFogNear: 28,
    travelFogFar: 120,
  },
  {
    fogColor: "#0b0706",
    fogNear: 32,
    fogFar: 150,
    environmentIntensity: 0.15,
    travelFogNear: 26,
    travelFogFar: 110,
  },
  {
    fogColor: "#0a0605",
    fogNear: 38,
    fogFar: 168,
    environmentIntensity: 0.12,
    travelFogNear: 30,
    travelFogFar: 125,
  },
  {
    fogColor: "#120805",
    fogNear: 30,
    fogFar: 130,
    environmentIntensity: 0.13,
    travelFogNear: 24,
    travelFogFar: 95,
  },
  {
    fogColor: "#0f0705",
    fogNear: 34,
    fogFar: 155,
    environmentIntensity: 0.13,
    travelFogNear: 28,
    travelFogFar: 105,
  },
  {
    fogColor: "#0a0806",
    fogNear: 40,
    fogFar: 175,
    environmentIntensity: 0.15,
    travelFogNear: 32,
    travelFogFar: 130,
  },
];

export function getPrismLandingAtmosphereHold(beatIndex: number): PrismLandingAtmosphereHold {
  return HOLDS[beatIndex] ?? HOLDS[0];
}
