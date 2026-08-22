import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { priceId, origin: window.location.origin },
      });
      const url = (data as { url?: string } | null)?.url;
      if (error || !url) {
        throw new Error((data as { error?: string } | null)?.error || "Checkout unavailable");
      }
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
