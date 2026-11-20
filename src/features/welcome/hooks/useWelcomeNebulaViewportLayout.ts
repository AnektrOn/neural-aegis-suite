import { useEffect, useState } from "react";
import {
  getWelcomeNebulaWorldLayout,
  readWelcomeNebulaViewport,
  type WelcomeNebulaWorldAnchor,
} from "@/features/welcome/welcomeNebulaWordLayout";

export function useWelcomeNebulaViewportLayout(): {
  right: WelcomeNebulaWorldAnchor;
  left: WelcomeNebulaWorldAnchor;
  center: WelcomeNebulaWorldAnchor;
} {
  const [layout, setLayout] = useState(() =>
    getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()),
  );

  useEffect(() => {
    const update = () => {
      setLayout(getWelcomeNebulaWorldLayout(readWelcomeNebulaViewport()));
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return layout;
}