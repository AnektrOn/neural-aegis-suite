# Catalogue des alertes email (FR / EN)

Ce fichier définit les alertes email envoyables depuis **Admin → Alertes email**.
Une alerte = un bloc `## id` suivi des champs. Ajoutez / modifiez librement.

Champs disponibles :
- `link` : lien cliquable dans l'email (chemin de l'app)
- `subject_fr`, `subject_en` : objet du mail
- `body_fr`, `body_en` : corps du mail (texte simple, `{name}` = prénom / nom affiché)

---

## toolbox_waiting
link: /toolbox
subject_fr: Vos outils vous attendent
subject_en: Your toolbox is waiting
body_fr: Bonjour {name}, vos exercices de la Toolbox vous attendent. Quelques minutes suffisent pour garder l'élan.
body_en: Hi {name}, your Toolbox exercises are waiting for you. A few minutes are enough to keep the momentum.

## pulse_cards
link: /pulse
subject_fr: De nouvelles cartes Pulse sont disponibles
subject_en: New Pulse cards are available
body_fr: Bonjour {name}, de nouvelles cartes Pulse viennent d'arriver. Prenez 3 minutes pour les assimiler.
body_en: Hi {name}, new Pulse cards just landed. Take 3 minutes to assimilate them.

## sleep_check
link: /mood
subject_fr: Avez-vous bien dormi cette nuit ?
subject_en: Did you sleep well last night?
body_fr: Bonjour {name}, notez votre sommeil et votre humeur du jour. C'est la base de vos données de progression.
body_en: Hi {name}, log your sleep and today's mood. It is the foundation of your progress data.

## daily_checkin
link: /dashboard
subject_fr: Votre point quotidien AEGIS
subject_en: Your daily AEGIS check-in
body_fr: Bonjour {name}, prenez 5 minutes pour votre point du jour : humeur, habitudes, décisions.
body_en: Hi {name}, take 5 minutes for your daily check-in: mood, habits, decisions.

## habits_reminder
link: /habits
subject_fr: Vos habitudes du jour
subject_en: Your habits for today
body_fr: Bonjour {name}, il reste des habitudes à valider aujourd'hui. La régularité fait la différence.
body_en: Hi {name}, some habits are still to be completed today. Consistency makes the difference.

## journal_reminder
link: /journal
subject_fr: Un mot dans votre journal ?
subject_en: A word in your journal?
body_fr: Bonjour {name}, écrivez quelques lignes dans votre journal. Vos réflexions nourrissent vos rapports.
body_en: Hi {name}, write a few lines in your journal. Your reflections feed your reports.

## report_ready
link: /persona
subject_fr: Votre rapport est disponible
subject_en: Your report is available
body_fr: Bonjour {name}, un nouveau rapport personnalisé vous attend dans votre espace.
body_en: Hi {name}, a new personalized report is waiting in your space.

## app_update
link: /install-android
subject_fr: Une nouvelle version de l'application est disponible
subject_en: A new app version is available
body_fr: Bonjour {name}, une nouvelle version de l'application Android est en ligne. Mettez à jour pour profiter des améliorations.
body_en: Hi {name}, a new Android app version is live. Update to get the latest improvements.
