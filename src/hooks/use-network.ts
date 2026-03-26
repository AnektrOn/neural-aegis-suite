import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";
import { isNative } from "@/lib/capacitor";

export function useNetwork(): { online: boolean } {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    if (!isNative) {
      const onOnline = () => setOnline(true);
      const onOffline = () => setOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    void Network.getStatus().then((status) => {
      setOnline(status.connected);
    });

    void Network.addListener("networkStatusChange", (status) => {
      setOnline(status.connected);
    });

    return () => {
      void Network.removeAllListeners();
    };
  }, []);

  return { online };
}
