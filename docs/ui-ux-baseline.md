# UI/UX baseline — parcours utilisateur (Neural Aegis Suite)

Capturé lors de l’implémentation du plan d’audit (référence « avant » pour régressions).

## Parcours critiques

| Parcours | Route | Viewports à vérifier |
|----------|-------|----------------------|
| Welcome / tour | `/welcome` | 375, 768 |
| Dashboard mobile | `/dashboard` | 375, 1024 |
| Toolbox session | `/toolbox` + session nebula | 375 |
| Pulse | `/pulse` | 375, 768 |
| Meditation | `/meditation`, session | 375 |
| Auth (public) | `/auth` | 375, light + dark |

## Checklist manuelle (pré-amélioration)

- [ ] Lighthouse Accessibility ≥ 90 sur Dashboard mobile (dark)
- [ ] axe DevTools : 0 violations critiques sur Pulse + Dialog
- [ ] Pas de scroll horizontal à 375px
- [ ] Contrôles primaires ≥ 44×44px
- [ ] `prefers-reduced-motion` : animations CSS réduites (Framer à valider post-hook)

## Outils recommandés

```bash
npm run dev
# Chrome DevTools → Lighthouse (Mobile, Accessibility)
# axe DevTools extension sur /pulse et modale Houses72
```

## Notes techniques identifiées

- Racine typo 14px ; nombreux `text-[10px]` / `text-[11px]`
- Double dialecte `text-foreground` vs `text-text-primary`
- Onboarding 9 étapes + modales Houses72 puis Pulse
- `html lang` fixe `en` dans index.html
