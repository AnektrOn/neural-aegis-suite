# AppSumo confirmation coverage

Rule: an activated AppSumo member gets confirmation, pending confirmation remains retryable, and retries never change access or repeat recorded sent notices.

| Place | Code review result |
|---|---|
| `/redeem` and `/appsumo` alias | Shared AppSumoRedemption; live retry previously checked at desktop/mobile. Added read-only persisted status on entry/reload. |
| Pricing | Same shared AppSumoRedemption; receives the same status/retry fix. |
| Settings | Same shared AppSumoRedemption; receives the same status/retry fix. |
| Signup/sign-in/AppSumo link | AuthPage retains redemption destination; signup confirmation is distinct from activation confirmation. No change needed. |
| Feature function initial activation | Calls atomic authenticated redeem_appsumo_code then resolves persisted caller activation; member-first SMTP and recorded delivery. |
| Feature function confirmation retry | Resolves caller activation without code and without modifying subscriptions; skips recorded sent notices. |
| Feature function status | New read-only caller status; does not send mail or update any record. Prevents sent state disappearing after reload or a different subscription winning access selection. |
| Database redeem_appsumo_code | Live definition read: caller lock, code lock, same-owner idempotent retry, Solo lifetime only. Contains no email sender; app code uses feature function for email. No change needed. |
| Member and admin templates/registry | Read: member-only welcome and trusted operator notices, distinct subjects; no alternate activation sender. |
| Shared SMTP sender/cleanup | Read: server-held credentials, safe cleanup does not mask accepted send or original failure. |
| Account-created background alerts | Read: separate protected account lifecycle alert with event/recipient ledger; does not control AppSumo member confirmation. Left unchanged. |
| Auth email hook | Read: managed signup/recovery/invite verification; no AppSumo activation dispatch. Left unchanged. |
| Email preview | Read: rendering only, no sending. Left unchanged. |
| Other scripts/services/functions | Search found no other AppSumo delivery call sites. |

No paid subscriptions, sent records, permissions, settings, or sample data are modified by this sweep. SQL cron internals could not be inspected; no AppSumo scheduled sender was found in project source. Fresh signup, fresh valid-code redemption, inbox delivery, and published frontend remain unverified. Earlier SMTP rate-limit explanation was not established by logs.
