import { useCallback, useEffect, useMemo, useState } from "react";
import type { VoiceAgentLiveOverlayHelpers } from "@/components/voice/VoiceAgent";
import {
  LogosPathChooserOverlay,
  type LogosPathDraft,
} from "@/pages/dev/logos/LogosPathChooserOverlay";
import {
  consumeLogosPath,
  favoriteLogosPath,
  pickOpeningLogosPaths,
  type LogosAvailablePath,
} from "./logosPathService";
import {
  buildGuidedLogosInjection,
  buildOpenLogosInjection,
  type LogosOpeningInjection,
} from "./logosSessionInjection";

type Options = {
  enabled: boolean;
  isFR: boolean;
  firstName: string;
  /** Auth user id — stamped into session dynamic vars for post-call webhook. */
  userId?: string;
};

/**
 * Shared opening-path chooser for Welcome + /dev/logos lab.
 * Titles/expiry/favorite come from `logos_list_available_paths`; covers stay local art.
 */
export function useLogosPathChooser({ enabled, isFR, firstName, userId }: Options) {
  const [openingPaths, setOpeningPaths] = useState<LogosAvailablePath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);

  const refreshOpeningPaths = useCallback(async () => {
    setPathsLoading(true);
    try {
      const picked = await pickOpeningLogosPaths();
      setOpeningPaths(picked);
    } catch (err) {
      console.error("useLogosPathChooser paths", err);
      setOpeningPaths([]);
    } finally {
      setPathsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPathsLoading(false);
      return;
    }
    setPathsLoading(true);
    void refreshOpeningPaths();
  }, [enabled, refreshOpeningPaths]);

  const chooserPaths: LogosPathDraft[] = useMemo(
    () =>
      openingPaths.map((p) => ({
        id: p.id,
        title: isFR ? p.titleFr : p.titleEn,
        daysUntilExpiry: p.daysUntilExpiry,
        isFavorited: p.isFavorited,
        category: p.category,
      })),
    [isFR, openingPaths],
  );

  const startGuided = useCallback(
    async (
      draft: LogosPathDraft,
      startWithChoice: (injection?: LogosOpeningInjection) => void,
    ) => {
      const full = openingPaths.find((p) => p.id === draft.id);
      if (!full) {
        startWithChoice(buildOpenLogosInjection(firstName || "toi", userId));
        return;
      }
      try {
        await consumeLogosPath(full.id);
      } catch (err) {
        console.error("useLogosPathChooser consume", err);
      }
      startWithChoice({
        ...buildGuidedLogosInjection(
          {
            id: full.id,
            titleFr: full.titleFr,
            openingPrompt: full.openingPrompt,
            firstMessage: full.firstMessage,
          },
          firstName || "toi",
          userId,
        ),
        feedbackContext: { promptId: full.id, category: full.category },
      });
      void refreshOpeningPaths();
    },
    [firstName, openingPaths, refreshOpeningPaths, userId],
  );

  const onFavoritePath = useCallback(
    async (draft: LogosPathDraft) => {
      try {
        await favoriteLogosPath(draft.id);
        await refreshOpeningPaths();
      } catch (err) {
        console.error("useLogosPathChooser favorite", err);
      }
    },
    [refreshOpeningPaths],
  );

  const canFavorite = !openingPaths.some((path) => path.id.includes(":"));

  const liveOverlay = useCallback(
    ({ startWithChoice }: VoiceAgentLiveOverlayHelpers) => (
      <LogosPathChooserOverlay
        isFR={isFR}
        paths={chooserPaths}
        loading={pathsLoading}
        onSelectPath={(path) => {
          void startGuided(path, startWithChoice);
        }}
        onOwnPath={() => {
          startWithChoice(buildOpenLogosInjection(firstName || "toi", userId));
        }}
        onFavoritePath={
          canFavorite
            ? (path) => {
                void onFavoritePath(path);
              }
            : undefined
        }
      />
    ),
    [
      canFavorite,
      chooserPaths,
      firstName,
      isFR,
      onFavoritePath,
      pathsLoading,
      startGuided,
      userId,
    ],
  );

  return {
    openingPaths,
    chooserPaths,
    pathsLoading,
    refreshOpeningPaths,
    liveOverlay,
  };
}
