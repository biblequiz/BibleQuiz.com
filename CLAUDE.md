# BibleQuiz.com

## Website bugs span two repos — check both before fixing

This repo is only the UI (Astro + React). The data it shows, and defaults such as match rules, come from the API in `biblequiz/ModernApps` (`Web/Registration.Web/Controllers/`). For any bug or request seen on biblequiz.com (wrong defaults, wrong values on a screen, a button that does the wrong thing, a form that won't save), look in **both** repos before writing a fix:

1. Start from the screen the user describes (their URL or click path) and find the component here. See which API field it reads and what it passes to child components.
2. Then check the ModernApps side that produces that field (`gh search code --repo biblequiz/ModernApps <term>` works without a clone).
3. Fix at the real fault, and prefer the smallest change. Check that this UI passes the right data before assuming the backend is wrong (e.g. the team division editor once passed `DefaultIndividualRules` for team divisions, which no backend change could fix).

If the fix needs both repos, open paired PRs and link them. There is no PR CI here and deploys come from `main`, so say in the PR what was and wasn't tested, and run `npm install && npm run check` locally (see `DEVELOPMENT.md`).
