import type { PluginListenerHandle } from "@capacitor/core";

export interface ApkInstallerPlugin {
  downloadAndInstall(options: { url: string }): Promise<{ started: boolean }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (event: { progress: number }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "downloadComplete",
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "downloadError",
    listenerFunc: (event: { message: string }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: "installIntentOpened",
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
}
