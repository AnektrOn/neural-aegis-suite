# Conserver les dossiers Drive dans ElevenLabs

## Résultat
La synchronisation recréera de vrais dossiers ElevenLabs avec les mêmes noms et la même arborescence que le dossier Drive de chaque utilisateur. Les fichiers conserveront leurs noms et seront placés dans leurs dossiers respectifs.

ElevenLabs prend bien en charge les dossiers imbriqués via son API officielle. La synchronisation actuelle parcourt les sous-dossiers Drive mais envoie tous les documents à plat : cette partie sera corrigée.

## Changements
- Créer une arborescence distincte pour chaque utilisateur, sans mélanger les documents des agents.
- Conserver les noms de dossiers, même lorsque les noms de fichiers varient d’un utilisateur à l’autre.
- Réutiliser les dossiers déjà créés lors des synchronisations suivantes pour éviter les doublons.
- Reclasser les documents précédemment synchronisés, y compris ceux dont le contenu n’a pas changé, sans les réenvoyer inutilement.
- Garder la synchronisation par petits lots et afficher le chemin complet de chaque fichier dans les résultats.
- Conserver le périmètre actuel des fichiers Markdown ; ne pas ajouter automatiquement les JSON, dessins ou fichiers de test.

## Détails techniques
- Conserver les relations parent/enfant pendant le parcours Drive, y compris les dossiers vides.
- Enregistrer une correspondance persistante entre utilisateur, agent, dossier Drive et dossier ElevenLabs ; protéger ces correspondances par les permissions admin existantes.
- Créer les dossiers parent avant leurs enfants avec `POST /v1/convai/knowledge-base/folder` et `parent_folder_id`.
- Placer les nouveaux documents avec `parent_folder_id` sur l’endpoint texte ; déplacer les documents existants avec l’endpoint `move`.
- Conserver l’attachement individuel des documents à l’agent et l’activation RAG existante. Les dossiers organisent les documents ; ils ne remplacent pas les contrôles d’accès.

## Vérification
- Tests sur l’arborescence, les noms identiques dans plusieurs dossiers, l’isolation des utilisateurs et la réutilisation sans doublons.
- Vérifier un petit lot réel sur l’agent sélectionné, puis relire les dossiers et documents dans ElevenLabs.
- Republier la fonction de synchronisation après validation ; ne pas lancer un envoi complet de tous les utilisateurs.