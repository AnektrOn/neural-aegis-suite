import { useState, useEffect, useRef } from "react";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { motion } from "framer-motion";
import { User, Save, Camera, Loader2, ShieldCheck, Clock, Globe, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Account settings only — identity & AEGIS score live on /persona; app prefs on /settings */
export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) void loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, country, timezone, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("loadProfile", error);
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    if (!data) return;
    setDisplayName(data.display_name || "");
    setCountry(data.country || "");
    setTimezone((data as { timezone?: string | null }).timezone || "Europe/Paris");
    setAvatarUrl((data as { avatar_url?: string | null }).avatar_url || null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("toast.error"), description: "Image > 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: t("toast.error"), description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url } as any).eq("id", user.id);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast({ title: t("profile.profileUpdated"), description: t("profile.profileUpdatedDesc") });
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, country, timezone } as any)
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: t("toast.error"), description: t("profile.saveError"), variant: "destructive" });
    } else {
      toast({ title: t("profile.profileUpdated"), description: t("profile.profileUpdatedDesc") });
    }
  };

  const memberSinceFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const leftPane = (
    <div className="flex flex-col gap-5 h-full justify-between">
      {/* Header */}
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          {t("profile.accountLabel")} · IDENTITÉ SOUVERAINE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("profile.accountTitle")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
          {t("profile.accountSubtitle")}
        </p>
      </div>

      {/* Avatar & Sovereign Credentials Stage */}
      <div className="aegis-dock-tile p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col items-center text-center space-y-4">
        {/* Avatar with gold halo glow */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-24 h-24 rounded-3xl bg-black/40 border-2 border-[#c9a24b]/40 flex items-center justify-center overflow-hidden group-hover:border-[#c9a24b] transition-all shadow-[0_0_24px_rgba(201,162,75,0.2)] cursor-pointer disabled:opacity-50"
            aria-label={t("profile.changeAvatar")}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={36} strokeWidth={1.2} className="text-[#c9a24b]" />
            )}
            <span className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              {uploadingAvatar ? (
                <Loader2 size={20} className="animate-spin text-[#c9a24b]" />
              ) : (
                <Camera size={20} className="text-[#c9a24b]" />
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <h2 className="font-cinzel text-lg font-semibold text-foreground tracking-wide">
            {displayName || user?.email?.split("@")[0] || "Membre Souverain"}
          </h2>
          <p className="font-mono text-xs text-[#c9a24b] mt-0.5">{user?.email}</p>
        </div>

        {/* Credentials Pill Strip */}
        <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-xs">
          <div className="p-2.5 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center">
            <ShieldCheck size={14} className="text-[#c9a24b] mb-1" />
            <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">
              Accès Membre
            </span>
            <span className="font-mono text-[11px] text-foreground font-semibold mt-0.5">
              Bio-Exécutif
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center">
            <Clock size={14} className="text-emerald-400 mb-1" />
            <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">
              Membre depuis
            </span>
            <span className="font-mono text-[11px] text-foreground font-semibold mt-0.5">
              {memberSinceFormatted}
            </span>
          </div>
        </div>

        {/* Express Links to Persona & Settings */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <Link
            to="/persona"
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-black/20 text-xs font-cinzel uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#c9a24b]" />
              Empreinte Archétypale
            </span>
            <ArrowRight size={13} />
          </Link>
          <Link
            to="/settings"
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-black/20 text-xs font-cinzel uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all"
          >
            <span className="flex items-center gap-2">
              <Globe size={13} className="text-[#6ba4f8]" />
              Préférences Système
            </span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-4">
      <div className="aegis-dock-tile p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-[#c9a24b]" />
            <h2 className="font-cinzel text-[11px] font-semibold tracking-[0.16em] uppercase text-muted-foreground">
              Paramètres du Compte
            </h2>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            Données Personnelles
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
              {t("profile.displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#c9a24b]/50 transition-colors shadow-sm"
              placeholder={t("profile.yourName")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
              {t("profile.country")}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#c9a24b]/50 transition-colors shadow-sm"
              placeholder={t("profile.placeholderCountry")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground block">
              {t("profile.timezone")}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a24b]/50 transition-colors shadow-sm cursor-pointer"
            >
              {[
                "Europe/Paris",
                "Europe/London",
                "Europe/Berlin",
                "Europe/Madrid",
                "Europe/Rome",
                "Europe/Brussels",
                "Europe/Zurich",
                "Europe/Amsterdam",
                "America/New_York",
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "America/Toronto",
                "America/Montreal",
                "Asia/Tokyo",
                "Asia/Shanghai",
                "Asia/Dubai",
                "Africa/Casablanca",
                "Africa/Tunis",
                "Pacific/Noumea",
              ].map((tz) => (
                <option key={tz} value={tz} className="bg-[#161614] text-foreground">
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="btn-solaire w-full py-3 rounded-xl font-cinzel text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>{saving ? t("profile.savingProfile") : t("profile.saveProfile")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={5}
        rightColSpan={7}
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
