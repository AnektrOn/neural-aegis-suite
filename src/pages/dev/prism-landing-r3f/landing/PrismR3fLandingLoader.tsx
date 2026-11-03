type Props = {
  progress: number;
};

export function PrismR3fLandingLoader({ progress }: Props) {
  const pct = Math.round(Math.min(100, Math.max(0, progress)));

  return (
    <div className="prism-r3f-landing-loader" role="status" aria-live="polite">
      <div className="prism-r3f-landing-loader__inner">
        <div className="prism-r3f-landing-loader__bars" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="prism-r3f-landing-loader__bar" />
          ))}
        </div>
        <p className="prism-r3f-landing-loader__pct">{pct}%</p>
        <p className="prism-r3f-landing-loader__label">LOADING CONTENT</p>
      </div>
    </div>
  );
}
