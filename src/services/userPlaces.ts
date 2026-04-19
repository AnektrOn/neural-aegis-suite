import { supabase } from "@/integrations/supabase/client";
import { parseLatLngFromGoogleMapsUrl, isLikelyGoogleMapsUrl } from "@/lib/parseGoogleMapsUrl";

export type UserPlaceRow = {
  id: string;
  user_id: string;
  name: string;
  maps_url: string;
  latitude: number | null;
  longitude: number | null;
  maps_parsed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type LocationConsentRow = {
  user_id: string;
  share_places_with_admin: boolean;
  hide_consent_modal: boolean;
  consent_version: string;
  responded_at: string | null;
  updated_at: string;
};

export async function fetchLocationConsent(userId: string): Promise<LocationConsentRow | null> {
  try {
    const { data, error } = await supabase
      .from("user_location_admin_consent")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("fetchLocationConsent:", error.message);
      return null;
    }
    return data as LocationConsentRow | null;
  } catch (e) {
    console.error("fetchLocationConsent:", e);
    return null;
  }
}

export async function upsertLocationConsent(params: {
  userId: string;
  sharePlacesWithAdmin: boolean;
  hideConsentModal: boolean;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_location_admin_consent").upsert(
      {
        user_id: params.userId,
        share_places_with_admin: params.sharePlacesWithAdmin,
        hide_consent_modal: params.hideConsentModal,
        consent_version: "1",
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("upsertLocationConsent:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("upsertLocationConsent:", e);
    return false;
  }
}

export async function fetchUserPlaces(userId: string): Promise<UserPlaceRow[]> {
  try {
    const { data, error } = await supabase
      .from("user_places")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetchUserPlaces:", error.message);
      return [];
    }
    return (data || []) as UserPlaceRow[];
  } catch (e) {
    console.error("fetchUserPlaces:", e);
    return [];
  }
}

export async function createUserPlace(params: {
  userId: string;
  name: string;
  mapsUrl: string;
  note?: string | null;
}): Promise<{ place: UserPlaceRow | null; error: string | null }> {
  const mapsUrl = params.mapsUrl.trim();
  if (!isLikelyGoogleMapsUrl(mapsUrl)) {
    return { place: null, error: "invalid_maps_url" };
  }
  const coords = parseLatLngFromGoogleMapsUrl(mapsUrl);
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from("user_places")
      .insert({
        user_id: params.userId,
        name: params.name.trim(),
        maps_url: mapsUrl,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        maps_parsed_at: coords ? now : null,
        note: params.note?.trim() || null,
      })
      .select("*")
      .single();
    if (error) {
      console.error("createUserPlace:", error.message);
      return { place: null, error: error.message };
    }
    return { place: data as UserPlaceRow, error: null };
  } catch (e) {
    console.error("createUserPlace:", e);
    return { place: null, error: "unknown" };
  }
}

export async function deleteUserPlace(placeId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_places").delete().eq("id", placeId).eq("user_id", userId);
    if (error) {
      console.error("deleteUserPlace:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("deleteUserPlace:", e);
    return false;
  }
}

export type PlaceContactLink = {
  id: string;
  user_id: string;
  user_place_id: string;
  contact_id: string;
  note: string | null;
  created_at: string;
};

export async function fetchPlaceContactLinks(userId: string, placeId: string): Promise<PlaceContactLink[]> {
  try {
    const { data, error } = await supabase
      .from("user_place_contact_links")
      .select("*")
      .eq("user_id", userId)
      .eq("user_place_id", placeId);
    if (error) {
      console.error("fetchPlaceContactLinks:", error.message);
      return [];
    }
    return (data || []) as PlaceContactLink[];
  } catch (e) {
    console.error("fetchPlaceContactLinks:", e);
    return [];
  }
}

export async function setPlaceContactLinks(
  userId: string,
  placeId: string,
  contactIds: string[]
): Promise<boolean> {
  try {
    const { error: delErr } = await supabase
      .from("user_place_contact_links")
      .delete()
      .eq("user_place_id", placeId)
      .eq("user_id", userId);
    if (delErr) {
      console.error("setPlaceContactLinks delete:", delErr.message);
      return false;
    }
    if (contactIds.length === 0) return true;
    const rows = contactIds.map((contact_id) => ({
      user_id: userId,
      user_place_id: placeId,
      contact_id,
    }));
    const { error: insErr } = await supabase.from("user_place_contact_links").insert(rows);
    if (insErr) {
      console.error("setPlaceContactLinks insert:", insErr.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("setPlaceContactLinks:", e);
    return false;
  }
}
