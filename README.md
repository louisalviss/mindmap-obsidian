# Mind Note Map

Obsidian plugin MVP: mind-map view with note-backed nodes.

## Files that matter to Obsidian / BRAT
- `manifest.json`
- `main.js`
- `styles.css`
- `versions.json`

## What was blocking BRAT
BRAT does **not** install this from repo files alone in your current flow.
It needs a GitHub **Release** whose tag matches `manifest.json.version`, and that release must expose `manifest.json`, `main.js`, and `styles.css` as release assets.

## Fast path
1. Upload all files in this zip to the root of a public GitHub repo.
2. Go to **Releases** and create tag **`0.1.0`**.
3. Publish the release.
4. Attach these files to the release:
   - `manifest.json`
   - `main.js`
   - `styles.css`
   - `versions.json`
5. In BRAT, add the repo URL.

## Easier path with GitHub Actions
This zip includes `.github/workflows/release.yml`.
After uploading the repo, do this:
1. Open GitHub repo → **Actions** → enable workflows if asked.
2. Create a tag named **`0.1.0`** and push it, or create it in the GitHub web UI.
3. The workflow will automatically create a GitHub Release and upload:
   - `manifest.json`
   - `main.js`
   - `styles.css`
   - `versions.json`
4. Then install from BRAT.

## Plugin id
`mind-note-map`
