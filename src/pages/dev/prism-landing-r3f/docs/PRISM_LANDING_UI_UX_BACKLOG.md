# Prism landing R3F — backlog UI/UX

Référence Hubtown (`exports/diagnostics/hubtown-ref/`) + captures `exports/diagnostics/prism-landing-brainstorm/`.

## Ambiance 3D (par beat) — fait / suite

| Beat | Label | Hold ambiance (code) | Pistes visuelles restantes |
|------|--------|----------------------|----------------------------|
| 0 | CORE | Fog froid, bloom modéré, N8AO, émission fente basse | Burst cube plus lisible ; ruban 2D / particules latérales |
| 1 | IGNITION | Fog argenté, godrays cube++, HUD ciné | Audio stinger ; micro-shake caméra optionnel |
| 2 | MARBLE | Chaud bas, godrays marbre, grade | Texture marbre plus contrastée ; poussière volumétrique (drei) |
| 3 | CONVERGE | Fog orange dense, emit++, travel scale | Silhouette marbre vs fente plus distincte |
| 4 | PORTAL | Fente axe, slit emitter++, bloom | Éviter répétition visuelle vs 3 (cadrage / lumière latérale) |
| 5 | LEGACY | Horizon large, soleil hall, godrays adoucis | CTA réel (route produit) ; pas de NEXT |

Fichiers : `prismR3fLandingAtmosphere.ts`, `PrismR3fLandingTravelAtmosphere.tsx`, `prismR3fLandingBeats.ts` (`scenePatch`), `prismR3fLanding.css` (`data-beat`).

---

## Navigation & rythme

- **Indicateur de chapitre** : `01 / 06` ou barre de progression liée au temps Theatre (pas seulement PREV/NEXT).
- **Wheel** : cooldown + hint « scroll » au premier beat ; `prefers-reduced-motion` → désactiver auto-travel scale / bloom peak.
- **PREV** : conserver snap caméra ; option fade HUD plus court que NEXT.
- **Deep link** : `?chapter=3` pour QA et partage.
- **Clavier** : flèches / PageDown alignés sur wheel (focus trap dans le menu seulement).

## HUD & chrome

- **LOGIN / MENU** : états hover/focus visibles ; menu avec ancres réelles ou routes app.
- **CTA** : brancher `goNext` ou URL métier ; beat 5 CTA non cliquable → bouton primaire distinct.
- **Mode ciné (beats 1 & 3)** : option sous-titre une ligne au lieu de body ; timer discret avant réapparition du texte.
- **Transition** : classe `--travel` (opacité hero) — étendre au label chapitre + compteur.
- **Sound** : brancher ambiant par beat (CORE froid, CONVERGE chaleur) ; mute persistant `localStorage`.
- **Frame** : coins animés au changement de beat (CSS ou Lottie léger).

## Loader & perf

- **Loader** : couleur dérivée du beat 0 ; transition cross-fade vers scène (pas cut sec à 100 %).
- **LCP** : poster image ou blurhash pendant WebGL init.
- **Mobile** : HUD empilé (déjà partiel) ; godrays density cap via `matchMedia`.

## Accessibilité

- Annonces `aria-live` sur changement de chapitre (titre + index).
- Contraste texte sur teintes orange (beats 3–4).
- Pause animations 3D si `prefers-reduced-motion`.

## Contenu & story

- Copie par beat alignée Hubtown (court hero, long body seulement holds « full »).
- **Beat 4 vs 5** : différencier narrativement (PORTAL = engagement, LEGACY = vision) pour justifier deux cadrages fente.

## Outils dev

- `?debug=1` : lien lab (existant) + overlay beat id / fog values.
- Regénérer PNG brainstorm après chaque passe ambiance : script Playwright existant ou manuel `/prism?chapter=n`.
