# Réparer Guardian sur tous les mobiles

## Objectif

Rendre la voix, l’animation « mouvement » et la progression Guardian fiables dans l’APK Android, les navigateurs Android et Safari iOS.

## Diagnostic confirmé

- Le bouton mobile « toucher pour démarrer » ne lance pas directement l’audio : il dépend actuellement de la propagation de l’événement vers un écouteur global.
- La nébuleuse est entièrement remontée à chaque changement de piste, ce qui recrée l’audio et son contexte après le geste utilisateur — un scénario fragile sur mobile, particulièrement iOS.
- L’animation réactive dépend de l’analyseur Web Audio. Quand l’audio joue sans analyseur disponible, Guardian peut parler sans produire le mouvement attendu.
- Une erreur de chargement audio est actuellement traitée comme une fin normale et peut faire avancer le parcours silencieusement.
- Les fichiers audio référencés existent bien et leurs noms correspondent aux fichiers présents.

## Changements

1. **Créer une commande audio mobile explicite**
   - Exposer depuis la nébuleuse une fonction de lecture/reprise.
   - Relier directement le bouton « toucher pour démarrer » à cette fonction, sans dépendre du bubbling d’un événement global.
   - Conserver la relance globale comme filet de sécurité seulement.

2. **Stabiliser le cycle audio**
   - Ne plus démonter toute la scène WebGL à chaque nouvelle piste.
   - Changer proprement la source du lecteur existant et réinitialiser son temps/état.
   - Reprendre le contexte audio lors d’un geste et lors du retour de l’application au premier plan.

3. **Garantir l’état mouvement**
   - Faire fonctionner le mouvement ambiant dès que la voix joue, même si l’analyseur Web Audio n’a pas pu être créé.
   - Utiliser l’analyseur uniquement pour enrichir la réaction aux fréquences, pas comme condition nécessaire à l’animation.
   - Garder le mode statique quand la voix est réellement arrêtée ou terminée.

4. **Séparer blocage, panne et fin de piste**
   - Distinguer l’autoplay bloqué d’une erreur réseau/décodage.
   - Ne faire progresser automatiquement Guardian que sur une vraie fin de piste.
   - Afficher une action explicite permettant de réessayer ou de continuer sans audio en cas de panne réelle.
   - Empêcher le délai de sécurité de faire avancer le parcours tant que l’audio attend encore un geste.

5. **Nettoyer l’ancienne implémentation**
   - Retirer le hook audio Guardian inutilisé afin d’éviter deux comportements mobiles concurrents.

## Validation

- Vérifier la sélection de langue → partie 1, puis les transitions vers les parties 2, 3 et 4.
- Tester : démarrage direct, autoplay refusé puis toucher, pause/reprise, mise en arrière-plan puis retour, et erreur de piste simulée.
- Contrôler que la voix, les sous-titres et le mouvement restent synchronisés.
- Tester en viewport mobile et dans le WebView Android ; documenter le test final à effectuer sur un vrai iPhone/Safari, dont les règles audio ne sont pas entièrement reproductibles dans Chromium.
