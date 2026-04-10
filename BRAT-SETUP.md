# BRAT setup for Mind Note Map

This package is prepared for GitHub + BRAT.

## Files required by BRAT release
- `manifest.json`
- `main.js`
- `styles.css`
- `versions.json`

## Fastest path
1. Create a **public** GitHub repository.
2. Upload all files from this package to the **repo root**.
3. Commit.
4. Create a GitHub release with tag `0.1.0` or `v0.1.0`.
5. Attach these 4 files to the release:
   - `manifest.json`
   - `main.js`
   - `styles.css`
   - `versions.json`
6. On Obsidian mobile, install **BRAT**.
7. In BRAT, choose **Add Beta Plugin**.
8. Paste your GitHub repo URL.
9. Install, then enable **Mind Note Map** in Community Plugins.

## Notes
- Repo folder name does **not** matter for BRAT. Plugin identity comes from `manifest.json` id: `mind-note-map`.
- For manual install, the folder inside `.obsidian/plugins/` must be exactly `mind-note-map`.
- If BRAT says files are missing, the release assets are incomplete or attached under the wrong filenames.
