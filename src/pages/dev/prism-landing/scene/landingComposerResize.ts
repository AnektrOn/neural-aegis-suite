/** Interface partagée entre le composer three et pmndrs (DPR adaptatif). */
export type LandingComposerResizeTarget = {
  setSize: (width: number, height: number) => void;
  setPixelRatio: (ratio: number) => void;
};
