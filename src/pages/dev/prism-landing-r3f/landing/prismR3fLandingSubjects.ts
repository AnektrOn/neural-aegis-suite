export type PrismLandingSubjectVisibility = {
  cube: boolean;
  marble: boolean;
  slit: boolean;
};

/** Cube / marbre / fente mesh — PointLight fente reste montée pour godrays. */
export function subjectVisibilityForBeat(beatIndex: number): PrismLandingSubjectVisibility {
  switch (beatIndex) {
    case 0:
      return { cube: true, marble: false, slit: true };
    case 1:
      return { cube: true, marble: false, slit: false };
    case 2:
      return { cube: false, marble: true, slit: false };
    case 3:
      return { cube: false, marble: true, slit: true };
    case 4:
    case 5:
      return { cube: false, marble: false, slit: true };
    default:
      return { cube: true, marble: true, slit: true };
  }
}
