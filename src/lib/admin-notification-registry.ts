/**
 * Registre des notifications **reçues par les comptes admin** (`notifications.user_id` = admin).
 * Sert au tracking, aux tests, au filtrage UI et à la cohérence avec SQL + edge.
 *
 * Les notifications **utilisateur** utilisent entre autres : `message`, `badge`, `info`, `success`, …
 * Attention : `success` et `info` sont **partagés** (scoreboard utilisateur vs toolbox admin) — utiliser `link` ou le rôle du destinataire.
 */

/** Types réservés aux flux admin (préfixe `admin_`) — jamais confondus avec le scoreboard. */
export const ADMIN_PREFIX_NOTIFICATION_TYPES = [
  "admin_journal",
  "admin_mood",
  "admin_habit",
  "admin_decision",
  "admin_contact",
  "admin_relation",
  "admin_login",
  "admin_toolbox",
] as const;

export type AdminPrefixNotificationType = (typeof ADMIN_PREFIX_NOTIFICATION_TYPES)[number];

/**
 * Types legacy pour le trigger toolbox (même chaîne que le scoreboard utilisateur).
 * Interprétation « notif admin toolbox » uniquement si `link === '/admin/toolbox'`.
 */
export const TOOLBOX_ADMIN_LEGACY_TYPES = ["success", "info"] as const;

export type AdminNotificationSource = "postgres_trigger" | "edge_function";

export interface AdminNotificationDefinition {
  /** Valeur stockée dans `notifications.type`. */
  type: string;
  /** Libellé court pour tableaux / docs / analytics. */
  labelFr: string;
  source: AdminNotificationSource;
  /** Nom fonction SQL ou handler edge. */
  origin: string;
  /** Table ou déclencheur métier. */
  detail: string;
  /** `notifications.link` (quand défini). */
  defaultLink: string | null;
  /** Email optionnel en plus de l’in-app. */
  emailChannel: "none" | "optional_resend" | "via_edge_only";
  /** Si `type` est ambigu (ex. success/info), préciser comment filtrer. */
  disambiguation?: string;
}

/**
 * Liste canonique pour tracking / QA / conformité au plan produit.
 * Toute nouvelle notif admin doit être ajoutée ici et dans la migration ou l’edge.
 */
export const ADMIN_NOTIFICATION_DEFINITIONS: readonly AdminNotificationDefinition[] = [
  {
    type: "admin_journal",
    labelFr: "Nouvelle entrée journal",
    source: "postgres_trigger",
    origin: "notify_admin_journal_entry",
    detail: "AFTER INSERT sur journal_entries",
    defaultLink: "/admin/analytics",
    emailChannel: "optional_resend",
  },
  {
    type: "admin_mood",
    labelFr: "Nouvelle entrée humeur",
    source: "postgres_trigger",
    origin: "notify_admin_mood_entry",
    detail: "AFTER INSERT sur mood_entries",
    defaultLink: "/admin/analytics",
    emailChannel: "none",
  },
  {
    type: "admin_habit",
    labelFr: "Complétion d’habitude",
    source: "postgres_trigger",
    origin: "notify_admin_habit_completion",
    detail: "AFTER INSERT sur habit_completions",
    defaultLink: "/admin/habits",
    emailChannel: "none",
  },
  {
    type: "admin_decision",
    labelFr: "Nouvelle décision",
    source: "postgres_trigger",
    origin: "notify_admin_decision_created",
    detail: "AFTER INSERT sur decisions",
    defaultLink: "/admin/decisions",
    emailChannel: "none",
  },
  {
    type: "admin_contact",
    labelFr: "Nouveau contact People",
    source: "postgres_trigger",
    origin: "notify_admin_people_contact_created",
    detail: "AFTER INSERT sur people_contacts",
    defaultLink: "/admin/analytics",
    emailChannel: "none",
  },
  {
    type: "admin_relation",
    labelFr: "Mise à jour relation / qualité",
    source: "postgres_trigger",
    origin: "notify_admin_relation_quality_entry",
    detail: "AFTER INSERT sur relation_quality_history",
    defaultLink: "/admin/analytics",
    emailChannel: "none",
  },
  {
    type: "success",
    labelFr: "Toolbox — outil terminé",
    source: "postgres_trigger",
    origin: "notify_admin_toolbox_completion → notify_all_admins",
    detail: "AFTER INSERT sur toolbox_completions (status = completed)",
    defaultLink: "/admin/toolbox",
    emailChannel: "none",
    disambiguation: "Même libellé `type` que le scoreboard utilisateur ; ici `link` = /admin/toolbox",
  },
  {
    type: "info",
    labelFr: "Toolbox — outil abandonné / ignoré",
    source: "postgres_trigger",
    origin: "notify_admin_toolbox_completion → notify_all_admins",
    detail: "AFTER INSERT sur toolbox_completions (status ∈ abandoned, ignored)",
    defaultLink: "/admin/toolbox",
    emailChannel: "none",
    disambiguation: "Même libellé `type` que d’autres notifs utilisateur ; ici `link` = /admin/toolbox",
  },
  {
    type: "admin_login",
    labelFr: "Connexion utilisateur",
    source: "edge_function",
    origin: "send-email-notification (admin_login_alert)",
    detail: "Auth SIGNED_IN + invoke client ; in-app pour chaque admin",
    defaultLink: "/admin/analytics",
    emailChannel: "optional_resend",
  },
  {
    type: "admin_toolbox",
    labelFr: "Toolbox — abandon (email / edge)",
    source: "edge_function",
    origin: "send-email-notification (toolbox_abandoned)",
    detail: "Chemin edge `toolbox_abandoned` ; peut recouper le trigger `info` + même événement",
    defaultLink: "/admin/toolbox",
    emailChannel: "optional_resend",
  },
];

const ADMIN_PREFIX_SET = new Set<string>(ADMIN_PREFIX_NOTIFICATION_TYPES);

/** `type` commence par `admin_` — sûr pour cibler une activité admin. */
export function isAdminPrefixNotificationType(type: string | null | undefined): boolean {
  if (!type) return false;
  return ADMIN_PREFIX_SET.has(type);
}

/** Ligne toolbox insérée par le trigger pour les admins (legacy success/info + lien). */
export function isToolboxAdminNotificationRow(row: {
  type: string;
  link?: string | null;
}): boolean {
  return (
    (row.type === "success" || row.type === "info") && row.link === "/admin/toolbox"
  );
}

/**
 * Heuristique « activité suivie côté admin » : préfixe `admin_` ou ligne toolbox trigger.
 * Ne remplace pas la vérification du rôle du destinataire pour les analytics.
 */
export function isAdminActivityNotificationRow(row: {
  type: string;
  link?: string | null;
}): boolean {
  return isAdminPrefixNotificationType(row.type) || isToolboxAdminNotificationRow(row);
}

/** Libellé FR pour le registre, ou le type brut si inconnu. */
export function labelAdminNotificationTypeFr(type: string): string {
  const def = ADMIN_NOTIFICATION_DEFINITIONS.find((d) => d.type === type);
  return def?.labelFr ?? type;
}
