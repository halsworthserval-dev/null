# PCU ShuttleNav

Organized GitHub-ready structure for the PCU ShuttleNav Supabase/Leaflet application.

## Structure

```text
pcu-shuttle-nav/
├── index.html
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/js/
    ├── config.js
    ├── state.js
    ├── utils.js
    ├── auth.js
    ├── session.js
    ├── logout.js
    ├── profile.js
    ├── map.js
    ├── gps.js
    ├── data-routes.js
    ├── data-shuttles.js
    ├── filters.js
    ├── realtime.js
    ├── markers.js
    ├── geo.js
    ├── nearest.js
    ├── search.js
    ├── routes.js
    ├── schedule.js
    ├── tabs.js
    ├── driver-mode.js
    ├── driver-gps.js
    ├── driver-stop.js
    ├── driver-seats.js
    ├── main.js
    └── legacy-source.js
```

## Notes

The uploaded source was a single JavaScript `<script>` block. It did not include the full HTML/CSS, so `index.html` is an integration shell rather than a reconstruction of the UI.

The JavaScript was separated by feature: authentication, map/GPS, data, realtime, shuttle UI, routes/schedule, navigation, and driver mode.

`legacy-source.js` preserves the original uploaded code as a reference during migration.

## Supabase setup

Copy `.env.example` to `.env` and provide the public Supabase URL/key. Do not commit private/service-role credentials.

Required tables referenced by the source include `profiles`, `routes`, `stops`, and `shuttles`.

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Push to GitHub

```bash
git init
git add .
git commit -m "Organize PCU ShuttleNav into modules"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```
