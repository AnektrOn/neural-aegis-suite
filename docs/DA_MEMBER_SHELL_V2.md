# Charte & Spécification DA — AEGIS Member Shell v2 (Dark & Light)

Ce document établit la **Direction Artistique officielle (DA)** de l'écosystème membre AEGIS, harmonisée avec le Dashboard Bio-Executive, déclinée en **Dark Mode** et **Light Mode**, et structurée autour des polices **Cinzel**, **Cormorant Garamond**, **Barlow** et **DM Mono**.

---

## 1. Piliers Esthétiques

- **Minéralité & Noblesse** : Obsidienne, basalte volcanique, albâtre, craie chaude et ivoire.
- **Éclat Solaire Ancien** : Or solaire ciselé (`#c9a24b` en Dark, `#9e7828` en Light), reflets d'ambre et de cuivre.
- **Typographie Impériale & Ciselée** : **Cinzel** pour l'autorité emblématique et les kickers de grade, **Cormorant Garamond** pour l'élégance introspective des H1, **Barlow** pour la clarté d'interface et **DM Mono** pour la précision biométrique.
- **Architecture Bento** : Remplacement universel des effets verre bleu/violet par des blocs géométriques épurés, fins et respirants.

---

## 2. Palette Bimodale (Dark & Light Mode)

### 2.1 Surfaces & Arrière-plans

| Rôle Visuel | Dark Mode | Light Mode | Description |
|-------------|-----------|------------|-------------|
| **Fond Profond (Abyss)** | `#070707` | `#ede9e0` | Arrière-plan des visualisations silhouette et labs |
| **Fond Global (Bg Base)** | `#0b0b0a` (Obsidienne) | `#f5f2eb` (Albâtre chaud) | Fond général de `MemberAppShell` et de toutes les pages |
| **Surface Bento (Cartes)** | `#161614` (Basalte chaud) | `#ffffff` (Craie pure chaude) | Tuiles de contenu, formulaires, modules interactifs |
| **Surface Élevée (Popovers)** | `#1e1e1c` (Titane) | `#faf8f5` (Pierre fine) | Modales, menus déroulants, tooltips |
| **Bordure Structurale (Cardline)** | `rgba(233, 228, 216, 0.08)` | `rgba(22, 22, 20, 0.08)` | Découpe fine des tuiles bento |
| **Bordure Active / Focus** | `rgba(201, 162, 75, 0.35)` | `rgba(158, 120, 40, 0.40)` | Halo or solaire au survol et à la sélection |

---

### 2.2 Textes & Contrastes Typographiques

| Niveau de Lecture | Dark Mode | Light Mode | Rôle & Usage |
|-------------------|-----------|------------|--------------|
| **Texte Primaire (Ink)** | `#e9e4d8` (Ivoire bone) | `#141412` (Obsidienne profonde) | Titres majeurs, valeurs de scores, texte de lecture fort |
| **Texte Secondaire (Muted)** | `#9a968b` (Quartz fumé) | `#615d54` (Granite d'ombre) | Sous-titres, descriptions, labels d'instruments |
| **Texte Tertiaire (Subtle)** | `#6e6a61` (Pierre sombre) | `#8c877c` (Cendre minérale) | Métadonnées discrètes, horodatages, kickers inactifs |
| **Puces / Lignes Inactives** | `#b9b4a6` | `#d8d3c7` | Séparateurs, bordures neutres de tags |

---

### 2.3 Accents Métalliques & Solaires

| Accent | Dark Mode | Light Mode | Usage |
|--------|-----------|------------|-------|
| **Or Solaire (Primaire)** | `#c9a24b` (`hsl(41 53% 54%)`) | `#9e7828` (`hsl(41 60% 39%)`) | Accent souverain, CTA maîtres, badges d'accomplissement |
| **Or Lumineux (Gradient A)** | `#d2ae5e` | `#b88d32` | Tête de dégradé solaire |
| **Or Profond (Gradient B)** | `#a67f2e` | `#82611e` | Base de dégradé et encadrements solaires |
| **Cuivre (Énergie / Piliers)** | `#ba6f3c` | `#9c5323` | Habitudes de feu, focus d'effort, piliers corporels |
| **Lueur de Fond (Glow)** | `rgba(201, 162, 75, 0.12)` | `rgba(158, 120, 40, 0.08)` | Halo discret derrière les scores ou jauges |

---

### 2.4 Indicateurs Sémantiques (Bio-Status)

| Statut | Dark Mode | Light Mode | Signification |
|--------|-----------|------------|---------------|
| **Bio-Optimale (Succès)** | `#34d399` (`hsl(158 64% 52%)`) | `#15803d` (`hsl(142 71% 29%)`) | Cohérence haute, habitude complétée, équilibre |
| **Bio-Alerte (Warning)** | `#f59e0b` (`hsl(38 92% 56%)`) | `#b45309` (`hsl(38 92% 37%)`) | Décision différée, tension, vigilance sommeil |
| **Bio-Critique (Danger)** | `#ef4444` (`hsl(0 72% 56%)`) | `#b91c1c` (`hsl(0 72% 42%)`) | Rupture de routine, stress aigu, action requise |
| **Bio-Cognitif (Info)** | `#3b82f6` (`hsl(217 91% 60%)`) | `#1d4ed8` (`hsl(217 91% 48%)`) | Données neutres, deep dive, archétypes |

---

## 3. Système Typographique Quadruple

Le système typographique combine quatre voix complémentaires :

| Famille | Classe Tailwind | Rôle & Usage | Caractéristiques |
|---------|-----------------|--------------|------------------|
| **Cinzel** | `font-cinzel` | **Kickers impériaux, grades, badges, titres archétypaux solennels** | Majuscules lapidaires romaines, prestige, autorité |
| **Cormorant Garamond** | `font-cormorant` | **Grands titres H1 de page, phrases de sagesse, citations** | Poétique, fin (`font-light`), haute couture |
| **Barlow** | `font-sans` / `font-barlow` | **Interface, corps de texte, labels, boutons, formulaires** | Lisibilité absolue, géométrie technique |
| **DM Mono** | `font-mono` | **Métriques, pourcentages, chronomètres, scores, timestamps** | Précision d'instrument scientifique, `tabular-nums` |

### Exemple de Composition d'En-tête Universel v2

```tsx
<header className="space-y-2 pb-3">
  {/* Kicker impérial en Cinzel */}
  <p className="font-cinzel text-[11px] font-semibold tracking-[0.24em] uppercase text-[#c9a24b] dark:text-[#c9a24b] text-[#9e7828]">
    ARCHE NO. 07 · INTELLIGENCE ÉMOTIONNELLE
  </p>
  
  {/* Titre littéraire en Cormorant Garamond */}
  <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-[#141412] dark:text-[#e9e4d8] tracking-tight">
    Fréquence & Bio-Équilibre
  </h1>
  
  {/* Sous-titre descriptif en Barlow */}
  <p className="font-sans text-sm text-[#615d54] dark:text-[#9a968b] max-w-2xl leading-relaxed">
    Mesure en temps réel de votre clarté mentale et de votre charge physiologique.
  </p>
</header>
```

---

## 4. Composants & Primitives UI

### 4.1 Tuile Bento v2 (Remplacement universel de `.glass-card`)

```tsx
// Dark Mode: fond basalte #161614, bordure ivoire 8%, ombre d'ancrage
// Light Mode: fond craie #ffffff, bordure basalte 8%, ombre douce ivoire
<div className={cn(
  "rounded-2xl p-5 sm:p-6 transition-all duration-200",
  "border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
  "dark:border-[#e9e4d8]/[0.08] dark:bg-[#161614] dark:shadow-[0_4px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(233,228,216,0.05)]",
  "hover:border-[#9e7828]/30 dark:hover:border-[#c9a24b]/25",
  className
)}>
  {children}
</div>
```

### 4.2 Bouton Solaire Or (Action Primaire)

```tsx
<button className={cn(
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-cinzel text-[11px] font-bold tracking-[0.16em] uppercase transition-all duration-200",
  // Dark Mode: fond or dégradé éclatant, texte obsidienne
  "dark:bg-gradient-to-r dark:from-[#c9a24b] dark:to-[#a67f2e] dark:text-[#0b0b0a] dark:shadow-[0_2px_16px_rgba(201,162,75,0.28)] dark:hover:brightness-110",
  // Light Mode: fond or ambré soutenu (contraste WCAG), texte blanc pur
  "bg-gradient-to-r from-[#9e7828] to-[#82611e] text-white shadow-[0_2px_12px_rgba(158,120,40,0.22)] hover:brightness-105",
  "active:scale-[0.98] cursor-pointer"
)}>
  {children}
</button>
```

### 4.3 Bouton Minéral (Action Secondaire)

```tsx
<button className={cn(
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-medium tracking-[0.06em] transition-all duration-200",
  // Dark Mode
  "dark:bg-[#1e1e1c] dark:border dark:border-[#e9e4d8]/12 dark:text-[#e9e4d8] dark:hover:bg-[#262623] dark:hover:border-[#e9e4d8]/25",
  // Light Mode
  "bg-[#f0ece1] border border-black/[0.08] text-[#141412] hover:bg-[#e7e2d5] hover:border-black/15",
  "active:scale-[0.98] cursor-pointer"
)}>
  {children}
</button>
```

### 4.4 Puces & Filtres (Bento Chips)

- **Inactif** :
  - Dark : fond `#161614`, bordure `#e9e4d8`/10%, texte `#9a968b`.
  - Light : fond `#f5f2eb`, bordure `black`/8%, texte `#615d54`.
- **Actif** :
  - Dark : fond `#e9e4d8`, texte `#0b0b0a`, halo `0 0 0 1px #e9e4d8`.
  - Light : fond `#141412`, texte `#ffffff`, halo `0 0 0 1px #141412`.

---

## 5. Synthèse des Écrans

| Page | Format | Traits Majeurs DA |
|------|--------|-------------------|
| **/dashboard** | Full-Bleed | Référence originale : Silhouette Bio-Executive, Or Solaire, Bento titane. |
| **/capture** | Scaffold `default` | Kicker Cinzel, H1 Cormorant, grille Bento avec icônes en or solaire. |
| **/mood** | Scaffold `default` | Sliders radiaux or/ambre/nuit, histogramme aux couleurs basalte & émeraude. |
| **/decisions** | Scaffold `default` | Onglets Cinzel, cartes bento avec badges de statut ambre/or/émeraude. |
| **/journal** | Scaffold `default` | Éditeur de pensée sur fond basalte, puces tags Cinzel/Barlow épurées. |
| **/habits** | Scaffold `default` | Cases à cocher solaires, métriques DM Mono, barres fines d'avancement. |
| **/toolbox** | Scaffold `default` | Tuiles d'exercices haute précision, lancements immersifs sans débordement. |
| **/pratiques** | Full-Bleed | Présence rituelle, halos d'or, navigation bento fluide. |
| **/pulse** | Full-Bleed | Deck de cartes minérales, glyphes archétypaux dorés, constellation sobre. |
| **/bibliotheque** | Scaffold `wide` | Lecteur vidéo enchâssé dans du titane, chapitrage typographié avec rigueur. |
| **/persona** | Full-Bleed | Portrait impérial, lueur ambrée, verres sombres aux reflets d'ivoire. |
| **/people** | Scaffold `wide` | Réseau relationnel bento, barre d'action surélevée avec accents or/émeraude. |
| **/analytics** | Scaffold `wide` | Graphiques unifiés : Or solaire, Émeraude bio, Saphir cognitif, Basalte. |
| **/settings** | Scaffold `narrow` | Sécurité et préférences en tuiles bento avec toggles or solaire. |
