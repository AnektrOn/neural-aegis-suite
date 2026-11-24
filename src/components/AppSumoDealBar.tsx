import { useEffect } from "react";

const APPSUMO_EMBED_SRC = "https://appsumo.com/api/v2/embeds/v1/embed.js";

/** AppSumo deal bar — self-updates and hides when the deal ends. */
export default function AppSumoDealBar() {
  useEffect(() => {
    if (document.querySelector(`script[src="${APPSUMO_EMBED_SRC}"]`)) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = APPSUMO_EMBED_SRC;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      data-appsumo-embed="bar"
      data-slug="aegis"
      data-ref="ab2981ea4c865d6c"
      data-theme="match"
      style={{ height: 44, overflow: "hidden" }}
    >
      <a
        href="https://appsumo.com/pl/jq4ltqzIk8/"
        rel="sponsored noopener"
        target="_top"
        style={{
          display: "block",
          height: 44,
          lineHeight: "44px",
          padding: "0 16px",
          textAlign: "center",
          color: "inherit",
          font: "inherit",
          textDecoration: "underline",
        }}
      >
        <span>See drift before it compounds</span> <span>Get lifetime access</span>
      </a>
    </div>
  );
}