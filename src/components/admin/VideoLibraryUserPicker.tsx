import { useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface VideoLibraryProfileOption {
  id: string;
  display_name: string | null;
}

interface VideoLibraryUserPickerProps {
  profiles: VideoLibraryProfileOption[];
  mode: "single" | "multiple";
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function VideoLibraryUserPicker({ profiles, mode, value, onChange }: VideoLibraryUserPickerProps) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return profiles;
    return profiles.filter(
      (p) =>
        (p.display_name || "").toLowerCase().includes(qq) ||
        p.id.toLowerCase().includes(qq),
    );
  }, [profiles, q]);

  const allIds = useMemo(() => profiles.map((p) => p.id), [profiles]);
  const allSelected =
    mode === "multiple" && allIds.length > 0 && allIds.every((id) => value.includes(id));

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("common.searchUser")}
        className="w-full bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
      />
      {mode === "multiple" && profiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange([...allIds])}
            disabled={allSelected}
            className="text-[9px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("admin.videoLibrary.selectAllUsers")}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className="text-[9px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("admin.videoLibrary.clearUserSelection")}
          </button>
        </div>
      )}
      <div className="max-h-52 overflow-y-auto rounded-lg border border-border/20 divide-y divide-border/10">
        {filtered.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">{t("common.noUserFound")}</p>
        ) : (
          filtered.map((p) => {
            const checked = value.includes(p.id);
            const label = p.display_name?.trim() || t("users.noName");
            return (
              <label
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20"
              >
                {mode === "single" ? (
                  <input
                    type="radio"
                    name="video-library-user-single"
                    checked={checked}
                    onChange={() => onChange([p.id])}
                    className="rounded-full border-border"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (value.includes(p.id)) onChange(value.filter((x) => x !== p.id));
                      else onChange([...value, p.id]);
                    }}
                    className="rounded border-border"
                  />
                )}
                <span className="text-sm truncate">{label}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
