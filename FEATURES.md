# Neural Aegis Suite — Liste des fonctionnalités

## 1. Liste de toutes les fonctionnalités

### Authentification & entrée
- **Page de connexion** (`/auth`) : email + mot de passe (Supabase), afficher/masquer mot de passe, chargement, toasts d'erreur
- **AuthContext** : `user`, `session`, `loading`, `signOut`, persistance via `onAuthStateChange`
- **ProtectedRoute** : spinner pendant le chargement auth, redirection vers `/auth` si non connecté
- **Onboarding** (première connexion) : 5 étapes (bienvenue, mood, décisions, habitudes, journal) ; Back / Skip / Next ; « Commencer » à la fin
- **AdminRoute** : vérification rôle admin (`user_roles`), redirection vers `/` si non admin

### Application utilisateur (AppLayout)

| Route | Page | Fonctionnalités |
|-------|------|-----------------|
| `/` | **Dashboard** | Résumé hebdo (tendance mood, taux habitudes, décisions résolues, nb journal, streak) ; cartes stats ; Neural Map ; checklist actions du jour (5 items) ; ScoreboardWidget ; AIInsights ; ScoreCard ; vérification badges |
| `/mood` | **MoodTracker** | Mood 1–10 (radial), sommeil, stress ; repas (snack/demi/normal) ; « Enregistrer » ; graphique barres 7 derniers jours |
| `/decisions` | **DecisionLog** | Créer décision (nom, priorité 0–5, responsabilité 0–10) ; stats ; liste statuts (pending/decided/deferred) ; modal confirmation ; date de report ; temps de décision |
| `/habits` | **HabitTracker** | Habitudes assignées ; cocher complétions du jour ; stats ; empty state si aucune |
| `/journal` | **Journal** | Liste ; recherche ; filtre par tag ; nouveau/édition (titre, contenu, humeur 1–5, tags suggérés) ; suppression |
| `/toolbox` | **Toolbox** | Outils assignés ; filtre par type ; stats ; Breathwork / Focus Introspectif en page ; liens externes ; dialogue complétion ; « Recharger » abandonnés ; auto-ignore >24h |
| `/people` | **PeopleBoard** | Vue cartes vs Neural map ; ajouter contact ; slider qualité + note ; envoi en lot ; historique qualité (période, courbe) ; suppression |
| `/analytics` | **Analytics** | Courbe mood 30j ; sommeil & stress ; repas/jour ; habitudes 7j ; décisions (camembert) ; Export PDF |
| `/profile` | **Profile** | Nom, pays, fuseau ; sauvegarde ; export données en CSV |
| `/calendar` | **CalendarView** | Mois ; grille indicateurs mood/habits/decisions/journal par jour ; détail jour sélectionné |
| `*` | **NotFound** | 404 + lien « Retour à l'accueil » |

### Admin (AdminLayout)

| Route | Page | Fonctionnalités |
|-------|------|-----------------|
| `/admin` | **CallAuditDashboard** | Premier audit (leader, scores, style, défis, objectifs) ; recherche ; liste audits |
| `/admin/habits` | **HabitFactory** | Créer template (nom, catégorie, description) ; assigner ; supprimer ; nb assignés |
| `/admin/users` | **UserManagement** | Import CSV ; stats ; liste ; toggle admin/disabled ; assigner company, toolbox |
| `/admin/analytics` | **AdminAnalytics** | Global / Par entreprise / Par utilisateur ; KPIs, tendances, graphiques, abandonnés toolbox |
| `/admin/executive` | **ExecutiveDashboard** | KPIs + delta vs semaine précédente ; courbe mood ; top 5 users ; Export PDF |
| `/admin/companies` | **CompanyManagement** | Ajouter (nom, pays) ; liste ; suppression |
| `/admin/toolbox` | **ToolboxManagement** | Stats ; assigner outil ; filtre ; liste avec suppression |
| `/admin/decisions` | **AdminDecisions** | Toutes décisions ; stats ; recherche/filtre ; admin change statut |
| `/admin/messages` | **AdminMessages** | Rédiger (destinataire, sujet, corps) ; envoi + notification ; liste envoyés |
| `/admin/scoreboard` | **ScoreboardConfig** | User ; critères (type, label, cible, points) ; sauvegarde ; score max |

### Composants partagés
- **AppLayout** : sidebar repliable ; nav (Dashboard → Profile) ; Admin si admin ; NotificationBell ; ThemeToggle ; LanguageSwitcher ; déconnexion
- **ThemeToggle** : clair/sombre (localStorage + prefers-color-scheme)
- **LanguageSwitcher** : FR/EN
- **NotificationBell** : liste, badge non lus, marquer lu
- **NeuralMap** : graphe relations ; filtre période ; couleurs qualité ; noeuds déplaçables
- **ScoreboardWidget**, **AIInsights**, **ScoreCard**, **Badge engine**
- **BreathworkWidget**, **FocusIntrospectifWidget**

---

## 2. Test & try (résultats)

- **Serveur** : `npm run dev` → OK (http://localhost:8082)
- **Tests unitaires** : `npm run test` → 1 test (example) passé
- **Navigation** : `/` → redirection `/auth` (non connecté) → attendu

Sans compte Supabase, les pages protégées ne sont pas testables manuellement. Pour un test complet : se connecter puis parcourir chaque route ; envisager des tests E2E (Playwright).

---

## 3. Idées de fonctionnalités à ajouter

### Expérience utilisateur
- **Rappels / notifications** : rappel quotidien (mood, habitudes, journal) ; paramètres heure/canaux
- **Objectifs hebdomadaires** : objectifs personnalisables avec suivi et célébration
- **Rétrospectives** : résumé hebdo/mensuel avec note ou commentaire
- **Tags personnalisés** pour le journal ; filtres sur calendrier et analytics
- **Recherche globale** : une barre pour journal + décisions + contacts

### Données & insights
- **Corrélations** : mood ↔ sommeil, stress ↔ décisions avec mini graphiques
- **Export avancé** : PDF/Excel personnalisable (période, sections) ; export récurrent par email
- **Comparaison de périodes** : « Cette semaine vs précédente » sur mood, habitudes, décisions
- **Tendances** : indication amélioration/stagnation sur métriques clés

### Social & réseau
- **Partage anonymisé** : résumé (mood moyen, habitudes) pour coach ou groupe
- **Groupes / équipes** : espaces par équipe avec tableaux agrégés
- **Conversation** : réponses aux messages admin (pas seulement envoi one-shot)

### Toolbox
- **Séquences / parcours** : enchaînement d’outils assignable (ex. Matin : breathwork → focus → journal)
- **Contenu éditable** : textes et durées par défaut configurables par l’admin

### Admin
- **Rôles intermédiaires** : manager/coach (voir uniquement son équipe)
- **Templates d’onboarding** : parcours configurables par rôle ou entreprise
- **Audit des actions** : log des actions sensibles (rôle, suppression, message)
- **Tableaux de bord personnalisables** : choix des widgets (user + executive)

### Technique
- **Mode hors-ligne** : cache mood/habitudes du jour + sync au retour
- **PWA** : installable, icône, notifications push
- **Accessibilité** : focus, aria-labels, contraste
- **Performance** : lazy routes admin ; pagination/virtualisation longues listes
