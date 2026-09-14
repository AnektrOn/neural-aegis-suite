import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Clock, Users, User as UserIcon, Check, Languages, ListChecks } from "lucide-react";
import UserPicker from "@/features/admin-export/UserPicker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  EMAIL_ALERT_TEMPLATES,
  getAlertTemplate,
  renderAlert,
  type AlertLang,
} from "@/lib/email-alert-catalog";

interface Profile {
  id: string;
  display_name: string | null;
  preferred_language?: string | null;
}

type SendLang = AlertLang | "auto";

interface AlertLogRow {
  id: string;
  alert_id: string | null;
  language: string | null;
  subject: string | null;
  audience: string | null;
  recipients: number;
  mode: string;
  created_at: string;
}

export default function AdminEmailAlerts() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<AlertLogRow[]>([]);

  const [alertId, setAlertId] = useState(EMAIL_ALERT_TEMPLATES[0]?.id ?? "");
  const [lang, setLang] = useState<SendLang>("fr");
  const [audience, setAudience] = useState<"all" | "users" | "selection">("all");
  const [targetUser, setTargetUser] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoAlertId, setAutoAlertId] = useState(EMAIL_ALERT_TEMPLATES[0]?.id ?? "");
  const [autoLang, setAutoLang] = useState<SendLang>("fr");
  const [savingAuto, setSavingAuto] = useState(false);
  const [langSearch, setLangSearch] = useState("");

  const template = useMemo(() => getAlertTemplate(alertId), [alertId]);
  const previewLang: AlertLang = lang === "auto" ? "fr" : lang;
  const preview = useMemo(
    () => (template ? renderAlert(template, previewLang, "Alex") : null),
    [template, previewLang],
  );

  const loadData = async () => {
    const [profRes, logRes, settingsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, preferred_language")
        .order("display_name"),
      supabase
        .from("email_alert_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("email_alert_settings" as never).select("*").maybeSingle(),
    ]);
    setProfiles((profRes.data || []) as unknown as Profile[]);
    setLogs((logRes.data || []) as unknown as AlertLogRow[]);
    const s = settingsRes.data as unknown as
      | { enabled: boolean; alert_id: string | null; language: string | null }
      | null;
    if (s) {
      setAutoEnabled(!!s.enabled);
      if (s.alert_id) setAutoAlertId(s.alert_id);
      setAutoLang(s.language === "en" ? "en" : s.language === "auto" ? "auto" : "fr");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setUserLanguage = async (id: string, value: AlertLang) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, preferred_language: value } : p)),
    );
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: value })
      .eq("id", id);
    if (error) {
      toast.error(t("common.saveError"));
      loadData();
      return;
    }
    toast.success(t("admin.emailAlerts.langSaved"));
  };

  const sendNow = async () => {
    if (!template) return;
    if (audience === "users" && !targetUser) return;
    if (audience === "selection" && selectedIds.length === 0) return;
    setSending(true);
    const userIds =
      audience === "users" ? [targetUser] : audience === "selection" ? selectedIds : [];
    const effective: AlertLang = lang === "auto" ? "fr" : lang;
    const rendered = renderAlert(template, effective);
    const { data, error } = await supabase.functions.invoke("send-user-alert", {
      body: {
        mode: "manual",
        alertId: template.id,
        language: lang,
        subject: rendered.subject,
        body: template[effective === "fr" ? "body_fr" : "body_en"],
        link: template.link,
        audience: userIds.length ? "users" : "all",
        userIds,
        variants: {
          fr: { subject: template.subject_fr, body: template.body_fr },
          en: { subject: template.subject_en, body: template.body_en },
        },
      },
    });
    setSending(false);
    if (error) {
      toast.error(t("common.sendError"));
      return;
    }
    const count = (data as { recipients?: number } | null)?.recipients ?? 0;
    toast.success(t("admin.emailAlerts.sent").replace("{count}", String(count)));
    loadData();
  };

  const saveAuto = async () => {
    const tpl = getAlertTemplate(autoAlertId);
    if (!tpl) return;
    setSavingAuto(true);
    const { error } = await supabase
      .from("email_alert_settings" as never)
      .update({
        enabled: autoEnabled,
        alert_id: tpl.id,
        language: autoLang,
        subject: autoLang === "en" ? tpl.subject_en : tpl.subject_fr,
        body: autoLang === "en" ? tpl.body_en : tpl.body_fr,
        subject_en: tpl.subject_en,
        body_en: tpl.body_en,
        link: tpl.link,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", true);
    setSavingAuto(false);
    if (error) {
      toast.error(t("common.saveError"));
      return;
    }
    toast.success(t("admin.emailAlerts.autoSaved"));
  };

  const langButtons = (value: SendLang, onChange: (l: SendLang) => void) => (
    <div className="flex flex-wrap gap-2">
      {(["fr", "en", "auto"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
            value === l
              ? "border-primary/40 text-primary bg-primary/10"
              : "border-border/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          {l === "fr" ? "Français" : l === "en" ? "English" : t("admin.emailAlerts.langAuto")}
        </button>
      ))}
    </div>
  );

  const filteredProfiles = profiles.filter((p) =>
    (p.display_name || p.id).toLowerCase().includes(langSearch.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">
          {t("admin.emailAlerts.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          {t("admin.emailAlerts.subtitle")}
        </p>
      </div>

      {/* Manual send */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-primary" />
          <p className="text-neural-label text-neural-accent/60">
            {t("admin.emailAlerts.manualSection")}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_ALERT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setAlertId(tpl.id)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                alertId === tpl.id
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/20 hover:border-border/40"
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                {alertId === tpl.id && <Check size={13} className="text-primary" />}
                {previewLang === "fr" ? tpl.subject_fr : tpl.subject_en}
              </span>
              <span className="block text-[11px] text-muted-foreground mt-1 font-mono">
                {tpl.id}
              </span>
            </button>
          ))}
        </div>

        {langButtons(lang, setLang)}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAudience("all")}
            className={`px-3 py-1.5 rounded-xl text-xs border inline-flex items-center gap-1.5 transition-colors ${
              audience === "all"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={12} /> {t("admin.emailAlerts.audienceAll")}
          </button>
          <button
            type="button"
            onClick={() => setAudience("users")}
            className={`px-3 py-1.5 rounded-xl text-xs border inline-flex items-center gap-1.5 transition-colors ${
              audience === "users"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon size={12} /> {t("admin.emailAlerts.audienceOne")}
          </button>
          <button
            type="button"
            onClick={() => setAudience("selection")}
            className={`px-3 py-1.5 rounded-xl text-xs border inline-flex items-center gap-1.5 transition-colors ${
              audience === "selection"
                ? "border-primary/40 text-primary bg-primary/10"
                : "border-border/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListChecks size={12} /> {t("admin.emailAlerts.audienceSelection")}
          </button>
        </div>

        {audience === "selection" && (
          <UserPicker selected={selectedIds} onChange={setSelectedIds} />
        )}

        {audience === "users" && (
          <select
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30"
          >
            <option value="">{t("admin.emailAlerts.selectUser")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.id.slice(0, 8)}
              </option>
            ))}
          </select>
        )}

        {preview && (
          <div className="rounded-xl border border-border/20 bg-secondary/10 p-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              {t("admin.emailAlerts.preview")}
            </p>
            <p className="text-sm text-foreground font-medium">{preview.subject}</p>
            <p className="text-sm text-muted-foreground mt-1">{preview.body}</p>
          </div>
        )}

        <button
          onClick={sendNow}
          disabled={sending || !template || (audience === "users" && !targetUser)}
          className="btn-neural disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} /> {t("admin.emailAlerts.send")}
        </button>
      </motion.div>

      {/* Automatic daily alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <p className="text-neural-label text-neural-accent/60">
            {t("admin.emailAlerts.autoSection")}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("admin.emailAlerts.autoHint")}</p>

        <label className="flex items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={autoEnabled}
            onChange={(e) => setAutoEnabled(e.target.checked)}
            className="accent-primary"
          />
          {t("admin.emailAlerts.autoEnabled")}
        </label>

        <select
          value={autoAlertId}
          onChange={(e) => setAutoAlertId(e.target.value)}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30"
        >
          {EMAIL_ALERT_TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {autoLang === "en" ? tpl.subject_en : tpl.subject_fr}
            </option>
          ))}
        </select>

        {langButtons(autoLang, setAutoLang)}

        <button
          onClick={saveAuto}
          disabled={savingAuto}
          className="btn-neural disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={14} /> {t("common.save")}
        </button>
      </motion.div>

      {/* Per-user language */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Languages size={14} className="text-primary" />
          <p className="text-neural-label text-neural-accent/60">
            {t("admin.emailAlerts.langSection")}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("admin.emailAlerts.langHint")}</p>

        <input
          type="text"
          value={langSearch}
          onChange={(e) => setLangSearch(e.target.value)}
          placeholder={t("common.searchUser")}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30"
        />

        <div className="max-h-80 overflow-y-auto divide-y divide-border/10">
          {filteredProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">{t("common.noUserFound")}</p>
          ) : (
            filteredProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-foreground truncate">
                  {p.display_name || p.id.slice(0, 8)}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  {(["fr", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setUserLanguage(p.id, l)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                        (p.preferred_language === "en" ? "en" : "fr") === l
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-border/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>


      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-6 space-y-3"
      >
        <p className="text-neural-label text-neural-accent/60">
          {t("admin.emailAlerts.history")}
        </p>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.emailAlerts.historyEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-border/10 pb-2"
              >
                <span className="text-foreground">{l.subject}</span>
                <span className="text-muted-foreground font-mono">
                  {l.mode} · {l.language} · {l.recipients} ·{" "}
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
