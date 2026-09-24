import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptCompanyInvite } from "@/services/b2bTenancyService";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AcceptCompanyInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/invite/${token ?? ""}`)}`, { replace: true });
      return;
    }
    if (!token || status !== "idle") return;

    setStatus("working");
    acceptCompanyInvite(token)
      .then(() => {
        setStatus("ok");
        setMessage(t("companies.inviteAccepted"));
        setTimeout(() => navigate("/", { replace: true }), 1500);
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : String(e));
      });
  }, [authLoading, user, token, status, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="ethereal-glass max-w-md w-full p-8 text-center space-y-3">
        <h1 className="text-neural-title text-xl text-foreground">{t("companies.inviteTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {status === "working" ? t("companies.inviteWorking") : message || "…"}
        </p>
      </div>
    </div>
  );
}
