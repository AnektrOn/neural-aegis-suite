import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Save, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-neural-label mb-3">{t("profile.accountLabel")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("profile.accountTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("profile.accountSubtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-8 space-y-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden group hover:border-primary/40 transition-colors disabled:opacity-50"
            aria-label={t("profile.changeAvatar")}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} strokeWidth={1.5} className="text-primary" />
            )}
            <span className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Camera size={16} className="text-primary" />
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
          <div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-neural-label mt-1">
              {t("profile.memberSince", {
                date: user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-neural-label block mb-2">{t("profile.displayName")}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder={t("profile.yourName")}
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("profile.country")}</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder={t("profile.placeholderCountry")}
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("profile.timezone")}</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
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
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} className="btn-neural w-full">
          <Save size={14} />
          {saving ? t("profile.savingProfile") : t("profile.saveProfile")}
        </button>
      </motion.div>
    </div>
  );
}
