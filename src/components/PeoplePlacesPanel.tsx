import { useEffect, useState } from "react";
import { MapPin, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationSharingConsentDialog } from "@/components/LocationSharingConsentDialog";
import {
  createUserPlace,
  deleteUserPlace,
  fetchLocationConsent,
  fetchUserPlaces,
  setPlaceContactLinks,
  upsertLocationConsent,
  type UserPlaceRow,
} from "@/services/userPlaces";

type ContactOption = { id: string; name: string };

export function PeoplePlacesPanel({ contacts }: { contacts: ContactOption[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [places, setPlaces] = useState<UserPlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  /** Réponse enregistrée (oui/non) — requis avant d’ajouter un lieu */
  const [consentResolved, setConsentResolved] = useState(false);
  const [name, setName] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [note, setNote] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const consent = await fetchLocationConsent(user.id);
    const resolved = !!consent?.responded_at;
    setConsentResolved(resolved);
    if (!resolved) {
      setConsentOpen(true);
    }
    const list = await fetchUserPlaces(user.id);
    setPlaces(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const onConsentDecision = async ({ accept, hideModal }: { accept: boolean; hideModal: boolean }) => {
    if (!user) return;
    const ok = await upsertLocationConsent({
      userId: user.id,
      sharePlacesWithAdmin: accept,
      hideConsentModal: hideModal,
    });
    if (!ok) {
      toast({ title: t("places.consentSaveError"), variant: "destructive" });
      return;
    }
    setConsentResolved(true);
    toast({
      title: accept ? t("places.consentAcceptedToast") : t("places.consentDeclinedToast"),
    });
    setConsentOpen(false);
  };

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = async () => {
    if (!user) return;
    if (!consentResolved) {
      toast({ title: t("places.consentRequiredFirst"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { place, error } = await createUserPlace({
        userId: user.id,
        name,
        mapsUrl,
        note: note || null,
      });
      if (error === "invalid_maps_url") {
        toast({ title: t("places.invalidMapsUrl"), variant: "destructive" });
        setSaving(false);
        return;
      }
      if (!place) {
        toast({ title: t("places.saveError"), description: error ?? "", variant: "destructive" });
        setSaving(false);
        return;
      }
      const ids = Object.entries(selectedContacts).filter(([, v]) => v).map(([k]) => k);
      if (ids.length) {
        await setPlaceContactLinks(user.id, place.id, ids);
      }
      setName("");
      setMapsUrl("");
      setNote("");
      setSelectedContacts({});
      await load();
      toast({ title: t("places.placeAdded") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const ok = await deleteUserPlace(id, user.id);
    if (!ok) {
      toast({ title: t("places.deleteError"), variant: "destructive" });
      return;
    }
    setPlaces((p) => p.filter((x) => x.id !== id));
    toast({ title: t("places.placeDeleted") });
  };

  return (
    <div className="space-y-5">
      <LocationSharingConsentDialog open={consentOpen} onOpenChange={setConsentOpen} onDecision={onConsentDecision} />

      <div
        className="rounded-2xl border border-white/[0.06] p-4 sm:p-5"
        style={{ background: "hsl(220 15% 8% / 0.7)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-primary/80" />
          <h2 className="font-display text-[11px] uppercase tracking-[0.15em] text-white/50">{t("places.addTitle")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder={t("places.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-white/10 bg-black/40 text-white"
          />
          <Input
            placeholder={t("places.mapsUrlPlaceholder")}
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            className="border-white/10 bg-black/40 text-white sm:col-span-2"
          />
          <Input
            placeholder={t("places.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border-white/10 bg-black/40 text-white sm:col-span-2"
          />
        </div>
        <p className="mt-2 text-[11px] text-white/35">{t("places.linkContactsHint")}</p>
        <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleContact(c.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                selectedContacts[c.id]
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/10 text-white/45 hover:border-white/25"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="mt-4 w-full sm:w-auto"
          disabled={saving || !consentResolved || !name.trim() || !mapsUrl.trim()}
          onClick={handleAdd}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("places.addButton")}
        </Button>
      </div>

      <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-5" style={{ background: "hsl(220 15% 8% / 0.5)" }}>
        <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.15em] text-white/50">{t("places.listTitle")}</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/25" />
          </div>
        ) : places.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/35">{t("places.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {places.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.05] bg-black/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white/90">{p.name}</p>
                  <p className="truncate text-[11px] text-white/35">{p.maps_url}</p>
                  {(p.latitude != null && p.longitude != null) && (
                    <p className="text-[10px] text-white/25">
                      {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={p.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-white/60 hover:bg-white/[0.05]"
                  >
                    <ExternalLink size={12} /> Maps
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-red-500/20 p-2 text-red-400/80 hover:bg-red-500/10"
                    aria-label={t("places.delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
