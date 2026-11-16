# BibleQuiz.com

## Website bugs span two repos — check both before fixing

This repo is only the UI (Astro + React). The data it shows, and defaults such as match rules, come from the API in `biblequiz/ModernApps` (`Web/Registration.Web/Controllers/`). For any bug or request seen on biblequiz.com (wrong defaults, wrong values on a screen, a button that does the wrong thing, a form that won't save), look in **both** repos before writing a fix:

1. Start from the screen the user describes (their URL or click path) and find the component here. See which API field it reads and what it passes to child components.
2. Then check the ModernApps side that produces that field (`gh search code --repo biblequiz/ModernApps <term>` works without a clone).
3. Fix at the real fault, and prefer the smallest change. Check that this UI passes the right data before assuming the backend is wrong (e.g. the team division editor once passed `DefaultIndividualRules` for team divisions, which no backend change could fix).

If the fix needs both repos, open paired PRs and link them. The only PR check is `build` (`.github/workflows/build.yml`: `npm ci` and `npm run build`, on every pull request to `main`, drafts included), and deploys come from `main`. So say in the PR what was and wasn't tested, and run `npm install && npm run check` locally (see `DEVELOPMENT.md`).

## The service types are a contract with ModernApps

`src/types/services/*Service.ts` and `src/types/services/models/` mirror the ModernApps controllers and their models (e.g. `ChurchesService` calls `/api/Churches`, served by `ChurchesController`). A change to a route, parameter or field on either side needs the matching change in the other repo, as paired PRs.

## Merging is deploying

The site is hosted on Cloudflare Pages, which builds and deploys `main`. Unlike ModernApps, there is no batched release here, and a bot (`bible-quiz-bot`) also commits data to `main` every few hours. So agents must not merge PRs or push to `main` unless asked; that is a deployment. A fix is live once it merges and Cloudflare finishes the build.

## Errors on the 500 page never reach Application Insights

Deployed builds send global `window.error` and `unhandledrejection` exceptions to Application Insights (`src/utils/setupGlobalNotificationManager.ts`). But an exception that react-router catches is shown as the "500 - Internal Error" page (`src/components/apps/ErrorPage.tsx`) and is never sent to Application Insights. Debug those in the browser (console, a local `npm run dev` repro), not in API telemetry.
