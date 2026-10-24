import { getProject, type __UNSTABLE_Project_OnDiskState } from "@theatre/core";
import cameraState from "./landingR3fCamera.state.json";

export const LANDING_R3F_THEATRE_PROJECT_ID = "Prism Landing R3F MVP";
export const LANDING_R3F_CAMERA_SHEET_ID = "Landing Camera";
export const LANDING_R3F_CAMERA_SEQUENCE_LENGTH = 8;

const theatreState = cameraState as __UNSTABLE_Project_OnDiskState;

export const landingR3fTheatreProject = getProject(LANDING_R3F_THEATRE_PROJECT_ID, {
  state: theatreState,
});

export const landingR3fCameraSheet = landingR3fTheatreProject.sheet(LANDING_R3F_CAMERA_SHEET_ID);
