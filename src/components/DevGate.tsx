import { useState, type ReactNode, type FormEvent } from "react";

const HASH = "abc84883545a20b3d11c1a817648990dc562ccdeec94095d976ed85f909bc658";
const KEY = "aegis_dev_unlocked";

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function DevGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(() => sessionStorage.getItem(KEY) === HASH);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);

  if (ok) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((await sha256(pwd)) === HASH) {
      sessionStorage.setItem(KEY, HASH);
      setOk(true);
    } else setErr(true);
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3 rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-3xl">
        <p className="text-center font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Accès restreint</p>
        <input
          type="password"
          autoFocus
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setErr(false); }}
          placeholder="Mot de passe"
          className="w-full rounded-xl border border-border/30 bg-secondary/20 px-4 py-2 text-sm text-foreground focus:outline-none"
        />
        {err && <p className="text-xs text-destructive">Mot de passe incorrect</p>}
        <button type="submit" className="w-full rounded-xl bg-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground">Entrer</button>
      </form>
    </div>
  );
}
