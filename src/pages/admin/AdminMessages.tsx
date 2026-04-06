import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Mail, Search, CheckCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

interface Profile {
  id: string;
  display_name: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

type MessagesLocationState = { adminComposeUserId?: string };

export default function AdminMessages() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const st = location.state as MessagesLocationState | null;
    const id = st?.adminComposeUserId;
    if (id) setSelectedUser(id);
  }, [location.state]);

  const loadData = async () => {
    setLoading(true);
    const [profRes, msgRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("admin_messages" as any).select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setProfiles((profRes.data || []) as unknown as Profile[]);
    setMessages((msgRes.data || []) as unknown as Message[]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!selectedUser || !subject.trim() || !body.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("admin_messages" as any).insert({
      sender_id: user.id,
      recipient_id: selectedUser,
      subject: subject.trim(),
      body: body.trim(),
    } as any);

    if (!error) {
      // Also create a notification for the user
      await supabase.from("notifications").insert({
        user_id: selectedUser,
        title: "Message de l'admin",
        message: subject.trim(),
        type: "message",
        link: "/profile",
      });
      toast.success("Message envoyé");
      setSubject("");
      setBody("");
      setSelectedUser("");
      loadData();
    } else {
      toast.error(t("common.sendError"));
    }
    setSending(false);
  };

  const profileMap = new Map(profiles.map(p => [p.id, p.display_name || "Sans nom"]));

  const filteredMessages = messages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.subject.toLowerCase().includes(q) || m.body.toLowerCase().includes(q) || (profileMap.get(m.recipient_id) || "").toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Messagerie</h1>
      </div>

      {/* Compose */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6 space-y-4">
        <p className="text-neural-label text-neural-accent/60">Nouveau message</p>

        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30">
          <option value="">Sélectionner un destinataire...</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.display_name || "Sans nom"}</option>
          ))}
        </select>

        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet"
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30" />

        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Votre message..." rows={4}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 resize-none" />

        <button onClick={sendMessage} disabled={sending || !selectedUser || !subject.trim() || !body.trim()}
          className="btn-neural disabled:opacity-40 disabled:cursor-not-allowed">
          <Send size={14} /> Envoyer
        </button>
      </motion.div>

      {/* Message history */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-neural-label flex-1">Messages envoyés ({messages.length})</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("common.search")}
              className="bg-secondary/20 border border-border/20 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 w-48" />
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="ethereal-glass p-12 text-center">
            <Mail size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("common.noMessagesSent")}</p>
          </div>
        ) : (
          filteredMessages.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
              className="ethereal-glass p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-foreground truncate">{profileMap.get(msg.recipient_id) || "Utilisateur"}</p>
                  {msg.is_read && <CheckCheck size={12} className="text-primary shrink-0" />}
                  <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                    {new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground">{msg.subject}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{msg.body}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
