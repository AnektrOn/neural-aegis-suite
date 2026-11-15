import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ContactRow = { id: string; name: string };

type Props = {
  userId: string;
  open: boolean;
  initialContactId?: string | null;
  initialContactName?: string | null;
  onClose: (result: "saved" | "dismissed") => void;
};

export function LogosPeopleCheckinModal({
  userId,
  open,
  initialContactId,
  initialContactName,
  onClose,
}: Props) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactId, setContactId] = useState(initialContactId ?? "");
  const [quality, setQuality] = useState(5);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    void (async () => {
      const { data } = await supabase
        .from("people_contacts")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");
      setContacts((data ?? []) as ContactRow[]);
    })();
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    if (initialContactId) {
      setContactId(initialContactId);
      return;
    }
    if (initialContactName) {
      const hit = contacts.find((c) =>
        c.name.toLowerCase().includes(initialContactName.toLowerCase()),
      );
      if (hit) setContactId(hit.id);
    }
  }, [open, initialContactId, initialContactName, contacts]);

  const save = async () => {
    if (!contactId) return;
    setBusy(true);
    try {
      await supabase.from("relation_quality_history").insert({
        user_id: userId,
        contact_id: contactId,
        quality,
        note: note.trim() || null,
      } as never);
      await supabase
        .from("people_contacts")
        .update({ quality } as never)
        .eq("id", contactId)
        .eq("user_id", userId);
      onClose("saved");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose("dismissed")}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Relation du jour</DialogTitle>
          <DialogDescription>Qualité perçue et note courte</DialogDescription>
        </DialogHeader>
        <label className="text-xs text-muted-foreground">Contact</label>
        <select
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
        >
          <option value="">—</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="text-xs text-muted-foreground">Qualité (1–10)</label>
        <Input
          type="number"
          min={1}
          max={10}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="mb-3"
        />
        <label className="text-xs text-muted-foreground">Note</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onClose("dismissed")}>
            Fermer
          </Button>
          <Button type="button" disabled={busy || !contactId} onClick={() => void save()}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
