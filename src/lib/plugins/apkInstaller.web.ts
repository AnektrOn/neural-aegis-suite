import { WebPlugin } from "@capacitor/core";
import type { ApkInstallerPlugin } from "./apkInstaller.definitions";

export class ApkInstallerWeb extends WebPlugin implements ApkInstallerPlugin {
  async downloadAndInstall(options: { url: string }): Promise<{ started: boolean }> {
    window.open(options.url, "_blank", "noopener,noreferrer");
    return { started: true };
  }
}
