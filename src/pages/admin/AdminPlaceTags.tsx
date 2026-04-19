import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminDeletePlaceTag,
  adminFetchPlaceTags,
  adminUpsertPlaceTag,
  type PlaceTagDefinition,
} from "@/services/adminPlaces";
export default function AdminPlaceTags() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [rows, setRows] = useState<PlaceTagDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [labelFr, setLabelFr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [risk, setRisk] = useState("0");
  const [editing, setEditing] = useState<PlaceTagDefinition | null>(null);

  const load = async () => {
    setLoading(true);
    setRows(await adminFetchPlaceTags());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: PlaceTagDefinition) => {
    setEditing(r);
    setSlug(r.slug);
    setLabelFr(r.label_fr);
    setLabelEn(r.label_en);
    setRisk(String(r.risk_level));
  };

  const cancelEdit = () => {
    setEditing(null);
    setSlug("");
    setLabelFr("");
    setLabelEn("");
    setRisk("0");
  };

  const save = async () => {
    const res = await adminUpsertPlaceTag({
      id: editing?.id,
      slug: slug.trim(),
      label_fr: labelFr.trim(),
      label_en: labelEn.trim(),
      risk_level: Math.min(5, Math.max(0, parseInt(risk, 10) || 0)),
    });
    if (!res.ok) {
      toast({ title: t("admin.placeTags.saveError"), description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: t("admin.placeTags.saved") });
    cancelEdit();
    load();
  };

  const del = async (id: string) => {
    if (!confirm(t("admin.placeTags.confirmDelete"))) return;
    const ok = await adminDeletePlaceTag(id);
    if (!ok) {
      toast({ title: t("admin.placeTags.deleteError"), variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-xl text-text-primary">{t("admin.placeTags.title")}</h1>
          <p className="mt-1 text-sm text-text-tertiary">{t("admin.placeTags.subtitle")}</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-elevated/40 p-4 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-text-secondary">{editing ? t("admin.placeTags.edit") : t("admin.placeTags.add")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="font-mono text-sm" />
            <Input value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="0–5" className="text-sm" />
            <Input value={labelFr} onChange={(e) => setLabelFr(e.target.value)} placeholder="Label FR" />
            <Input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="Label EN" />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={!slug.trim() || !labelFr.trim() || !labelEn.trim()}>
              {t("admin.placeTags.save")}
            </Button>
            {editing && (
              <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                {t("admin.placeTags.cancel")}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-text-tertiary">…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-bg-elevated/60 text-[10px] uppercase tracking-widest text-text-tertiary">
                <tr>
                  <th className="p-3">{t("admin.placeTags.colSlug")}</th>
                  <th className="p-3">{t("admin.placeTags.colLabels")}</th>
                  <th className="p-3">{t("admin.placeTags.colRisk")}</th>
                  <th className="p-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border-subtle/60">
                    <td className="p-3 font-mono text-xs text-text-secondary">{r.slug}</td>
                    <td className="p-3 text-text-primary">
                      {r.label_fr} / {r.label_en}
                    </td>
                    <td className="p-3 text-text-tertiary">{r.risk_level}</td>
                    <td className="p-3 flex gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(r)}>
                        <Pencil size={14} />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del(r.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
