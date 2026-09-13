# UI/UX QA checklist — parcours utilisateur

À valider avant release (ui-ux-pro-max + plan audit).

## Responsive

- [ ] 375px — pas de scroll horizontal (Welcome, Dashboard, Pulse, Toolbox, Journal)
- [ ] 768px — layout tablette cohérent
- [ ] 1024px — desktop sidebar + contenu

## Thèmes

- [ ] Dark — contraste texte principal ≥ 4.5:1
- [ ] Light — cartes glass / bordures visibles (Auth, Dashboard)

## Accessibilité

- [ ] Focus visible sur liens et boutons custom
- [ ] Cibles tactiles ≥ 44×44 sur actions primaires
- [ ] `document.documentElement.lang` suit FR/EN
- [ ] Journal humeur : `aria-pressed` + labels

## Motion

- [ ] `prefers-reduced-motion` : onboarding sans scale, Guardian captions instantanés, btn-neural sans shimmer

## Onboarding

- [ ] Tour 4 étapes + Skip visible
- [ ] Modales Houses72 puis Pulse (Welcome)

## Chargement

- [ ] Journal / Toolbox / Meditation : skeleton ou spinner > 300ms
- [ ] Journal save : bouton désactivé + spinner

## Z-index

- [ ] Dock, notifications, modales : pas de contenu masqué (voir `src/lib/zIndex.ts`)
