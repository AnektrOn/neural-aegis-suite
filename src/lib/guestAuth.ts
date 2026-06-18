import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface GuestSignupInput {
  email: string;
  firstName?: string;
  lastName?: string;
  instagram?: string;
  linkedin?: string;
}

function deriveGuestNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0]?.trim() || "Guest";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Guest";
  const lastName = parts[1]
    ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
    : "";
  return { firstName, lastName };
}

function buildTempPassword(): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return `${rand}Aa1!`;
}

/** Creates a guest account (email required) and returns an active session when possible. */
export async function signUpGuest(input: GuestSignupInput): Promise<Session> {
  const email = input.email.trim().toLowerCase();
  const derived = deriveGuestNameFromEmail(email);
  const firstName = input.firstName?.trim() || derived.firstName;
  const lastName = input.lastName?.trim() || derived.lastName;
  const instagram = input.instagram?.trim() || null;
  const linkedin = input.linkedin?.trim() || null;
  const displayName = `${firstName} ${lastName}`.trim();
  const tempPassword = buildTempPassword();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        instagram,
        linkedin,
        account_type: "guest",
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }
    throw error;
  }

  if (data.session) {
    await syncGuestProfile(data.user!.id, {
      firstName,
      lastName,
      displayName,
      instagram,
      linkedin,
    });
    return data.session;
  }

  // Email confirmation disabled: sign in with temp password
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: tempPassword,
  });
  if (signInError) throw signInError;
  if (!signInData.session) throw new Error("Guest session could not be established");

  await syncGuestProfile(signInData.user.id, {
    firstName,
    lastName,
    displayName,
    instagram,
    linkedin,
  });

  return signInData.session;
}

async function syncGuestProfile(
  userId: string,
  fields: {
    firstName: string;
    lastName: string;
    displayName: string;
    instagram: string | null;
    linkedin: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: fields.firstName,
      last_name: fields.lastName,
      display_name: fields.displayName,
      instagram: fields.instagram,
      linkedin: fields.linkedin,
      account_type: "guest",
    } as any)
    .eq("id", userId);

  if (error) console.warn("[guestAuth] profile sync failed", error.message);
}

/** Upgrades guest to full member by setting password and account_type. */
export async function upgradeGuestToMember(password: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: authError } = await supabase.auth.updateUser({
    password,
    data: { account_type: "member" },
  });
  if (authError) throw authError;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ account_type: "member" } as any)
    .eq("id", user.id);

  if (profileError) throw profileError;
}
