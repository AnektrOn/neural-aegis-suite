/** Static landing boot — no WebGL. Used as Suspense fallback so guests don't pay for two armillary contexts. */
export function LandingBootFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F3EEEC]">
      <p className="font-cinzel text-lg tracking-[0.28em] text-[#121212]/70">AEGIS</p>
    </div>
  );
}
