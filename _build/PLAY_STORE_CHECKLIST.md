# SAARTI – Google Play Console checklist

## URLs to paste into Play Console

| Play Console field | Value |
| --- | --- |
| Privacy policy (App content > Privacy policy) | https://saarti.in/privacy-policy.html |
| Account deletion URL (App content > Data safety > Data deletion) | https://saarti.in/delete-account.html |
| Support email (Store settings > Store listing contact details) | support@saarti.in |
| Website (Store listing contact details) | https://saarti.in/ |

## Before launch

1. In the app, fill `BACKUP_RETENTION_TEXT` in `constants/appInfo.ts` (it still says `[TO BE FILLED]`).
2. Have a lawyer review the Privacy Notice and Terms in `constants/legalText.ts` (the file says this is required).
3. Check `CIBIL_DOWNLOAD_URL` and `CIBIL_DISPUTE_URL` in `constants/appInfo.ts` open the right CIBIL pages.
4. Run the final website build from the WEBSITE folder: `node _build/build-site.js` (no `--preview`). It stops if `[TO BE FILLED]` is still in any text.
5. Publish the website and open these on a phone: privacy-policy.html, delete-account.html, faq.html, contact.html.
6. Check that support@saarti.in and grievance@saarti.in receive email.
7. Make sure the Data safety form matches the Privacy Notice: account data, profile, financial info typed in, CIBIL PDF sent to Google Gemini (may be processed outside India), data encrypted in transit, user can request deletion.
8. When the app is live, put its Play Store link in `PLAY_STORE_URL` in `_build/site-content.js` and run the final build again. The button changes from "Coming soon on Google Play" to "Get it on Google Play".
