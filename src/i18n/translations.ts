export type Locale = "fr" | "en";

export const translations = {
  // Navigation
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.mood": { fr: "Humeur", en: "Mood" },
  "nav.decisions": { fr: "Décisions", en: "Decisions" },
  "nav.habits": { fr: "Habitudes", en: "Habits" },
  "nav.journal": { fr: "Journal", en: "Journal" },
  "nav.toolbox": { fr: "Boîte à outils", en: "Toolbox" },
  "nav.people": { fr: "Relations", en: "Relationships" },
  "nav.analytics": { fr: "Analytiques", en: "Analytics" },
  "nav.calendar": { fr: "Calendrier", en: "Calendar" },
  "nav.profile": { fr: "Profil", en: "Profile" },
  "nav.admin": { fr: "Admin", en: "Admin" },
  "nav.logout": { fr: "Se déconnecter", en: "Sign out" },

  // Admin nav
  "admin.nav.calls": { fr: "Audit Appels", en: "Call Audit" },
  "admin.nav.habits": { fr: "Habitudes", en: "Habits" },
  "admin.nav.users": { fr: "Utilisateurs", en: "Users" },
  "admin.nav.analytics": { fr: "Analytiques", en: "Analytics" },
  "admin.nav.companies": { fr: "Entreprises", en: "Companies" },
  "admin.nav.executive": { fr: "Tableau Exécutif", en: "Executive Board" },
  "admin.nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },

  // User Management
  "users.title": { fr: "Gestion des Utilisateurs", en: "User Management" },
  "users.administration": { fr: "Administration", en: "Administration" },
  "users.total": { fr: "Total Leaders", en: "Total Leaders" },
  "users.admins": { fr: "Admins", en: "Admins" },
  "users.audited": { fr: "Audités", en: "Audited" },
  "users.search": { fr: "Rechercher un utilisateur...", en: "Search users..." },
  "users.noName": { fr: "Sans nom", en: "No name" },
  "users.noCompany": { fr: "Aucune entreprise", en: "No company" },
  "users.registeredOn": { fr: "Inscrit le", en: "Registered on" },
  "users.audits": { fr: "Audits", en: "Audits" },
  "users.habits": { fr: "Habitudes", en: "Habits" },
  "users.tools": { fr: "Outils", en: "Tools" },
  "users.disabled": { fr: "Désactivé", en: "Disabled" },
  "users.none": { fr: "Aucun utilisateur trouvé.", en: "No users found." },
  "users.company": { fr: "Entreprise", en: "Company" },
  "users.quickAssign": { fr: "Assignation rapide de contenu", en: "Quick content assignment" },
  "users.removeAdmin": { fr: "Retirer admin", en: "Remove admin" },
  "users.makeAdmin": { fr: "Rendre admin", en: "Make admin" },
  "users.activate": { fr: "Activer", en: "Activate" },
  "users.deactivate": { fr: "Désactiver", en: "Deactivate" },
  "users.assignContent": { fr: "Assigner du contenu", en: "Assign content" },

  // Toasts
  "toast.impossible": { fr: "Impossible", en: "Impossible" },
  "toast.cantModifyOwnRole": { fr: "Vous ne pouvez pas modifier votre propre rôle.", en: "You cannot modify your own role." },
  "toast.roleUpdated": { fr: "Rôle mis à jour", en: "Role updated" },
  "toast.adminRemoved": { fr: "Rôle admin retiré.", en: "Admin role removed." },
  "toast.adminGranted": { fr: "Rôle admin accordé.", en: "Admin role granted." },
  "toast.error": { fr: "Erreur", en: "Error" },
  "toast.contentAssigned": { fr: "Contenu assigné", en: "Content assigned" },
  "toast.assignedTo": { fr: "assigné à l'utilisateur.", en: "assigned to user." },
  "toast.userActivated": { fr: "Utilisateur activé", en: "User activated" },
  "toast.userDisabled": { fr: "Utilisateur désactivé", en: "User disabled" },
  "toast.companyUpdated": { fr: "Entreprise mise à jour", en: "Company updated" },

  // CSV Import
  "import.title": { fr: "Import de données", en: "Data Import" },
  "import.users": { fr: "Import utilisateurs", en: "Import users" },
  "import.data": { fr: "Import données", en: "Import data" },
  "import.selectFile": { fr: "Sélectionner un fichier CSV", en: "Select a CSV file" },
  "import.preview": { fr: "Aperçu", en: "Preview" },
  "import.rows": { fr: "lignes", en: "rows" },
  "import.import": { fr: "Importer", en: "Import" },
  "import.importing": { fr: "Import en cours...", en: "Importing..." },
  "import.success": { fr: "Import réussi", en: "Import successful" },
  "import.rowsImported": { fr: "lignes importées", en: "rows imported" },
  "import.formatUsers": { fr: "Format : display_name, email, company_name, country", en: "Format: display_name, email, company_name, country" },
  "import.formatData": { fr: "Format : user_email, type (mood/journal), data (JSON)", en: "Format: user_email, type (mood/journal), data (JSON)" },

  // Auth
  "auth.email": { fr: "Courriel", en: "Email" },
  "auth.password": { fr: "Mot de passe", en: "Password" },
  "auth.signIn": { fr: "Se connecter", en: "Sign In" },

  // General
  "general.loading": { fr: "Chargement...", en: "Loading..." },
  "general.save": { fr: "Enregistrer", en: "Save" },
  "general.cancel": { fr: "Annuler", en: "Cancel" },
  "general.delete": { fr: "Supprimer", en: "Delete" },
  "general.language": { fr: "Langue", en: "Language" },
} as const;

export type TranslationKey = keyof typeof translations;
