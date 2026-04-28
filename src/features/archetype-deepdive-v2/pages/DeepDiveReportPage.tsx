import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PageWrapper } from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, User, Shield, FileDown, Users } from "lucide-react";
import {
  SAMPLE_PROFILES,
  SAMPLE_PROFILE_MYSTIC,
  buildUserReport,
  buildAdminReport,
  type SampleProfile,
} from "../domain/sampleProfile";
import { exportDeepDivePdf } from "../services/exportDeepDivePdf";

interface DeepDiveReportPageProps {
  /**
   * "user"  → client view: only their own profile, only "Vue Utilisateur" tab.
   * "admin" → admin view: profile selector + both Vue Utilisateur and Vue Admin tabs.
   */
  mode: "user" | "admin";
}

/**
 * Unified Deep Dive report page.
 * - In "user" mode: shows the client's report (currently the canonical sample
 *   profile until per-user persistence ships). User cannot switch profiles.
 * - In "admin" mode: a profile selector lists every available client profile,
 *   and the admin can toggle between the user-facing and clinical admin views.
 */
export default function DeepDiveReportPage({ mode }: DeepDiveReportPageProps) {
  const [profileId, setProfileId] = useState<string>(SAMPLE_PROFILE_MYSTIC.id);
  const [tab, setTab] = useState<"user" | "admin">(mode === "admin" ? "admin" : "user");

  const profile: SampleProfile =
    SAMPLE_PROFILES.find((p) => p.id === profileId) ?? SAMPLE_PROFILE_MYSTIC;

  const userReport = useMemo(() => buildUserReport(profile), [profile]);
  const adminReport = useMemo(() => buildAdminReport(profile), [profile]);

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeMarkdown = tab === "user" ? userReport : adminReport;
  const filenameStem = `deep-dive-${profile.id}-${tab}`;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <FileText size={14} strokeWidth={1.5} />
            {mode === "admin" ? "Deep Dive — Lecture admin" : "Ton rapport Deep Dive"}
          </div>
          <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
            Rapport archétypal
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === "admin"
              ? "Sélectionne un profil client pour consulter sa lecture utilisateur ou la lecture admin Myss."
              : "Lecture personnalisée de tes archétypes dominants, ombres et pratiques recommandées."}
          </p>
        </header>

        {mode === "admin" && (
          <Card className="p-4 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
            <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-display text-text-tertiary">
                <Users size={14} strokeWidth={1.5} />
                Profil client
              </span>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_PROFILES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                      {p.subtitle ? ` — ${p.subtitle}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="user" className="gap-2">
                <User size={14} strokeWidth={1.5} /> Vue Utilisateur
              </TabsTrigger>
              {mode === "admin" && (
                <TabsTrigger value="admin" className="gap-2">
                  <Shield size={14} strokeWidth={1.5} /> Vue Admin
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadMarkdown(activeMarkdown, `${filenameStem}.md`)}
                className="gap-2"
              >
                <Download size={14} strokeWidth={1.5} />
                .md
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportDeepDivePdf({
                    kind: tab,
                    markdown: activeMarkdown,
                    profileLabel: profile.label,
                  })
                }
                className="gap-2"
              >
                <FileDown size={14} strokeWidth={1.5} />
                Exporter PDF
              </Button>
            </div>
          </div>

          <TabsContent value="user" className="mt-4">
            <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary prose-em:text-text-tertiary">
                <ReactMarkdown>{userReport}</ReactMarkdown>
              </article>
            </Card>
          </TabsContent>

          {mode === "admin" && (
            <TabsContent value="admin" className="mt-4">
              <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
                <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary prose-em:text-text-tertiary">
                  <ReactMarkdown>{adminReport}</ReactMarkdown>
                </article>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageWrapper>
  );
}
