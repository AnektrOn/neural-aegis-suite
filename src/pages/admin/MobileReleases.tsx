import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Upload,
  Rocket,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  listReleases,
  createAndUploadRelease,
  publishRelease,
  deleteRelease,
  listUserVersions,
  type AppRelease,
  type AdoptionRow,
} from "@/services/appReleasesService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function formatBytes(b: number | null): string {
  if (!b) return "—";
  const mb = b / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function MobileReleases() {
  const { t, locale } = useLanguage();
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [versions, setVersions] = useState<AdoptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Form state
  const [versionCode, setVersionCode] = useState<number>(1);
  const [versionName, setVersionName] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [minVersionCode, setMinVersionCode] = useState<string>("");
  const [apkFile, setApkFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rs, vs] = await Promise.all([listReleases(), listUserVersions()]);
      setReleases(rs);
      setVersions(vs);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const published = useMemo(
    () => releases.find((r) => r.is_published) ?? null,
    [releases],
  );

  const adoption = useMemo(() => {
    const latestCode = published?.version_code ?? 0;
    const upToDate = versions.filter((v) => v.version_code >= latestCode).length;
    const behind = versions.filter((v) => v.version_code < latestCode).length;
    return { total: versions.length, upToDate, behind, latestCode };
  }, [versions, published]);

  const handleCreate = useCallback(async () => {
    if (!apkFile) {
      toast.error(t("admin.mobileReleases.errors.apkRequired" as never));
      return;
    }
    if (!versionName || !versionCode) {
      toast.error(t("admin.mobileReleases.errors.fieldsRequired" as never));
      return;
    }
    setBusy(true);
    try {
      await createAndUploadRelease({
        versionCode,
        versionName,
        releaseNotes,
        forceUpdate,
        minVersionCode: minVersionCode ? Number(minVersionCode) : null,
        apkFile,
      });
      toast.success(t("admin.mobileReleases.created" as never));
      setApkFile(null);
      setReleaseNotes("");
      setVersionName("");
      setMinVersionCode("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [
    apkFile,
    versionCode,
    versionName,
    releaseNotes,
    forceUpdate,
    minVersionCode,
    load,
    t,
  ]);

  const handlePublish = useCallback(
    async (id: string) => {
      if (!confirm(t("admin.mobileReleases.confirmPublish" as never))) return;
      setBusy(true);
      try {
        const r = await publishRelease(id);
        toast.success(
          t("admin.mobileReleases.published" as never) +
            (r.manifestUrl ? ` · ${r.manifestUrl.slice(0, 60)}…` : ""),
        );
        await load();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [load, t],
  );

  const handleDelete = useCallback(
    async (release: AppRelease) => {
      if (!confirm(t("admin.mobileReleases.confirmDelete" as never))) return;
      setBusy(true);
      try {
        await deleteRelease(release);
        toast.success(t("admin.mobileReleases.deleted" as never));
        await load();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [load, t],
  );

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("admin.mobileReleases.copied" as never));
  };

  const installPageUrl = `${window.location.origin}/install-android`;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Smartphone className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-cinzel">
            {t("admin.mobileReleases.title" as never)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.mobileReleases.subtitle" as never)}
          </p>
        </div>
      </motion.div>

      {/* Adoption KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={t("admin.mobileReleases.kpi.live" as never)}
          value={published ? `v${published.version_name}` : "—"}
          icon={<Rocket className="w-4 h-4" />}
        />
        <KpiCard
          label={t("admin.mobileReleases.kpi.total" as never)}
          value={String(adoption.total)}
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          label={t("admin.mobileReleases.kpi.upToDate" as never)}
          value={String(adoption.upToDate)}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          label={t("admin.mobileReleases.kpi.behind" as never)}
          value={String(adoption.behind)}
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Create */}
      <section className="ethereal-glass p-6 space-y-4 rounded-lg border border-primary/15">
        <h2 className="text-lg font-cinzel flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {t("admin.mobileReleases.create.title" as never)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("admin.mobileReleases.fields.versionCode" as never)}</Label>
            <Input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>{t("admin.mobileReleases.fields.versionName" as never)}</Label>
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="1.0.9"
            />
          </div>
          <div className="md:col-span-2">
            <Label>{t("admin.mobileReleases.fields.notes" as never)}</Label>
            <Textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>{t("admin.mobileReleases.fields.minVersionCode" as never)}</Label>
            <Input
              type="number"
              value={minVersionCode}
              onChange={(e) => setMinVersionCode(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex items-end gap-3">
            <Switch
              id="force"
              checked={forceUpdate}
              onCheckedChange={setForceUpdate}
            />
            <Label htmlFor="force">
              {t("admin.mobileReleases.fields.forceUpdate" as never)}
            </Label>
          </div>
          <div className="md:col-span-2">
            <Label>{t("admin.mobileReleases.fields.apk" as never)}</Label>
            <Input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={(e) => setApkFile(e.target.files?.[0] ?? null)}
            />
            {apkFile && (
              <p className="text-xs text-muted-foreground mt-1">
                {apkFile.name} · {formatBytes(apkFile.size)}
              </p>
            )}
          </div>
        </div>

        <Button onClick={handleCreate} disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("admin.mobileReleases.create.submit" as never)}
        </Button>
      </section>

      {/* Releases list */}
      <section className="ethereal-glass p-6 space-y-4 rounded-lg border border-primary/15">
        <h2 className="text-lg font-cinzel">
          {t("admin.mobileReleases.list.title" as never)}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.mobileReleases.list.empty" as never)}
          </p>
        ) : (
          <div className="space-y-3">
            {releases.map((r) => {
              const onVersion = versions.filter(
                (v) => v.version_code === r.version_code,
              ).length;
              return (
                <div
                  key={r.id}
                  className="ethereal-glass p-4 flex flex-col md:flex-row md:items-center gap-3 border border-border/40 rounded-md"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-cinzel text-base">
                        v{r.version_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({r.version_code})
                      </span>
                      {r.is_published && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                          {t("admin.mobileReleases.list.liveBadge" as never)}
                        </span>
                      )}
                      {r.force_update && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {t("admin.mobileReleases.list.forced" as never)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(r.file_size_bytes)} ·{" "}
                      {new Date(r.created_at).toLocaleString(locale)} ·{" "}
                      {onVersion}{" "}
                      {t("admin.mobileReleases.list.users" as never)}
                    </p>
                    {r.sha256 && (
                      <p className="text-[10px] text-muted-foreground/70 font-mono break-all">
                        sha256: {r.sha256.slice(0, 32)}…
                      </p>
                    )}
                    {r.release_notes && (
                      <p className="text-xs text-muted-foreground/90 whitespace-pre-wrap mt-2">
                        {r.release_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!r.is_published && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(r.id)}
                        disabled={busy}
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        {t("admin.mobileReleases.actions.publish" as never)}
                      </Button>
                    )}
                    {r.apk_public_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copy(r.apk_public_url)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        APK
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(r)}
                      disabled={busy || r.is_published}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Distribute */}
      {published && (
        <section className="ethereal-glass p-6 space-y-3 rounded-lg border border-primary/15">
          <h2 className="text-lg font-cinzel flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            {t("admin.mobileReleases.distribute.title" as never)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.mobileReleases.distribute.description" as never)}
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => copy(installPageUrl)}>
              <Copy className="w-3 h-3 mr-2" />
              {installPageUrl}
            </Button>
            <Button
              variant="outline"
              onClick={() => copy(published.apk_public_url)}
            >
              <Copy className="w-3 h-3 mr-2" />
              {t("admin.mobileReleases.distribute.copyApk" as never)}
            </Button>
          </div>
        </section>
      )}

      {/* Tracking table */}
      <section className="ethereal-glass p-6 space-y-3 rounded-lg border border-primary/15">
        <h2 className="text-lg font-cinzel">
          {t("admin.mobileReleases.tracking.title" as never)}
        </h2>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.mobileReleases.tracking.empty" as never)}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="text-left py-2">
                    {t("admin.mobileReleases.tracking.user" as never)}
                  </th>
                  <th className="text-left py-2">
                    {t("admin.mobileReleases.tracking.version" as never)}
                  </th>
                  <th className="text-left py-2">
                    {t("admin.mobileReleases.tracking.lastSeen" as never)}
                  </th>
                  <th className="text-left py-2">
                    {t("admin.mobileReleases.tracking.status" as never)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => {
                  const latest = adoption.latestCode;
                  const upToDate = v.version_code >= latest;
                  return (
                    <tr
                      key={v.user_id}
                      className="border-b border-border/20 hover:bg-primary/5"
                    >
                      <td className="py-2">
                        {v.display_name ?? v.user_id.slice(0, 8)}
                      </td>
                      <td className="py-2 font-mono text-xs">
                        v{v.version_name ?? "?"} ({v.version_code})
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {daysSince(v.reported_at)} j
                      </td>
                      <td className="py-2">
                        {upToDate ? (
                          <span className="text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            {t("admin.mobileReleases.kpi.upToDate" as never)}
                          </span>
                        ) : (
                          <span className="text-amber-400">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {t("admin.mobileReleases.kpi.behind" as never)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="ethereal-glass p-4 rounded-lg border border-primary/15">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-cinzel mt-2">{value}</div>
    </div>
  );
}
