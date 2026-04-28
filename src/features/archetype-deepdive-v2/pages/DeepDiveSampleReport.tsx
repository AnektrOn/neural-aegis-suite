import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PageWrapper } from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Download, User, Shield, FileDown } from "lucide-react";
import {
  SAMPLE_PROFILE_LEADER,
  buildUserReport,
  buildAdminReport,
} from "../domain/sampleProfile";
import { exportDeepDivePdf } from "../services/exportDeepDivePdf";

/**
 * Renders the live-generated Deep Dive V2 reports (user + admin views) from the
 * canonical SAMPLE_PROFILE_LEADER. Acts as a reference page during design.
 */
export default function DeepDiveSampleReport() {
  const [tab, setTab] = useState<"user" | "admin">("user");

  const userReport = useMemo(() => buildUserReport(SAMPLE_PROFILE_LEADER), []);
  const adminReport = useMemo(() => buildAdminReport(SAMPLE_PROFILE_LEADER), []);

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <FileText size={14} strokeWidth={1.5} />
            Deep Dive V2 — Échantillon
          </div>
          <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
            Rapport généré
          </h1>
          <p className="text-sm text-text-secondary">
            Profil fictif : <span className="text-text-primary">{SAMPLE_PROFILE_LEADER.label}</span>.
            Rapports user et admin construits automatiquement depuis la même source de vérité
            (<code className="text-xs">SAMPLE_PROFILE_LEADER</code>).
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="user" className="gap-2">
                <User size={14} strokeWidth={1.5} /> Vue Utilisateur
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield size={14} strokeWidth={1.5} /> Vue Admin
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                tab === "user"
                  ? downloadMarkdown(userReport, "deep-dive-user.md")
                  : downloadMarkdown(adminReport, "deep-dive-admin.md")
              }
              className="gap-2"
            >
              <Download size={14} strokeWidth={1.5} />
              Télécharger .md
            </Button>
          </div>

          <TabsContent value="user" className="mt-4">
            <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary">
                <ReactMarkdown>{userReport}</ReactMarkdown>
              </article>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <Card className="p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
              <article className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-wider prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary">
                <ReactMarkdown>{adminReport}</ReactMarkdown>
              </article>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
