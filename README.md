# The Arena

Disc golf throwing game by Awed by Design. Single file web app (`index.html`) with a service worker, served by Netlify at https://discgolfarena.netlify.app and wrapped for Google Play (package `com.awedbydesign.arena`).

- `index.html` the whole app. `APP_VERSION` near the top of the script must match `CACHE` in `sw.js` on every release.
- `netlify/functions/pdga.js` PDGA rating lookup (pdga.com blocks most server fetches; players can type a rating).
- `.well-known/assetlinks.json` ties the Play Store app to this site. Do not remove.
- `privacy.html` privacy policy linked from the Play listing.
- Lobbies: Firebase project `arena-b3462`. Accounts, results, throws, leaderboards: Supabase (`arena_results`, `arena_throws`, `arenas`). SQL for new tables lives outside this repo in `Arena/supabase/`.

Every push to `main` deploys to production through Netlify.
