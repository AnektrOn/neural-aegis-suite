import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PublicFooter from "@/components/public/PublicFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Props = {
  title: string;
  description: string;
  updated: string;
  children: React.ReactNode;
};

export default function LegalPageShell({ title, description, updated, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${title} | Protocole Nomos`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Protocole Nomos`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="font-display text-sm uppercase tracking-[0.24em] text-foreground"
        >
          Aegis
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-8">
        <h1 className="font-display text-3xl tracking-wide text-foreground">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-text-tertiary">{updated}</p>
        <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-foreground [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
