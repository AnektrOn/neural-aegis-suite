import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ensurePushSubscription } from "@/lib/push";

/**
 * Réenregistre l'abonnement push à chaque ouverture de l'app lorsque la
 * permission est déjà accordée, pour éviter les abonnements silencieusement
 * perdus (nouveau service worker, changement de domaine, purge navigateur).
 */
export function usePushKeepAlive() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void ensurePushSubscription(user.id);
  }, [user]);
}
