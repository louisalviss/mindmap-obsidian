# Mind Note Map

MindNode-style Obsidian plugin MVP with note-backed nodes.

UI version shown inside the plugin: `v0.1.0`
Plugin id: `mind-note-map`
Minimum Obsidian version: `1.5.0`

## What this MVP does
- Custom mind map view inside Obsidian
- Drag nodes
- Pan and zoom
- Add child and sibling nodes
- Inline rename
- Create/open a Markdown note from a node
- Link selected node to the active note
- Auto-layout the tree
- Save map state in plugin data

## Important limitation
This MVP stores the map layout in plugin data, not as a `.canvas` file yet.

## Commands
- Open mind map
- Add child to selected node
- Add sibling to selected node
- Open or create note for selected node
- Link selected node to active note
- Auto layout active map
- Center on root
- Reset active map

## Manual install
1. Open your vault folder.
2. Go to `.obsidian/plugins/`.
3. Create a folder named `mind-note-map`.
4. Copy `manifest.json`, `main.js`, and `styles.css` into that folder.
5. In Obsidian, open **Settings > Community plugins**.
6. Turn on Community plugins.
7. Enable **Mind Note Map**.
8. Run command: **Open mind map**.

## BRAT install
See `BRAT-SETUP.md`.
