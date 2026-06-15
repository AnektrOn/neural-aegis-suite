# Pipeline release Android — Neural Aegis

Mise en place du système complet de distribution APK sideload : DB, storage, edge function, page admin, page install, tracking d'adoption.

## 1. Migration DB

Nouvelle migration créant :

**Tables** (chacune avec GRANT + RLS + policies admin/user) :
- `app_releases` : version_code/name, apk_storage_path, apk_public_url, release_notes, force_update, min_version_code, is_published, sha256, file_size_bytes, created_by, published_at
- `user_app_versions` : user_id, platform, version_code/name, device_id, reported_at (unique user_id+platform pour upsert)
- `app_update_events` : user_id, release_id, event_type, version_code, metadata

**RLS** :
- `app_releases` : SELECT public sur `is_published=true`, ALL pour admin
- `user_app_versions` : user upsert/select own, admin select all
- `app_update_events` : user insert/select own, admin select all

**RPC `publish_app_release(p_release_id uuid)`** (SECURITY DEFINER, admin only) :
- dépublie tout sur la même plateforme
- marque la cible publiée + `published_at = now()`
- retourne la ligne JSON

## 2. Storage

- Bucket `app-releases` **public** (lecture libre — APK + latest.json)
- Policy upload/update/delete réservée aux admins via `has_role(auth.uid(),'admin')`

## 3. Edge function `publish-app-release`

`supabase/functions/publish-app-release/index.ts` :
- vérifie JWT + rôle admin via service_role
- appelle `publish_app_release` RPC
- regénère `latest.json` à partir de la release publiée et l'upload dans le bucket via service role (upsert)
- retourne `{ ok, manifestUrl, versionCode, versionName }`

## 4. Service client `appReleasesService.ts`

Helpers typés :
- `listReleases()` (admin)
- `createReleaseDraft(input)` → insert ligne brouillon
- `uploadApk(file, versionName)` → upload Storage + calcul sha256 (Web Crypto) + taille
- `publishRelease(id)` → invoke edge function
- `getPublishedRelease()` → SELECT public
- `reportInstalledVersion({versionCode,versionName,deviceId})` → upsert user_app_versions + insert event `report_version`
- `logUpdateEvent(event)` → insert dans `app_update_events`
- `getAdoptionStats()` → agrégats par version_code pour dashboard admin

## 5. Page admin `/admin/mobile-releases`

Style ethereal-glass cohérent (NeuralCard / dashboard-panel) :
- **Liste releases** : table avec badge LIVE, version_name/code, taille, date, sha256 tronqué
- **Créer release** : modal — version_code, version_name, release_notes (textarea), force_update (switch), min_version_code, dropzone APK
- **Publier** : bouton avec confirmation, désactivé si pas d'APK
- **Section distribuer** par release publiée : copy `apk_public_url`, copy lien `/install-android`, bouton "Notifier les utilisateurs" (call `send-push` existant avec payload `{type:'app_update'}`)
- **Tracking dashboard** : KPI total/à jour/en retard/inconnus + table users (email, version installée, jours de retard) + filtre par version
- Route ajoutée dans `App.tsx` sous protection admin
- Lien dans `adminNavConfig.ts` / AdminOverview

## 6. Page publique `/install-android`

- Layout léger (visitor/newsletter)
- Affiche dernière version publiée + release notes (markdown léger)
- Bouton "Télécharger l'APK" → `apk_public_url`
- Instructions sources inconnues (3 étapes)
- QR code (via lib `qrcode.react` déjà ou inline SVG simple) pointant vers la page elle-même
- Route publique dans `App.tsx`

## 7. Intégration client (Android natif)

`src/hooks/useAndroidVersionReporter.ts` :
- au mount, si `Capacitor.isNativePlatform()` + platform=android
- récupère `App.getInfo()` + device_id (Capacitor `Device.getId()` ou UUID localStorage fallback)
- appelle `reportInstalledVersion`

Branché dans `App.tsx` (au-dessus du Router, à l'intérieur de AuthProvider) — uniquement quand un user est connecté.

Pour le code Cursor existant (`useAppUpdate`, `AppUpdatePrompt`, `ApkInstaller`) : ajouter de petits hooks d'événements (`logUpdateEvent`) déclenchés depuis ces composants — wrapper exporté `trackUpdateEvent(type, releaseId?, versionCode?)` à appeler. Si les fichiers existent déjà, ajouter les appels ; sinon laisser les helpers prêts à brancher et noter dans la doc.

## 8. i18n

Ajouter clés FR/EN :
- `admin.mobileReleases.*` (title, columns, create, publish, distribute, tracking, kpi.*)
- `installAndroid.*` (title, subtitle, download, steps.1/2/3, upToDate, notes)

## 9. Env

Ajouter dans `.env.production.example` :
```
VITE_ANDROID_RELEASE_MANIFEST_URL=https://wjjugtdciljmuohxoqcj.supabase.co/storage/v1/object/public/app-releases/latest.json
```

## 10. Hors scope (à faire dans Cursor)

- Incrément `versionCode` dans `android/app/build.gradle`
- Build/sign APK
- Code natif `ApkInstallerPlugin` Java
- `useAppUpdate`/`AppUpdatePrompt` (déjà fait Cursor)

---

**Tu valides ce plan ? Une fois OK je crée la migration en premier (elle doit être approuvée séparément), puis le reste enchaîne.**