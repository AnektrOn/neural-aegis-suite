/** Documented stacking order for user-facing UI (see src/index.css header comment). */
export const Z_INDEX = {
  elevated: 10,
  stickyHeader: 50,
  ambientNebula: 51,
  offlineBanner: 60,
  notificationBackdrop: 90,
  dockScrim: 94,
  dockRadial: 95,
  toast: 100,
  notificationPanel: 100,
  pulseCourse: 100,
  guardian: 200,
  announcement: 200,
  guardianBlocker: 250,
} as const;

export type ZIndexToken = (typeof Z_INDEX)[keyof typeof Z_INDEX];

export function zClass(token: ZIndexToken): string {
  return `z-[${token}]`;
}
