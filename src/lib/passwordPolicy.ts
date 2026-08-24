export const SIGNUP_MIN_PASSWORD_LENGTH = 8;

export type SignupPasswordIssue = "min" | "letter" | "digit";

export function signupPasswordIssues(password: string): SignupPasswordIssue[] {
  const issues: SignupPasswordIssue[] = [];
  if (password.length < SIGNUP_MIN_PASSWORD_LENGTH) issues.push("min");
  if (!/[A-Za-zÀ-ÿ]/.test(password)) issues.push("letter");
  if (!/[0-9]/.test(password)) issues.push("digit");
  return issues;
}

/** 0 empty · 1 weak · 2 acceptable · 3 strong */
export function signupPasswordScore(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  const issues = signupPasswordIssues(password);
  if (issues.length) return issues.includes("min") ? 1 : 2;
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) return 3;
  return 2;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
