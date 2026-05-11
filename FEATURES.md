# Neural Aegis Suite — Feature list

## 1. Full feature list

### Authentication & entry
- **Login page** (`/auth`): email + password (Supabase), show/hide password, loading state, error toasts
- **AuthContext**: `user`, `session`, `loading`, `signOut`, persistence via `onAuthStateChange`
- **ProtectedRoute**: spinner during auth loading, redirect to `/auth` if not signed in
- **Onboarding** (first login): 5 steps (welcome, mood, decisions, habits, journal); Back / Skip / Next; “Start” at the end
- **AdminRoute**: checks admin role (`user_roles`), redirects to `/` if not admin

### User app (AppLayout)

| Route | Page | Features |
|-------|------|-----------------|
| `/` | **Dashboard** | Weekly digest (mood trend, habit rate, decisions resolved, journal count, streak); stat cards; Neural Map; daily actions checklist (5 items); ScoreboardWidget; AIInsights; ScoreCard; badge checks |
| `/mood` | **MoodTracker** | Mood 1–10 (radial), sleep, stress; meals (snack/half/normal); “Save”; 7-day bar chart |
| `/decisions` | **DecisionLog** | Create decision (name, priority 0–5, responsibility 0–10); stats; status list (pending/decided/deferred); confirmation modal; defer date; decision time |
| `/habits` | **HabitTracker** | Assigned habits; check today’s completions; stats; empty state if none |
| `/journal` | **Journal** | List; search; tag filter; new/edit (title, content, mood 1–5, suggested tags); delete |
| `/toolbox` | **Toolbox** | Assigned tools; filter by type; stats; in-page Breathwork / Focus Introspective; external links; completion dialog; “Reload” abandoned; auto-ignore >24h |
| `/people` | **PeopleBoard** | Cards view vs Neural map; add contact; quality slider + note; batch send; quality history (period, curve); delete |
| `/analytics` | **Analytics** | 30-day mood chart; sleep & stress; meals/day; 7-day habits; decisions (pie); PDF export |
| `/profile` | **Profile** | Name, country, timezone; save; export data to CSV |
| `/calendar` | **CalendarView** | Month view; grid indicators (mood/habits/decisions/journal) per day; selected day detail |
| `*` | **NotFound** | 404 + “Return home” link |

### Admin (AdminLayout)

| Route | Page | Features |
|-------|------|-----------------|
| `/admin` | **CallAuditDashboard** | First audit (leader, scores, style, challenges, objectives); search; audit list |
| `/admin/habits` | **HabitFactory** | Create template (name, category, description); assign; delete; assigned count |
| `/admin/users` | **UserManagement** | CSV import; stats; list; toggle admin/disabled; assign company, toolbox |
| `/admin/analytics` | **AdminAnalytics** | Global / by company / by user; KPIs, trends, charts, abandoned toolbox items |
| `/admin/executive` | **ExecutiveDashboard** | KPIs + delta vs previous week; mood curve; top 5 users; PDF export |
| `/admin/companies` | **CompanyManagement** | Add (name, country); list; delete |
| `/admin/toolbox` | **ToolboxManagement** | Stats; assign tool; filter; list with delete |
| `/admin/decisions` | **AdminDecisions** | All decisions; stats; search/filter; admin can change status |
| `/admin/messages` | **AdminMessages** | Compose (recipient, subject, body); send + notification; sent list |
| `/admin/scoreboard` | **ScoreboardConfig** | User; criteria (type, label, target, points); save; max score |

### Shared components
- **AppLayout**: collapsible sidebar; nav (Dashboard → Profile); Admin entry if admin; NotificationBell; ThemeToggle; LanguageSwitcher; sign out
- **ThemeToggle**: light/dark (localStorage + prefers-color-scheme)
- **LanguageSwitcher**: FR/EN
- **NotificationBell**: list, unread badge, mark as read
- **NeuralMap**: relationship graph; period filter; quality colors; draggable nodes
- **ScoreboardWidget**, **AIInsights**, **ScoreCard**, **Badge engine**
- **BreathworkWidget**, **FocusIntrospectifWidget**

---

## 2. Test & try (results)

- **Server**: `npm run dev` → OK (`http://localhost:8082`)
- **Unit tests**: `npm run test` → 1 test (example) passed
- **Navigation**: `/` → redirect to `/auth` (not signed in) → expected

Without a Supabase account, protected pages cannot be tested manually. For a full test: sign in, then go through each route; consider E2E tests (Playwright).

---

## 3. Feature ideas to add

### User experience
- **Reminders / notifications**: daily reminder (mood, habits, journal); time/channel settings
- **Weekly goals**: customizable goals with tracking and celebration
- **Retrospectives**: weekly/monthly recap with rating or comment
- **Custom tags** for the journal; filters on calendar and analytics
- **Global search**: one bar for journal + decisions + contacts

### Data & insights
- **Correlations**: mood ↔ sleep, stress ↔ decisions with mini charts
- **Advanced export**: customizable PDF/Excel (period, sections); scheduled export via email
- **Period comparison**: “This week vs last” on mood, habits, decisions
- **Trends**: improvement/stagnation indicators on key metrics

### Social & network
- **Anonymized sharing**: recap (average mood, habits) for coach or group
- **Groups / teams**: team spaces with aggregated dashboards
- **Conversation**: reply to admin messages (not only one-shot send)

### Toolbox
- **Sequences / journeys**: assignable tool chains (e.g., Morning: breathwork → focus → journal)
- **Editable content**: admin-configurable default texts and durations

### Admin
- **Intermediate roles**: manager/coach (only see their team)
- **Onboarding templates**: configurable journeys by role or company
- **Action audit**: log sensitive actions (role, delete, message)
- **Customizable dashboards**: widget selection (user + executive)

### Technique
- **Offline mode**: cache today’s mood/habits + sync when back online
- **PWA**: installable, icon, push notifications
- **Accessibility**: focus, aria-labels, contrast
- **Performance**: lazy-load admin routes; pagination/virtualization for long lists
