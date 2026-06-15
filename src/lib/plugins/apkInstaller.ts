import { registerPlugin } from "@capacitor/core";
import type { ApkInstallerPlugin } from "./apkInstaller.definitions";

export const ApkInstaller = registerPlugin<ApkInstallerPlugin>("ApkInstaller", {
  web: () => import("./apkInstaller.web").then((m) => new m.ApkInstallerWeb()),
});

export type { ApkInstallerPlugin } from "./apkInstaller.definitions";
