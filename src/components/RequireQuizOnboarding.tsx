/**
 * Soft onboarding gate (disabled): new members keep a default product state
 * without being forced into the V4 30-question quiz at login.
 * Soft CTAs (dashboard / welcome) remain the way to start the assessment.
 */
export default function RequireQuizOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
