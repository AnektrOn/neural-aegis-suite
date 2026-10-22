import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, FileText, FolderSync, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserRow {
  id: string;
  display_name: string | null;
  elevenlabs_agent_id: string | null;
  drive_folder_id: string | null;
  elevenlabs_sync_enabled: boolean;
  last_synced_at: string | null;
}
interface DocRow {
  id: string;
  user_id: string | null;
  target_agent_id: string;
  source_type: string;
  file_name: string;
  elevenlabs_document_id: string | null;
  status: string;
  error_message: string | null;
  uploaded_at: string | null;
  created_at: string;
}
type Pending = { name: string; text: string; status: "pending" | "uploading" | "success" | "skipped" | "failed"; error?: string };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("elevenlabs-knowledge", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const j = await error.context.json();
        msg = j?.error ?? msg;
      } catch { /* ignore */ }
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

const card = "rounded-2xl border border-border/20 bg-secondary/10 p-5 space-y-4";
const input = "w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none";
const btn = "px-4 py-2 rounded-xl border border-border/30 text-xs uppercase tracking-[0.15em] text-foreground hover:bg-secondary/30 transition-colors disabled:opacity-40 inline-flex items-center gap-2";
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR") : "—");
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", uploading: "Envoi…", success: "Réussi", skipped: "Inchangé (ignoré)", failed: "Échec",
};

function UploadBox({ onUpload, disabled }: { onUpload: (docs: Pending[]) => Promise<Pending[]>; disabled: boolean }) {
  const [items, setItems] = useState<Pending[]>([]);
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Pending[] = [];
    for (const f of Array.from(files)) {
      if (!f.name.toLowerCase().endsWith(".md")) {
        toast.error(`${f.name} n'est pas un fichier .md`);
        continue;
      }
      next.push({ name: f.name, text: await f.text(), status: "pending" });
    }
    setItems((s) => [...s, ...next]);
  };

  const addPaste = () => {
    if (!pasteName.trim() || !pasteText.trim()) {
      toast.error("Donnez un nom au document et collez du contenu");
      return;
    }
    const name = pasteName.trim().endsWith(".md") ? pasteName.trim() : `${pasteName.trim()}.md`;
    setItems((s) => [...s, { name, text: pasteText, status: "pending" }]);
    setPasteName("");
    setPasteText("");
  };

  const send = async () => {
    setBusy(true);
    setItems((s) => s.map((i) => (i.status === "pending" || i.status === "failed" ? { ...i, status: "uploading" } : i)));
    try {
      const res = await onUpload(items.filter((i) => i.status !== "success" && i.status !== "skipped"));
      setItems((s) => s.map((i) => res.find((r) => r.name === i.name) ?? i));
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg);
      setItems((s) => s.map((i) => (i.status === "uploading" ? { ...i, status: "failed", error: msg } : i)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <input type="file" accept=".md,text/markdown" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        className="text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border file:border-border/30 file:bg-secondary/20 file:px-3 file:py-1.5 file:text-foreground" />
      <div className="grid gap-2">
        <input value={pasteName} onChange={(e) => setPasteName(e.target.value)} placeholder="Nom du document (si contenu collé)" className={input} />
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Ou collez du Markdown ici…" rows={5} className={input} />
        <div><button type="button" onClick={addPaste} className={btn}>Ajouter le texte collé</button></div>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((i, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-2">
              <FileText size={13} className="text-muted-foreground" />
              <span className="text-foreground">{i.name}</span>
              <span className={i.status === "failed" ? "text-destructive" : i.status === "success" ? "text-primary" : "text-muted-foreground"}>
                {i.status === "uploading" ? <Loader2 size={12} className="inline animate-spin" /> : null} {STATUS_LABEL[i.status]}
              </span>
              {i.error && <span className="text-xs text-destructive/80 break-all">— {i.error}</span>}
              {i.status === "pending" && (
                <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setItems((s) => s.filter((_, j) => j !== idx))}>retirer</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={send} disabled={disabled || busy || !items.some((i) => i.status === "pending" || i.status === "failed")} className={btn}>
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Envoyer vers l'agent
      </button>
    </div>
  );
}

function DocList({ docs, onDelete }: { docs: DocRow[]; onDelete: (id: string) => void }) {
  if (!docs.length) return <p className="text-sm text-muted-foreground">Aucun document.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="py-2 pr-3">Fichier</th><th className="pr-3">ID ElevenLabs</th><th className="pr-3">Envoi</th><th className="pr-3">Statut</th><th className="pr-3">Source</th><th /></tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t border-border/10 align-top">
              <td className="py-2 pr-3 text-foreground">{d.file_name}</td>
              <td className="pr-3 font-mono text-xs text-muted-foreground break-all">{d.elevenlabs_document_id ?? "—"}</td>
              <td className="pr-3 text-muted-foreground">{fmt(d.uploaded_at)}</td>
              <td className={`pr-3 ${d.status === "failed" ? "text-destructive" : "text-foreground"}`}>
                {STATUS_LABEL[d.status] ?? d.status}
                {d.error_message && <div className="text-xs text-destructive/80 break-all">{d.error_message}</div>}
              </td>
              <td className="pr-3 text-muted-foreground">{d.source_type === "drive_file" ? "Drive" : "Manuel"}</td>
              <td>
                <button type="button" onClick={() => onDelete(d.id)} className="text-destructive/80 hover:text-destructive" aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">Pour remplacer un document, renvoyez un fichier portant le même nom : l'ancien est remplacé.</p>
    </div>
  );
}

export default function AdminElevenLabsKnowledge() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [mainAgent, setMainAgent] = useState("");
  const [mainAgentSaved, setMainAgentSaved] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [driveFolder, setDriveFolder] = useState("");
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [userAgentId, setUserAgentId] = useState("");
  const [bulkResult, setBulkResult] = useState<{ user: string; ok: number; failed: number; skipped: number; error?: string }[] | null>(null);

  const load = useCallback(async () => {
    const [{ data: u }, { data: d }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, elevenlabs_agent_id, drive_folder_id, elevenlabs_sync_enabled, last_synced_at").order("display_name").limit(1000),
      supabase.from("elevenlabs_documents").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("elevenlabs_settings").select("main_agent_id").eq("id", true).maybeSingle(),
    ]);
    setUsers((u ?? []) as UserRow[]);
    setDocs((d ?? []) as DocRow[]);
    setMainAgentSaved(s?.main_agent_id ?? null);
    setMainAgent(s?.main_agent_id ?? "");
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = users.find((u) => u.id === selectedId) ?? null;
  useEffect(() => {
    setDriveFolder(selected?.drive_folder_id ?? "");
    setDriveEnabled(!!selected?.elevenlabs_sync_enabled);
    setUserAgentId(selected?.elevenlabs_agent_id ?? "");
  }, [selected?.id, selected?.drive_folder_id, selected?.elevenlabs_sync_enabled, selected?.elevenlabs_agent_id]);

  const docsByUser = useMemo(() => {
    const m = new Map<string, DocRow[]>();
    for (const d of docs) if (d.user_id) m.set(d.user_id, [...(m.get(d.user_id) ?? []), d]);
    return m;
  }, [docs]);
  const mainDocs = docs.filter((d) => !d.user_id && mainAgentSaved && d.target_agent_id === mainAgentSaved);
  const userDocs = selected ? (docsByUser.get(selected.id) ?? []).filter((d) => d.target_agent_id === selected.elevenlabs_agent_id) : [];

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || (u.display_name ?? "").toLowerCase().includes(q) || u.id.includes(q);
  });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const upload = (target: "user" | "main") => async (items: Pending[]) => {
    const res = await call({ action: "upload", target, user_id: selected?.id, documents: items.map((i) => ({ name: i.name, text: i.text })) });
    await load();
    const results = (res?.results ?? []) as { file: string; status: Pending["status"]; error?: string }[];
    const failed = results.filter((r) => r.status === "failed").length;
    if (failed) toast.error(`${failed} fichier(s) en échec`);
    else toast.success("Documents envoyés");
    return items.map((i) => {
      const r = results.find((x) => x.file === i.name);
      return r ? { ...i, status: r.status, error: r.error } : i;
    });
  };

  const del = (id: string) => {
    if (!confirm("Supprimer ce document de l'agent ElevenLabs ?")) return;
    run("del", async () => { await call({ action: "delete_document", document_row_id: id }); toast.success("Document supprimé"); await load(); });
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">ElevenLabs Knowledge</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chaque utilisateur a son propre agent ElevenLabs. Ses documents ne sont attachés qu'à son agent.</p>
      </div>

      {/* Main agent */}
      <section className={card}>
        <h2 className="flex items-center gap-2 text-lg text-foreground"><Bot size={16} /> Agent principal</h2>
        <div className="flex flex-wrap gap-2">
          <input value={mainAgent} onChange={(e) => setMainAgent(e.target.value)} placeholder="ID de l'agent principal ElevenLabs" className={`${input} flex-1 min-w-[240px]`} />
          <button type="button" className={btn} disabled={busy === "main"} onClick={() => run("main", async () => { await call({ action: "set_main_agent", agent_id: mainAgent }); toast.success("Agent principal enregistré"); await load(); })}>
            {busy === "main" && <Loader2 size={12} className="animate-spin" />} Enregistrer
          </button>
        </div>
        {mainAgentSaved ? (
          <>
            <p className="text-xs text-muted-foreground">Ces fichiers vont uniquement sur l'agent principal, jamais sur les agents des utilisateurs.</p>
            <UploadBox onUpload={upload("main")} disabled={false} />
            <DocList docs={mainDocs} onDelete={del} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Enregistrez d'abord l'ID de l'agent principal.</p>
        )}
      </section>

      {/* Users */}
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className={card}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un utilisateur" className={`${input} pl-9`} />
          </div>
          <ul className="max-h-[560px] overflow-y-auto space-y-1">
            {filtered.map((u) => {
              const ud = docsByUser.get(u.id) ?? [];
              return (
                <li key={u.id}>
                  <button type="button" onClick={() => setSelectedId(u.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${selectedId === u.id ? "bg-primary/10 text-foreground" : "hover:bg-secondary/30 text-muted-foreground"}`}>
                    <div className="text-foreground">{u.display_name || u.id.slice(0, 8)}</div>
                    <div className="text-xs">{u.elevenlabs_agent_id ? `Agent ✓ · ${ud.length} doc(s)` : "Agent non créé"}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-6">
          {!selected ? (
            <div className={card}><p className="text-sm text-muted-foreground">Sélectionnez un utilisateur.</p></div>
          ) : (
            <>
              <div className={card}>
                <h2 className="text-lg text-foreground">{selected.display_name || selected.id}</h2>
                <dl className="grid gap-1 text-sm sm:grid-cols-2">
                  <dt className="text-muted-foreground">Agent ElevenLabs</dt>
                  <dd className="font-mono text-xs text-foreground break-all">{selected.elevenlabs_agent_id ?? "Non créé"}</dd>
                  <dt className="text-muted-foreground">Documents</dt><dd className="text-foreground">{userDocs.length}</dd>
                  <dt className="text-muted-foreground">Dernier envoi</dt><dd className="text-foreground">{fmt(userDocs[0]?.uploaded_at ?? null)}</dd>
                  <dt className="text-muted-foreground">Statut du dernier envoi</dt><dd className="text-foreground">{userDocs[0] ? STATUS_LABEL[userDocs[0].status] : "—"}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <input value={userAgentId} onChange={(e) => setUserAgentId(e.target.value)} placeholder="Ou collez ici l'ID d'un agent existant" className={`${input} flex-1 min-w-[240px]`} />
                  <button type="button" className={btn} disabled={busy === "link"} onClick={() => run("link", async () => {
                    await call({ action: "set_user_agent", user_id: selected.id, agent_id: userAgentId });
                    toast.success("Agent lié à cet utilisateur");
                    await load();
                  })}>
                    {busy === "link" && <Loader2 size={12} className="animate-spin" />} Lier cet agent
                  </button>
                </div>
                {!selected.elevenlabs_agent_id && (
                  <button type="button" className={btn} disabled={busy === "agent"} onClick={() => run("agent", async () => { await call({ action: "create_agent", user_id: selected.id }); toast.success("Agent créé"); await load(); })}>
                    {busy === "agent" ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />} Créer l'agent ElevenLabs
                  </button>
                )}
              </div>

              {selected.elevenlabs_agent_id && (
                <div className={card}>
                  <h3 className="flex items-center gap-2 text-foreground"><Upload size={14} /> Envoi manuel de Markdown</h3>
                  <p className="text-xs text-muted-foreground">Cible : {selected.display_name || selected.id} — agent <span className="font-mono">{selected.elevenlabs_agent_id}</span></p>
                  <UploadBox key={selected.id} onUpload={upload("user")} disabled={false} />
                </div>
              )}

              <div className={card}>
                <h3 className="text-foreground">Documents de l'utilisateur</h3>
                <DocList docs={userDocs} onDelete={del} />
              </div>

              <div className={card}>
                <h3 className="flex items-center gap-2 text-foreground"><FolderSync size={14} /> Drive Sync</h3>
                <input value={driveFolder} onChange={(e) => setDriveFolder(e.target.value)} placeholder="ID ou lien du dossier Google Drive" className={input} />
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={driveEnabled} onChange={(e) => setDriveEnabled(e.target.checked)} /> Synchronisation Drive activée
                </label>
                <p className="text-xs text-muted-foreground">Le dossier doit être partagé avec le compte de service Google de l'app. Dernière synchro : {fmt(selected.last_synced_at)}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btn} disabled={busy === "drive"} onClick={() => run("drive", async () => { await call({ action: "set_drive", user_id: selected.id, drive_folder_id: driveFolder, enabled: driveEnabled }); toast.success("Réglages Drive enregistrés"); await load(); })}>
                    Enregistrer
                  </button>
                  <button type="button" className={btn} disabled={busy === "sync" || !selected.drive_folder_id || !selected.elevenlabs_agent_id} onClick={() => run("sync", async () => {
                    const res = await call({ action: "sync_user", user_id: selected.id });
                    const r = (res?.results ?? []) as { status: string }[];
                    toast.success(`${r.filter((x) => x.status === "success").length} envoyé(s), ${r.filter((x) => x.status === "skipped").length} inchangé(s), ${r.filter((x) => x.status === "failed").length} échec(s)`);
                    await load();
                  })}>
                    {busy === "sync" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Synchroniser ce dossier
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className="flex items-center gap-2 text-lg text-foreground"><FolderSync size={16} /> Synchronisation de tous les utilisateurs</h2>
        <p className="text-sm text-muted-foreground">
          {users.filter((u) => u.elevenlabs_sync_enabled && u.drive_folder_id && u.elevenlabs_agent_id).length} utilisateur(s) prêts (agent + dossier + synchro activée).
        </p>
        <button type="button" className={btn} disabled={busy === "bulk"} onClick={() => {
          if (!confirm("Lancer la synchronisation Drive pour tous les utilisateurs concernés ?")) return;
          run("bulk", async () => { const res = await call({ action: "sync_all" }); setBulkResult(res?.users ?? []); await load(); });
        }}>
          {busy === "bulk" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Synchroniser tous les utilisateurs
        </button>
        {bulkResult && (
          <ul className="text-sm space-y-1">
            {bulkResult.length === 0 && <li className="text-muted-foreground">Aucun utilisateur à synchroniser.</li>}
            {bulkResult.map((r, i) => (
              <li key={i} className="text-foreground">
                {r.user} — {r.ok} envoyé(s), {r.skipped} inchangé(s), <span className={r.failed ? "text-destructive" : ""}>{r.failed} échec(s)</span>
                {r.error && <span className="text-xs text-destructive/80"> — {r.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
