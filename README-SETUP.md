# AK Developer Hub — GitHub Pages

A static interactive portfolio for `sohamkirar`.

## Deploy
1. Create a public repository named `ak-developer-hub`.
2. Upload all files and folders in this package to the repository root.
3. In Settings → Pages, set Source to **GitHub Actions**.
4. Commit to `main`. The `Deploy AK Developer Hub to GitHub Pages` workflow deploys automatically.
5. Open `https://sohamkirar.github.io/ak-developer-hub/`.

## Data and privacy
- The dashboard reads public GitHub data from the unauthenticated GitHub REST API.
- No personal access token or secret is required.
- Unauthenticated REST API requests are rate-limited; the site caches responses in the visitor's browser for 10 minutes.
- The activity feed only shows recent public events. It is not a complete contribution count.
- Project cards are showcase entries. They link to a matching public repository if one exists; otherwise they link to the public repositories list.
- Edit `app.js` to change the featured project names, descriptions and matching repository keywords.
