const { Plugin, ItemView, Notice, WorkspaceLeaf } = require("obsidian");

const VIEW_TYPE = "mind-canvas-modular-view";
const PLUGIN_VERSION = "v1.7.0";
const CANVAS_CSS = ':host{\n      --bg:#08111a;\n      --bg2:#0c1826;\n      --panel:rgba(8,17,27,.88);\n      --panel2:rgba(11,23,36,.92);\n      --line:rgba(95,168,214,.72);\n      --lineActive:rgba(130,236,255,.98);\n      --text:#edf5ff;\n      --muted:#8ea8be;\n      --accent:#7eecff;\n      --accent2:#19c8f2;\n      --danger:#ff7f8f;\n      --grid:rgba(112,166,205,.09);\n      --shadow:0 16px 36px rgba(0,0,0,.30);\n      --radius:18px;\n      --node-w:170px;\n      --node-h:56px;\n      --safe-top:env(safe-area-inset-top);\n      --safe-bottom:env(safe-area-inset-bottom);\n      --safe-left:env(safe-area-inset-left);\n      --safe-right:env(safe-area-inset-right);\n    }\n    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\n    html,body{\n      margin:0;height:100%;overflow:hidden;\n      background:var(--bg);\n      color:var(--text);\n      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;\n    }\n    body{\n      background:\n        radial-gradient(circle at top, rgba(25,200,242,.10), transparent 28%),\n        linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);\n    }\n    .app{margin:0;height:100%;position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(circle at top, rgba(25,200,242,.10), transparent 28%), linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}\n    .topbar{\n      position:relative;z-index:40;\n      padding:calc(var(--safe-top) + 10px) calc(var(--safe-right) + 14px) 10px calc(var(--safe-left) + 14px);\n      background:linear-gradient(180deg, rgba(6,13,22,.97), rgba(6,13,22,.76));\n      border-bottom:1px solid rgba(255,255,255,.05);\n      backdrop-filter:blur(16px);\n    }\n    .top-row{display:flex;gap:10px;align-items:flex-start}\n    .title-wrap{min-width:0;flex:1}\n    .title{font-size:16px;font-weight:800;letter-spacing:.1px}\n    .meta{margin-top:3px;font-size:12px;color:var(--muted)}\n    .version{\n      flex:none;\n      padding:9px 12px;\n      border-radius:999px;\n      border:1px solid rgba(126,236,255,.14);\n      background:rgba(18,35,52,.86);\n      color:#b7fbff;\n      font-size:12px;font-weight:800;\n      white-space:nowrap;\n      box-shadow:0 10px 26px rgba(0,0,0,.18);\n    }\n    .status-row{\n      display:flex;gap:8px;margin-top:10px;overflow:auto hidden;scrollbar-width:none;\n    }\n    .status-row::-webkit-scrollbar{display:none}\n    .tiny{\n      flex:none;\n      padding:7px 10px;\n      border-radius:999px;\n      border:1px solid rgba(255,255,255,.06);\n      background:rgba(255,255,255,.03);\n      color:var(--muted);\n      font-size:12px;font-weight:700;\n      white-space:nowrap;\n    }\n\n    .workspace{position:relative;flex:1;min-height:0;overflow:hidden}\n    .viewport{\n      position:absolute;inset:0;overflow:hidden;\n      user-select:none;\n      background:\n        linear-gradient(var(--grid) 1px, transparent 1px),\n        linear-gradient(90deg, var(--grid) 1px, transparent 1px);\n      background-size:28px 28px, 28px 28px;\n      background-position:center;\n      touch-action:none;\n    }\n    .world{\n      position:absolute;left:0;top:0;width:4200px;height:4200px;\n      transform-origin:0 0;\n      will-change:transform;\n    }\n    canvas.edges{position:absolute;inset:0;width:4200px;height:4200px;pointer-events:none}\n    .nodes{position:absolute;inset:0}\n\n    .node{\n      position:absolute;\n      width:var(--node-w);\n      min-height:var(--node-h);\n      padding:12px 14px;\n      border-radius:18px;\n      display:flex;align-items:center;justify-content:center;\n      text-align:center;\n      color:var(--text);\n      font-size:14px;font-weight:800;line-height:1.22;\n      border:1px solid rgba(255,255,255,.09);\n      background:linear-gradient(180deg, rgba(16,33,51,.98), rgba(9,20,32,.98));\n      box-shadow:inset 0 0 0 1px rgba(126,236,255,.03), 0 14px 28px rgba(0,0,0,.22);\n      transition:border-color .12s ease, box-shadow .12s ease, transform .08s ease;\n      cursor:grab;\n      touch-action:none;\n    }\n    .node.root{\n      color:#06222d;\n      border-color:rgba(255,255,255,.22);\n      background:linear-gradient(180deg, #3ae1ff 0%, #16bbe5 100%);\n      box-shadow:0 16px 34px rgba(22,187,229,.24);\n    }\n    .node.selected{\n      border-color:rgba(126,236,255,.88);\n      box-shadow:0 0 0 2px rgba(126,236,255,.20), 0 18px 34px rgba(0,0,0,.26);\n    }\n    .node.dragging{\n      cursor:grabbing;\n      transform:scale(1.015);\n      box-shadow:0 0 0 2px rgba(126,236,255,.25), 0 22px 40px rgba(0,0,0,.30);\n    }\n    .node.drop-target{\n      border-color:rgba(126,236,255,.98);\n      box-shadow:0 0 0 3px rgba(126,236,255,.18), inset 0 0 0 1px rgba(126,236,255,.14), 0 22px 40px rgba(0,0,0,.30);\n    }\n    .node-text{\n      display:-webkit-box;\n      -webkit-box-orient:vertical;\n      -webkit-line-clamp:2;\n      overflow:hidden;\n      word-break:break-word;\n    }\n\n    .zoom-box{\n      position:absolute;right:12px;top:12px;z-index:31;\n      display:flex;flex-direction:column;gap:8px;\n    }\n    .zoom-btn{\n      width:44px;height:44px;border-radius:16px;\n      border:1px solid rgba(255,255,255,.08);\n      background:rgba(8,17,27,.84);\n      color:var(--text);\n      font-size:18px;font-weight:900;\n      box-shadow:var(--shadow);\n      backdrop-filter:blur(12px);\n    }\n\n    .toolbar{\n      position:absolute;left:10px;right:10px;bottom:calc(var(--safe-bottom) + 10px);\n      z-index:45;\n      padding:10px;\n      border-radius:24px;\n      border:1px solid rgba(255,255,255,.07);\n      background:rgba(7,14,23,.78);\n      box-shadow:var(--shadow);\n      backdrop-filter:blur(18px);\n      display:flex;flex-direction:column;gap:8px;\n    }\n    .toolbar-row{display:flex;gap:8px;align-items:center}\n    .actions-row .tool{min-width:0}\n    .bottom-row{align-items:center}\n    .tool{\n      flex:1 1 0;\n      min-height:46px;\n      padding:0 12px;\n      border-radius:16px;\n      border:1px solid rgba(255,255,255,.08);\n      background:linear-gradient(180deg, rgba(17,31,47,.98), rgba(9,18,30,.98));\n      color:var(--text);\n      font-size:15px;font-weight:800;\n      letter-spacing:.1px;\n      box-shadow:0 10px 22px rgba(0,0,0,.18);\n      white-space:nowrap;\n      overflow:hidden;\n      text-overflow:ellipsis;\n    }\n    .tool.primary{\n      background:linear-gradient(180deg, #43e6ff, #17bde7);\n      color:#06232d;\n      border-color:rgba(255,255,255,.18);\n      box-shadow:0 12px 28px rgba(23,189,231,.24);\n    }\n    .tool.warn{\n      color:#ffd6dc;\n      border-color:rgba(255,127,143,.28);\n      background:linear-gradient(180deg, rgba(35,18,25,.98), rgba(23,11,16,.98));\n    }\n    .tool.ghost{\n      flex:0 0 auto;\n      min-width:72px;\n      padding:0 14px;\n      background:rgba(255,255,255,.03);\n      color:var(--muted);\n    }\n    .util-btn{min-width:78px}\n    .segment{\n      flex:1 1 auto;\n      display:flex;\n      padding:4px;\n      border-radius:18px;\n      border:1px solid rgba(255,255,255,.07);\n      background:rgba(255,255,255,.03);\n      min-width:0;\n      box-shadow:inset 0 1px 0 rgba(255,255,255,.02);\n    }\n    .seg{\n      flex:1 1 0;\n      min-height:40px;\n      border:none;\n      border-radius:14px;\n      background:transparent;\n      color:var(--muted);\n      font-size:13px;\n      font-weight:800;\n      white-space:nowrap;\n      padding:0 10px;\n    }\n    .seg.active{\n      color:#06232d;\n      background:linear-gradient(180deg, #43e6ff, #17bde7);\n      box-shadow:0 10px 18px rgba(23,189,231,.22);\n    }\n    .layout-segment .seg{font-size:12px;padding:0 8px}\n\n    .log-panel{\n      position:absolute;left:10px;right:10px;bottom:calc(var(--safe-bottom) + 136px);\n      z-index:44;\n      border-radius:20px;\n      border:1px solid rgba(255,255,255,.08);\n      background:rgba(7,14,23,.90);\n      box-shadow:var(--shadow);\n      backdrop-filter:blur(16px);\n      overflow:hidden;\n      opacity:0;pointer-events:none;\n      transform:translateY(16px);\n      transition:opacity .16s ease, transform .16s ease;\n      max-height:min(38vh,320px);\n    }\n    .log-panel.open{opacity:1;pointer-events:auto;transform:translateY(0)}\n    .log-head{\n      display:flex;align-items:center;justify-content:space-between;gap:8px;\n      padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);font-weight:800;\n    }\n    .log-actions{display:flex;gap:8px}\n    .mini-btn{\n      min-height:36px;padding:0 12px;border-radius:12px;\n      border:1px solid rgba(255,255,255,.08);\n      background:rgba(255,255,255,.03);\n      color:var(--text);font-size:12px;font-weight:700;\n    }\n    .log-content{\n      padding:8px 14px 14px;overflow:auto;max-height:220px;\n      white-space:pre-wrap;word-break:break-word;\n      font-family:ui-monospace,SFMono-Regular,Menlo,monospace;\n      font-size:12px;line-height:1.45;color:#b9cde0;\n    }\n    .log-line{padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.04)}\n\n    .editor{\n      position:fixed;inset:0;z-index:80;\n      display:none;align-items:flex-end;\n      background:rgba(0,0,0,.34);\n      backdrop-filter:blur(3px);\n    }\n    .editor.open{display:flex}\n    .editor-sheet{\n      width:100%;\n      padding:14px calc(var(--safe-right) + 14px) calc(var(--safe-bottom) + 14px) calc(var(--safe-left) + 14px);\n      border-radius:24px 24px 0 0;\n      background:linear-gradient(180deg, rgba(12,22,35,.98), rgba(8,16,26,.98));\n      border-top:1px solid rgba(255,255,255,.07);\n      box-shadow:0 -16px 40px rgba(0,0,0,.28);\n    }\n    .editor-top{\n      display:flex;align-items:flex-start;justify-content:space-between;gap:10px;\n    }\n    .editor-label{font-size:12px;color:var(--muted);font-weight:700}\n    .editor-title{font-size:18px;font-weight:800;margin-top:4px}\n    .editor-node-chip{\n      flex:none;\n      max-width:42vw;\n      padding:8px 12px;\n      border-radius:999px;\n      border:1px solid rgba(126,236,255,.16);\n      background:rgba(18,35,52,.86);\n      color:#b7fbff;\n      font-size:12px;\n      font-weight:800;\n      white-space:nowrap;\n      overflow:hidden;\n      text-overflow:ellipsis;\n    }\n    .editor-area{\n      width:100%;min-height:132px;resize:none;\n      margin-top:14px;padding:16px 16px 18px;\n      border-radius:18px;\n      border:1px solid rgba(126,236,255,.10);\n      background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.025));\n      color:var(--text);\n      font:700 17px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;\n      outline:none;\n      box-shadow:inset 0 0 0 1px rgba(126,236,255,.02);\n    }\n    .editor-foot{\n      margin-top:14px;\n      display:flex;justify-content:space-between;align-items:center;gap:10px;\n    }\n    .count{font-size:12px;color:var(--muted)}\n    .editor-actions{display:flex;gap:8px}\n    .sheet-btn{\n      min-height:44px;padding:0 16px;border-radius:14px;\n      border:1px solid rgba(255,255,255,.08);\n      background:rgba(255,255,255,.03);\n      color:var(--text);font-size:14px;font-weight:800;\n    }\n    .sheet-btn.primary{\n      background:linear-gradient(180deg, #43e6ff, #17bde7);\n      color:#06232d;border-color:rgba(255,255,255,.16);\n      box-shadow:0 12px 26px rgba(23,189,231,.22);\n    }\n\n    @media (min-width: 860px){\n      .topbar{padding:14px 16px 12px}\n      .toolbar{left:16px;right:auto;width:620px}\n      .log-panel{left:16px;right:auto;width:560px}\n      .editor{align-items:center;justify-content:center}\n      .editor-sheet{\n        width:min(540px,calc(100vw - 32px));\n        border-radius:24px;\n        padding:16px;\n        border:1px solid rgba(255,255,255,.08);\n      }\n    }\n';
const CANVAS_HTML = '<div class="app">\n    <header class="topbar">\n      <div class="top-row">\n        <div class="title-wrap">\n          <div class="title">Mind Canvas Test</div>\n          <div class="meta">Source module hóa: viewport / tree / render / gesture / editor</div>\n        </div>\n        <div class="version">UI version v1.7.0</div>\n      </div>\n      <div class="status-row">\n        <div class="tiny" id="statusPill">Đã lưu</div>\n        <div class="tiny" id="nodeCountPill">0 node</div>\n        <div class="tiny" id="zoomPill">100%</div>\n        <div class="tiny" id="layoutModePill">Free canvas</div>\n        <div class="tiny" id="linkModePill">Dây cong</div>\n      </div>\n    </header>\n\n    <main class="workspace">\n      <div class="viewport" id="viewport">\n        <div class="zoom-box">\n          <button class="zoom-btn" id="zoomOutBtn" type="button">−</button>\n          <button class="zoom-btn" id="fitBtn" type="button">⊙</button>\n          <button class="zoom-btn" id="zoomInBtn" type="button">+</button>\n        </div>\n        <div class="world" id="world">\n          <canvas class="edges" id="edges" width="4200" height="4200"></canvas>\n          <div class="nodes" id="nodes"></div>\n        </div>\n      </div>\n\n      <section class="log-panel" id="logPanel">\n        <div class="log-head">\n          <div>Log</div>\n          <div class="log-actions">\n            <button class="mini-btn" id="copyLogBtn" type="button">Copy log all</button>\n            <button class="mini-btn" id="clearLogBtn" type="button">Xóa log</button>\n          </div>\n        </div>\n        <div class="log-content" id="logContent"></div>\n      </section>\n\n      <div class="toolbar">\n        <div class="toolbar-row actions-row">\n          <button class="tool primary" id="addChildBtn" type="button">+ Con</button>\n          <button class="tool" id="addSiblingBtn" type="button">+ Ngang</button>\n          <button class="tool" id="editBtn" type="button">Sửa</button>\n          <button class="tool warn" id="deleteBtn" type="button">Xóa</button>\n        </div>\n        <div class="toolbar-row bottom-row">\n          <div class="segment" role="tablist" aria-label="Kiểu dây">\n            <button class="seg active" id="curveModeBtn" type="button" aria-selected="true">Dây cong</button>\n            <button class="seg" id="orthModeBtn" type="button" aria-selected="false">Dây vuông</button>\n          </div>\n          <button class="tool ghost util-btn" id="toggleLogBtn" type="button">Log</button>\n          <button class="tool ghost util-btn" id="resetBtn" type="button">Reset</button>\n        </div>\n        <div class="toolbar-row bottom-row">\n          <div class="segment layout-segment" role="tablist" aria-label="Chế độ bố cục">\n            <button class="seg active" id="freeLayoutBtn" type="button" aria-selected="true">Free</button>\n            <button class="seg" id="autoLayoutBtn" type="button" aria-selected="false">Auto cây</button>\n            <button class="seg" id="diagramLayoutBtn" type="button" aria-selected="false">Diagram</button>\n          </div>\n          <button class="tool ghost util-btn" id="relayoutBtn" type="button">Xếp cây</button>\n        </div>\n      </div>\n    </main>\n  </div>\n\n  <div class="editor" id="editor">\n    <div class="editor-sheet">\n      <div class="editor-top">\n        <div>\n          <div class="editor-label">Sửa nội dung node</div>\n          <div class="editor-title">Text của node</div>\n        </div>\n        <div class="editor-node-chip" id="editorNodeChip">Node</div>\n      </div>\n      <textarea class="editor-area" id="editorArea" maxlength="120" placeholder="Nhập text cho node"></textarea>\n      <div class="editor-foot">\n        <div class="count" id="editorCount">0 / 120</div>\n        <div class="editor-actions">\n          <button class="sheet-btn" id="editorCancelBtn" type="button">Hủy</button>\n          <button class="sheet-btn primary" id="editorSaveBtn" type="button">Lưu</button>\n        </div>\n      </div>\n    </div>\n  </div>';

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function uid() {
  return 'n' + Math.random().toString(36).slice(2, 9);
}

function nowTime() {
  try {
    return new Date().toLocaleTimeString('vi-VN', { hour12: false });
  } catch (e) {
    return new Date().toISOString().slice(11, 19);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class MindCanvasModularView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.cleanupFns = [];
    this.saveTimer = null;
    this.services = null;
    this.hostEl = null;
    this.shadow = null;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Mind Canvas Modular"; }
  getIcon() { return "git-branch-plus"; }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("mind-canvas-modular-view-root");
    this.hostEl = this.contentEl.createDiv({ cls: "mc-host" });
    this.shadow = this.hostEl.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CANVAS_CSS;
    this.shadow.appendChild(style);
    const root = document.createElement("div");
    root.className = "mind-canvas-plugin-root";
    root.innerHTML = CANVAS_HTML;
    this.shadow.appendChild(root);
    await this.initialize(root);
  }

  async onClose() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    for (const fn of this.cleanupFns) {
      try { fn(); } catch (e) {}
    }
    this.cleanupFns = [];
    await this.flushSave();
  }

  async initialize(root) {
    const plugin = this.plugin;
    const NoticeSafe = (msg) => new Notice(msg, 1800);
    const Config = {
      VERSION: PLUGIN_VERSION,
      WORLD_SIZE: 4200,
      NODE_W: 170,
      NODE_H: 56,
      H_GAP: 230,
      V_GAP: 34,
      DIAGRAM_H_GAP: 30,
      DIAGRAM_V_GAP: 118,
      MIN_SCALE: 0.35,
      MAX_SCALE: 2.6,
      DOUBLE_TAP_MS: 320,
      TAP_MOVE: 8,
      FIT_PAD: 90,
    };
    const State = {
      nodes: {},
      selectedId: null,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      logs: [],
      pointer: null,
      pinch: null,
      lastTap: { id: null, t: 0 },
      editorId: null,
      linkMode: 'curve',
      layoutMode: 'free',
      dropTargetId: null,
    };
    const Dom = this.createDom(root);
    const Utils = {
      uid,
      nowTime,
      escapeHtml,
      clamp,
      clampScale(value) { return clamp(value, Config.MIN_SCALE, Config.MAX_SCALE); },
      touchDistance(t1, t2) { return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY); },
      touchCenter(t1, t2) { return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }; },
      getNodeElFromTarget(target) { return target && target.closest ? target.closest('.node') : null; },
      boxContainsPoint(box, x, y, pad = 0) {
        return x >= box.x - pad && x <= box.x + box.w + pad && y >= box.y - pad && y <= box.y + box.h + pad;
      },
      rectsOverlap(a, b, pad = 0) {
        return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x || a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
      },
    };
    const services = { plugin, view: this, Config, State, Dom, Utils };

    services.Tree = {
      defaultTree() {
        const rootId = uid();
        const a = uid(), b = uid(), c = uid();
        return {
          nodes: {
            [rootId]: { id: rootId, parentId: null, x: 860, y: 840, text: 'Ý chính' },
            [a]: { id: a, parentId: rootId, x: 1090, y: 710, text: 'Nhánh 1' },
            [b]: { id: b, parentId: rootId, x: 1090, y: 840, text: 'Nhánh 2' },
            [c]: { id: c, parentId: rootId, x: 1090, y: 970, text: 'Nhánh 3' },
          },
          selectedId: rootId,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          linkMode: 'curve',
          layoutMode: 'free',
          logs: [`[${nowTime()}] UI boot {"version":"${PLUGIN_VERSION}","runtime":"obsidian-plugin"}`],
        };
      },
      getNode(id) { return State.nodes[id] || null; },
      getRootId() { return Object.values(State.nodes).find(n => n.parentId === null)?.id || null; },
      getChildren(parentId) {
        return Object.values(State.nodes).filter(n => n.parentId === parentId).sort((a,b) => a.y - b.y || a.x - b.x);
      },
      collectDescendants(id, acc = new Set()) {
        acc.add(id);
        Object.values(State.nodes).forEach(n => { if (n.parentId === id && !acc.has(n.id)) this.collectDescendants(n.id, acc); });
        return acc;
      },
      bounds() {
        const items = Object.values(State.nodes);
        if (!items.length) return { minX:0,minY:0,maxX:0,maxY:0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        items.forEach(n => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + Config.NODE_W);
          maxY = Math.max(maxY, n.y + Config.NODE_H);
        });
        return { minX, minY, maxX, maxY };
      },
      subtreeHeight(id) {
        const children = this.getChildren(id);
        if (!children.length) return Config.NODE_H;
        let total = 0;
        children.forEach((child, idx) => {
          total += this.subtreeHeight(child.id);
          if (idx < children.length - 1) total += Config.V_GAP;
        });
        return Math.max(Config.NODE_H, total);
      },
      layoutSubtree(id, x, centerY) {
        const node = this.getNode(id);
        if (!node) return;
        node.x = x;
        node.y = Math.round(centerY - Config.NODE_H / 2);
        const children = this.getChildren(id);
        if (!children.length) return;
        const heights = children.map(c => this.subtreeHeight(c.id));
        const total = heights.reduce((a,b)=>a+b,0) + Math.max(0, children.length - 1) * Config.V_GAP;
        let currentTop = centerY - total / 2;
        children.forEach((child, idx) => {
          const h = heights[idx];
          this.layoutSubtree(child.id, x + Config.H_GAP, currentTop + h / 2);
          currentTop += h + Config.V_GAP;
        });
      },
      autoLayoutFromRoot() { const rootId = this.getRootId(); if (rootId) this.layoutSubtree(rootId, 860, 860); },
      subtreeWidth(id) {
        const children = this.getChildren(id);
        if (!children.length) return Config.NODE_W;
        let total = 0;
        children.forEach((child, idx) => { total += this.subtreeWidth(child.id); if (idx < children.length - 1) total += Config.DIAGRAM_H_GAP; });
        return Math.max(Config.NODE_W, total);
      },
      layoutDiagramSubtree(id, left, top) {
        const node = this.getNode(id); if (!node) return;
        const width = this.subtreeWidth(id);
        node.x = Math.round(left + width / 2 - Config.NODE_W / 2);
        node.y = Math.round(top);
        const children = this.getChildren(id);
        if (!children.length) return;
        let currentLeft = left;
        children.forEach((child) => {
          const childWidth = this.subtreeWidth(child.id);
          this.layoutDiagramSubtree(child.id, currentLeft, top + Config.DIAGRAM_V_GAP);
          currentLeft += childWidth + Config.DIAGRAM_H_GAP;
        });
      },
      autoLayoutDiagram() {
        const rootId = this.getRootId(); if (!rootId) return;
        const width = this.subtreeWidth(rootId);
        const left = Math.round(2100 - width / 2);
        this.layoutDiagramSubtree(rootId, left, 460);
      },
      moveSubtree(id, dx, dy) {
        this.collectDescendants(id).forEach(nodeId => {
          const node = this.getNode(nodeId); if (!node) return;
          node.x = Math.round(node.x + dx); node.y = Math.round(node.y + dy);
        });
      },
    };

    services.UI = {
      _statusTimer: null,
      updatePills() {
        Dom.nodeCountPill.textContent = `${Object.keys(State.nodes).length} node`;
        Dom.zoomPill.textContent = `${Math.round(State.scale * 100)}%`;
        Dom.layoutModePill.textContent = State.layoutMode === 'diagram' ? 'Diagram' : (State.layoutMode === 'auto' ? 'Auto cây' : 'Free canvas');
        Dom.linkModePill.textContent = State.linkMode === 'orth' ? 'Dây vuông' : 'Dây cong';
      },
      setStatus(text) {
        Dom.statusPill.textContent = text;
        if (this._statusTimer) clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => { Dom.statusPill.textContent = 'Đã lưu'; }, 1400);
      },
      syncModeButtons() {
        Dom.curveModeBtn.classList.toggle('active', State.linkMode === 'curve');
        Dom.orthModeBtn.classList.toggle('active', State.linkMode === 'orth');
        Dom.curveModeBtn.setAttribute('aria-selected', State.linkMode === 'curve' ? 'true' : 'false');
        Dom.orthModeBtn.setAttribute('aria-selected', State.linkMode === 'orth' ? 'true' : 'false');
      },
      syncLayoutButtons() {
        Dom.freeLayoutBtn.classList.toggle('active', State.layoutMode === 'free');
        Dom.autoLayoutBtn.classList.toggle('active', State.layoutMode === 'auto');
        Dom.diagramLayoutBtn.classList.toggle('active', State.layoutMode === 'diagram');
        Dom.freeLayoutBtn.setAttribute('aria-selected', State.layoutMode === 'free' ? 'true' : 'false');
        Dom.autoLayoutBtn.setAttribute('aria-selected', State.layoutMode === 'auto' ? 'true' : 'false');
        Dom.diagramLayoutBtn.setAttribute('aria-selected', State.layoutMode === 'diagram' ? 'true' : 'false');
      },
    };

    services.Logger = {
      add(text) {
        State.logs.unshift(`[${nowTime()}] ${text}`);
        State.logs = State.logs.slice(0, 300);
        this.render();
      },
      render() {
        Dom.logContent.innerHTML = State.logs.map(line => `<div class="log-line">${escapeHtml(line)}</div>`).join('');
      },
      async copyAll() {
        const text = State.logs.join('\n');
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
          else throw new Error('clipboard unavailable');
          services.UI.setStatus('Đã copy log');
        } catch (e) {
          NoticeSafe('Copy log không khả dụng trên thiết bị này');
        }
      },
      clear() {
        State.logs = [`[${nowTime()}] Xóa log`];
        this.render();
        services.Persist.save();
      },
    };

    services.Viewport = {
      applyTransform() {
        Dom.world.style.transform = `translate(${State.offsetX}px, ${State.offsetY}px) scale(${State.scale})`;
        services.UI.updatePills();
      },
      screenToWorld(clientX, clientY) {
        const rect = Dom.viewport.getBoundingClientRect();
        return { x: (clientX - rect.left - State.offsetX) / State.scale, y: (clientY - rect.top - State.offsetY) / State.scale };
      },
      zoomAt(factor, clientX, clientY, saveAfter = true) {
        const rect = Dom.viewport.getBoundingClientRect();
        const cx = clientX ?? rect.left + rect.width / 2;
        const cy = clientY ?? rect.top + rect.height / 2;
        const before = this.screenToWorld(cx, cy);
        State.scale = Utils.clampScale(State.scale * factor);
        State.offsetX = cx - before.x * State.scale - rect.left;
        State.offsetY = cy - before.y * State.scale - rect.top;
        services.Render.all();
        if (saveAfter) services.Persist.save();
      },
      fit(saveAfter = true) {
        const rect = Dom.viewport.getBoundingClientRect();
        const b = services.Tree.bounds();
        const w = Math.max(1, b.maxX - b.minX + Config.FIT_PAD * 2);
        const h = Math.max(1, b.maxY - b.minY + Config.FIT_PAD * 2);
        State.scale = Utils.clampScale(Math.min(rect.width / w, rect.height / h, 1));
        State.offsetX = (rect.width - (b.maxX - b.minX) * State.scale) / 2 - b.minX * State.scale;
        State.offsetY = (rect.height - (b.maxY - b.minY) * State.scale) / 2 - b.minY * State.scale;
        services.Render.all();
        if (saveAfter) services.Persist.save();
      },
    };

    services.Render = {
      nodes() {
        Dom.nodes.innerHTML = Object.values(State.nodes).map(node => {
          const cls = ['node', node.parentId === null ? 'root' : '', node.id === State.selectedId ? 'selected' : '', State.pointer?.type === 'drag-node' && State.pointer?.id === node.id ? 'dragging' : '', node.id === State.dropTargetId ? 'drop-target' : ''].filter(Boolean).join(' ');
          return `<div class="${cls}" data-id="${node.id}" style="left:${node.x}px;top:${node.y}px"><div class="node-text">${escapeHtml(node.text)}</div></div>`;
        }).join('');
      },
      edge(parent, child) {
        const ctx = Dom.ctx;
        const parentCx = parent.x + Config.NODE_W / 2;
        const childCx = child.x + Config.NODE_W / 2;
        const dir = childCx >= parentCx ? 1 : -1;
        const x1 = dir === 1 ? parent.x + Config.NODE_W - 8 : parent.x + 8;
        const x2 = dir === 1 ? child.x + 8 : child.x + Config.NODE_W - 8;
        const y1 = parent.y + Config.NODE_H / 2;
        const y2 = child.y + Config.NODE_H / 2;
        const active = State.selectedId === parent.id || State.selectedId === child.id;
        ctx.beginPath();
        if (State.layoutMode === 'diagram') {
          const sx = parent.x + Config.NODE_W / 2;
          const sy = parent.y + Config.NODE_H - 4;
          const tx = child.x + Config.NODE_W / 2;
          const ty = child.y + 4;
          const midY = Math.round((sy + ty) / 2);
          const radius = Math.min(12, Math.abs(tx - sx) / 4, Math.abs(ty - sy) / 4);
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, midY - radius);
          ctx.arcTo(sx, midY, sx + (tx >= sx ? radius : -radius), midY, radius);
          ctx.lineTo(tx - (tx >= sx ? radius : -radius), midY);
          ctx.arcTo(tx, midY, tx, midY + radius, radius);
          ctx.lineTo(tx, ty);
          ctx.lineJoin = 'round';
        } else if (State.linkMode === 'orth') {
          const maxSpan = Math.max(34, Math.abs(x2 - x1) - 24);
          const branchGap = clamp(Math.abs(x2 - x1) * 0.34, 34, Math.min(72, maxSpan));
          const trunkX = dir === 1 ? x1 + branchGap : x1 - branchGap;
          const points = [{x:x1,y:y1},{x:trunkX,y:y1},{x:trunkX,y:y2},{x:x2,y:y2}];
          const radius = Math.max(0, Math.min(13, Math.abs(points[1].x - points[0].x) - 2, Math.abs(points[2].y - points[1].y) / 2, Math.abs(points[3].x - points[2].x) - 2));
          ctx.moveTo(points[0].x, points[0].y);
          if (radius > 0) {
            for (let i = 1; i < points.length - 1; i++) ctx.arcTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y, radius);
            ctx.lineTo(points.at(-1).x, points.at(-1).y);
          } else {
            points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
          }
          ctx.lineJoin = 'round';
        } else {
          ctx.moveTo(x1, y1);
          const rawDx = Math.abs(x2 - x1);
          const dx = clamp(rawDx * 0.45, 42, 120);
          const c1x = dir === 1 ? x1 + dx : x1 - dx;
          const c2x = dir === 1 ? x2 - dx : x2 + dx;
          ctx.bezierCurveTo(c1x, y1, c2x, y2, x2, y2);
        }
        ctx.lineWidth = active ? 3 : 2.2;
        ctx.strokeStyle = active ? 'rgba(130,236,255,.98)' : 'rgba(95,168,214,.74)';
        ctx.lineCap = 'round';
        ctx.stroke();
      },
      edges() {
        Dom.ctx.clearRect(0, 0, Dom.edges.width, Dom.edges.height);
        Object.values(State.nodes).forEach(node => {
          if (!node.parentId) return;
          const parent = services.Tree.getNode(node.parentId);
          if (parent) this.edge(parent, node);
        });
      },
      all() {
        this.nodes();
        this.edges();
        services.Viewport.applyTransform();
      },
    };

    services.EditorSheet = {
      open(id) {
        const node = services.Tree.getNode(id || State.selectedId); if (!node) return;
        State.editorId = node.id;
        Dom.editorArea.value = node.text || '';
        Dom.editorNodeChip.textContent = node.parentId ? `Node ${node.id.slice(-4)}` : 'Node gốc';
        Dom.editorCount.textContent = `${Dom.editorArea.value.length} / 120`;
        Dom.editor.classList.add('open');
        setTimeout(() => { Dom.editorArea.focus(); Dom.editorArea.setSelectionRange(Dom.editorArea.value.length, Dom.editorArea.value.length); }, 10);
      },
      close() { Dom.editor.classList.remove('open'); State.editorId = null; },
      save() {
        const node = services.Tree.getNode(State.editorId); if (!node) return this.close();
        node.text = (Dom.editorArea.value || '').trim() || 'Node';
        services.Logger.add(`Sửa text {"id":"${node.id}"}`);
        this.close();
        services.Render.all();
        services.Persist.save();
      },
    };

    services.Actions = {
      selectNode(id, saveAfter = false) {
        if (!services.Tree.getNode(id)) return;
        State.selectedId = id;
        services.Render.all();
        if (saveAfter) services.Persist.save();
      },
      handleNodeTap(id) {
        const now = Date.now();
        this.selectNode(id, true);
        if (State.lastTap.id === id && now - State.lastTap.t < Config.DOUBLE_TAP_MS) services.EditorSheet.open(id);
        State.lastTap = { id, t: now };
      },
      addChild(parentId) {
        const parent = services.Tree.getNode(parentId); if (!parent) return;
        const siblings = services.Tree.getChildren(parentId); const id = uid();
        State.nodes[id] = { id, parentId, x: parent.x + Config.H_GAP, y: parent.y + Math.max(Config.NODE_H + Config.V_GAP, siblings.length * (Config.NODE_H + 14)), text: 'Node mới' };
        State.selectedId = id;
        if (State.layoutMode === 'auto') services.Tree.autoLayoutFromRoot();
        if (State.layoutMode === 'diagram') services.Tree.autoLayoutDiagram();
        services.Logger.add(`Tạo node con {"parent":"${parentId}","id":"${id}"}`);
        services.Render.all();
        services.Persist.save();
      },
      addSibling(id) {
        const node = services.Tree.getNode(id); if (!node) return;
        if (!node.parentId) return this.addChild(id);
        const newId = uid();
        State.nodes[newId] = { id: newId, parentId: node.parentId, x: node.x, y: node.y + Config.NODE_H + Config.V_GAP, text: 'Node mới' };
        State.selectedId = newId;
        if (State.layoutMode === 'auto') services.Tree.autoLayoutFromRoot();
        if (State.layoutMode === 'diagram') services.Tree.autoLayoutDiagram();
        services.Logger.add(`Tạo node ngang {"base":"${id}","id":"${newId}"}`);
        services.Render.all();
        services.Persist.save();
      },
      deleteSelected() {
        const node = services.Tree.getNode(State.selectedId); if (!node) return;
        if (!node.parentId) { NoticeSafe('Không xóa node gốc trong bản này.'); return; }
        const ids = [...services.Tree.collectDescendants(node.id)];
        ids.forEach(id => delete State.nodes[id]);
        State.selectedId = services.Tree.getRootId();
        if (State.layoutMode === 'auto') services.Tree.autoLayoutFromRoot();
        if (State.layoutMode === 'diagram') services.Tree.autoLayoutDiagram();
        services.Logger.add(`Xóa node {"id":"${node.id}","count":${ids.length}}`);
        services.Render.all();
        services.Persist.save();
      },
      reparentNode(nodeId, newParentId) {
        const node = services.Tree.getNode(nodeId); const newParent = services.Tree.getNode(newParentId);
        if (!node || !newParent || !node.parentId) return false;
        const blocked = services.Tree.collectDescendants(nodeId); if (blocked.has(newParentId)) return false;
        const oldParentId = node.parentId; node.parentId = newParentId;
        const nodeBox = { x: node.x, y: node.y, w: Config.NODE_W, h: Config.NODE_H };
        const parentBox = { x: newParent.x, y: newParent.y, w: Config.NODE_W, h: Config.NODE_H };
        if (Utils.rectsOverlap(nodeBox, parentBox, 16)) {
          const parentCenterX = newParent.x + Config.NODE_W / 2;
          const nodeCenterX = node.x + Config.NODE_W / 2;
          const dir = nodeCenterX >= parentCenterX ? 1 : -1;
          const desiredX = Math.round(newParent.x + dir * Math.max(Config.NODE_W + 54, Config.H_GAP * 0.62));
          services.Tree.moveSubtree(nodeId, desiredX - node.x, 0);
        }
        State.selectedId = nodeId;
        if (State.layoutMode === 'auto') services.Tree.autoLayoutFromRoot();
        if (State.layoutMode === 'diagram') services.Tree.autoLayoutDiagram();
        services.Logger.add(`Đổi node mẹ {"id":"${nodeId}","from":"${oldParentId}","to":"${newParentId}"}`);
        services.Persist.save();
        return true;
      },
      setLayoutMode(mode) {
        State.layoutMode = mode === 'diagram' ? 'diagram' : (mode === 'auto' ? 'auto' : 'free');
        if (State.layoutMode === 'diagram') State.linkMode = 'orth';
        services.UI.syncLayoutButtons();
        services.UI.syncModeButtons();
        if (State.layoutMode === 'auto') { services.Tree.autoLayoutFromRoot(); services.Viewport.fit(false); services.UI.setStatus('Bật Auto cây'); }
        else if (State.layoutMode === 'diagram') { services.Tree.autoLayoutDiagram(); services.Viewport.fit(false); services.UI.setStatus('Bật Diagram'); }
        else { services.UI.setStatus('Bật Free canvas'); }
        services.Render.all();
        services.Persist.save();
        services.Logger.add(`Đổi bố cục {"mode":"${State.layoutMode}"}`);
      },
      relayoutTree() {
        if (State.layoutMode === 'diagram') {
          services.Tree.autoLayoutDiagram(); services.Viewport.fit(false); services.UI.setStatus('Đã xếp Diagram'); services.Logger.add('Diagram layout lại toàn cây');
        } else {
          services.Tree.autoLayoutFromRoot(); services.Viewport.fit(false); services.UI.setStatus('Đã xếp cây'); services.Logger.add('Auto layout lại toàn cây');
        }
        services.Render.all(); services.Persist.save();
      },
      setLinkMode(mode) {
        if (State.layoutMode === 'diagram') {
          State.linkMode = 'orth'; services.UI.syncModeButtons(); services.Render.all(); services.Persist.save(); services.Logger.add('Diagram mode khóa dây vuông'); services.UI.setStatus('Diagram dùng dây vuông'); return;
        }
        State.linkMode = mode === 'orth' ? 'orth' : 'curve';
        services.UI.syncModeButtons(); services.Render.all(); services.Persist.save(); services.Logger.add(`Đổi kiểu dây {"mode":"${State.linkMode}"}`);
      },
    };

    services.Gesture = {
      detectDropTarget(worldX, worldY, draggedId, dragIds) {
        const exclude = dragIds || services.Tree.collectDescendants(draggedId);
        let found = null;
        Object.values(State.nodes).forEach(node => {
          if (found) return; if (exclude.has(node.id)) return;
          if (Utils.boxContainsPoint({ x:node.x, y:node.y, w:Config.NODE_W, h:Config.NODE_H }, worldX, worldY, 4)) found = node.id;
        });
        State.dropTargetId = found;
      },
      clearDropTarget() { if (State.dropTargetId) State.dropTargetId = null; },
      startPointer: (e) => {
        if (Dom.editor.classList.contains('open')) return;
        if (State.pinch) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const nodeEl = Utils.getNodeElFromTarget(e.target);
        if (nodeEl) {
          const id = nodeEl.dataset.id; const node = services.Tree.getNode(id); const pos = services.Viewport.screenToWorld(e.clientX, e.clientY); const dragIds = services.Tree.collectDescendants(id); const startPositions = {};
          dragIds.forEach(nodeId => { const item = services.Tree.getNode(nodeId); if (item) startPositions[nodeId] = { x:item.x, y:item.y }; });
          State.pointer = { pointerId:e.pointerId, type:'drag-node', id, startX:e.clientX, startY:e.clientY, dx:pos.x - node.x, dy:pos.y - node.y, moved:false, dragIds, startPositions, rootStartX:node.x, rootStartY:node.y };
          State.dropTargetId = null; services.Actions.selectNode(id);
        } else {
          State.pointer = { pointerId:e.pointerId, type:'pan', startX:e.clientX, startY:e.clientY, offsetX:State.offsetX, offsetY:State.offsetY, moved:false };
        }
        try { Dom.viewport.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      },
      movePointer: (e) => {
        const p = State.pointer; if (!p || p.pointerId !== e.pointerId || State.pinch) return;
        if (p.type === 'drag-node') {
          const node = services.Tree.getNode(p.id); if (!node) return;
          const pos = services.Viewport.screenToWorld(e.clientX, e.clientY);
          const newRootX = Math.round(pos.x - p.dx), newRootY = Math.round(pos.y - p.dy);
          const deltaX = newRootX - p.rootStartX, deltaY = newRootY - p.rootStartY;
          p.dragIds.forEach(nodeId => { const item = services.Tree.getNode(nodeId); const startPos = p.startPositions[nodeId]; if (item && startPos) { item.x = Math.round(startPos.x + deltaX); item.y = Math.round(startPos.y + deltaY); } });
          p.moved = p.moved || Math.abs(e.clientX - p.startX) > Config.TAP_MOVE || Math.abs(e.clientY - p.startY) > Config.TAP_MOVE;
          if (p.moved) services.Gesture.detectDropTarget(pos.x, pos.y, p.id, p.dragIds); else services.Gesture.clearDropTarget();
          services.Render.all();
        } else if (p.type === 'pan') {
          State.offsetX = p.offsetX + (e.clientX - p.startX);
          State.offsetY = p.offsetY + (e.clientY - p.startY);
          p.moved = p.moved || Math.abs(e.clientX - p.startX) > Config.TAP_MOVE || Math.abs(e.clientY - p.startY) > Config.TAP_MOVE;
          services.Render.all();
        }
        e.preventDefault();
      },
      endPointer: (e) => {
        const p = State.pointer; if (!p || p.pointerId !== e.pointerId) return;
        if (p.type === 'drag-node') {
          if (!p.moved) { services.Actions.handleNodeTap(p.id); }
          else {
            const droppedOn = State.dropTargetId; let changedParent = false;
            if (droppedOn) changedParent = services.Actions.reparentNode(p.id, droppedOn);
            else if (State.layoutMode === 'auto' || State.layoutMode === 'diagram') {
              p.dragIds.forEach(nodeId => { const item = services.Tree.getNode(nodeId); const startPos = p.startPositions[nodeId]; if (item && startPos) { item.x = startPos.x; item.y = startPos.y; } });
              if (State.layoutMode === 'diagram') { services.Tree.autoLayoutDiagram(); services.Logger.add(`Diagram mode: snap lại {"id":"${p.id}"}`); services.UI.setStatus('Diagram: không kéo tự do'); }
              else { services.Tree.autoLayoutFromRoot(); services.Logger.add(`Auto mode: snap lại {"id":"${p.id}"}`); services.UI.setStatus('Auto cây: không kéo tự do'); }
              services.Persist.save();
            } else { services.Logger.add(`Kéo node {"id":"${p.id}","x":${services.Tree.getNode(p.id)?.x},"y":${services.Tree.getNode(p.id)?.y}}`); services.Persist.save(); }
            if (changedParent) services.UI.setStatus('Đã gắn sang node mới');
          }
        } else if (p.type === 'pan') { if (p.moved) services.Persist.save(); }
        State.pointer = null; State.dropTargetId = null; services.Render.all();
      },
      startTouch: (e) => {
        if (Dom.editor.classList.contains('open')) return;
        if (e.touches.length !== 2) return;
        const [t1, t2] = e.touches; const center = Utils.touchCenter(t1, t2);
        State.pointer = null; State.dropTargetId = null;
        State.pinch = { startDist: Utils.touchDistance(t1,t2), startScale: State.scale, worldCenter: services.Viewport.screenToWorld(center.x, center.y) };
        e.preventDefault();
      },
      moveTouch: (e) => {
        if (!State.pinch || e.touches.length < 2) return;
        const [t1, t2] = e.touches; const center = Utils.touchCenter(t1,t2); const dist = Math.max(1, Utils.touchDistance(t1,t2));
        State.scale = Utils.clampScale(State.pinch.startScale * (dist / State.pinch.startDist));
        const rect = Dom.viewport.getBoundingClientRect();
        State.offsetX = (center.x - rect.left) - State.pinch.worldCenter.x * State.scale;
        State.offsetY = (center.y - rect.top) - State.pinch.worldCenter.y * State.scale;
        services.Render.all(); e.preventDefault();
      },
      endTouch: (e) => { if (!State.pinch) return; if (e.touches.length >= 2) return; State.pinch = null; services.Persist.save(); services.Render.all(); },
      bind() {
        Dom.viewport.addEventListener('pointerdown', this.startPointer, { passive:false });
        window.addEventListener('pointermove', this.movePointer, { passive:false });
        window.addEventListener('pointerup', this.endPointer, { passive:false });
        window.addEventListener('pointercancel', this.endPointer, { passive:false });
        Dom.viewport.addEventListener('wheel', this._wheel = (e) => { e.preventDefault(); services.Viewport.zoomAt(e.deltaY < 0 ? 1.08 : 0.92, e.clientX, e.clientY); }, { passive:false });
        Dom.viewport.addEventListener('touchstart', this.startTouch, { passive:false });
        Dom.viewport.addEventListener('touchmove', this.moveTouch, { passive:false });
        Dom.viewport.addEventListener('touchend', this.endTouch, { passive:false });
        Dom.viewport.addEventListener('touchcancel', this.endTouch, { passive:false });
      },
      unbind() {
        Dom.viewport.removeEventListener('pointerdown', this.startPointer);
        window.removeEventListener('pointermove', this.movePointer);
        window.removeEventListener('pointerup', this.endPointer);
        window.removeEventListener('pointercancel', this.endPointer);
        if (this._wheel) Dom.viewport.removeEventListener('wheel', this._wheel);
        Dom.viewport.removeEventListener('touchstart', this.startTouch);
        Dom.viewport.removeEventListener('touchmove', this.moveTouch);
        Dom.viewport.removeEventListener('touchend', this.endTouch);
        Dom.viewport.removeEventListener('touchcancel', this.endTouch);
      },
    };
    services.Gesture.services = services;

    services.Persist = {
      save() {
        const payload = { nodes: State.nodes, selectedId: State.selectedId, scale: State.scale, offsetX: State.offsetX, offsetY: State.offsetY, linkMode: State.linkMode, layoutMode: State.layoutMode, logs: State.logs };
        plugin.setCanvasState(payload);
        services.UI.updatePills();
        services.UI.setStatus('Đã lưu');
      },
      async load() {
        try {
          const parsed = plugin.getCanvasState();
          if (!parsed) {
            Object.assign(State, services.Tree.defaultTree());
            services.Viewport.fit(false);
            services.Logger.add('Khởi tạo demo mặc định');
            this.save();
            return;
          }
          State.nodes = parsed.nodes || {};
          State.selectedId = parsed.selectedId || services.Tree.getRootId();
          State.scale = Number.isFinite(parsed.scale) ? parsed.scale : 1;
          State.offsetX = Number.isFinite(parsed.offsetX) ? parsed.offsetX : 0;
          State.offsetY = Number.isFinite(parsed.offsetY) ? parsed.offsetY : 0;
          State.linkMode = parsed.linkMode === 'orth' ? 'orth' : 'curve';
          State.layoutMode = parsed.layoutMode === 'diagram' ? 'diagram' : (parsed.layoutMode === 'auto' ? 'auto' : 'free');
          if (State.layoutMode === 'diagram') State.linkMode = 'orth';
          State.logs = Array.isArray(parsed.logs) && parsed.logs.length ? parsed.logs : [`[${nowTime()}] Loaded state`];
          if (!Object.keys(State.nodes).length) {
            const fresh = services.Tree.defaultTree();
            State.nodes = fresh.nodes; State.selectedId = fresh.selectedId; State.logs = fresh.logs; State.linkMode = fresh.linkMode; State.layoutMode = fresh.layoutMode;
          }
          services.Logger.render(); services.UI.syncModeButtons(); services.UI.syncLayoutButtons();
        } catch (e) {
          Object.assign(State, services.Tree.defaultTree());
        }
      },
      reset() {
        const fresh = services.Tree.defaultTree();
        State.nodes = fresh.nodes; State.selectedId = fresh.selectedId; State.logs = fresh.logs; State.linkMode = fresh.linkMode; State.layoutMode = fresh.layoutMode;
        services.Viewport.fit(false); services.UI.syncModeButtons(); services.UI.syncLayoutButtons(); services.Render.all(); this.save();
      },
    };

    services.Bindings = {
      resizeHandler: () => services.Render.all(),
      events() {
        Dom.addChildBtn.addEventListener('click', () => services.Actions.addChild(State.selectedId || services.Tree.getRootId()));
        Dom.addSiblingBtn.addEventListener('click', () => services.Actions.addSibling(State.selectedId || services.Tree.getRootId()));
        Dom.editBtn.addEventListener('click', () => services.EditorSheet.open(State.selectedId));
        Dom.deleteBtn.addEventListener('click', () => services.Actions.deleteSelected());
        Dom.zoomInBtn.addEventListener('click', () => services.Viewport.zoomAt(1.12));
        Dom.zoomOutBtn.addEventListener('click', () => services.Viewport.zoomAt(0.89));
        Dom.fitBtn.addEventListener('click', () => { services.Logger.add('Căn giữa canvas'); services.Viewport.fit(); });
        Dom.toggleLogBtn.addEventListener('click', () => Dom.logPanel.classList.toggle('open'));
        Dom.curveModeBtn.addEventListener('click', () => services.Actions.setLinkMode('curve'));
        Dom.orthModeBtn.addEventListener('click', () => services.Actions.setLinkMode('orth'));
        Dom.freeLayoutBtn.addEventListener('click', () => services.Actions.setLayoutMode('free'));
        Dom.autoLayoutBtn.addEventListener('click', () => services.Actions.setLayoutMode('auto'));
        Dom.diagramLayoutBtn.addEventListener('click', () => services.Actions.setLayoutMode('diagram'));
        Dom.relayoutBtn.addEventListener('click', () => services.Actions.relayoutTree());
        Dom.resetBtn.addEventListener('click', () => { if (!window.confirm('Reset lại demo mặc định?')) return; services.Persist.reset(); });
        Dom.copyLogBtn.addEventListener('click', () => services.Logger.copyAll());
        Dom.clearLogBtn.addEventListener('click', () => services.Logger.clear());
        Dom.editorCancelBtn.addEventListener('click', () => services.EditorSheet.close());
        Dom.editorSaveBtn.addEventListener('click', () => services.EditorSheet.save());
        Dom.editor.addEventListener('click', (e) => { if (e.target === Dom.editor) services.EditorSheet.close(); });
        Dom.editorArea.addEventListener('input', () => { Dom.editorCount.textContent = `${Dom.editorArea.value.length} / 120`; });
        Dom.editorArea.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') services.EditorSheet.save(); });
        window.addEventListener('resize', this.resizeHandler);
      },
      unbind() { window.removeEventListener('resize', this.resizeHandler); },
    };

    this.services = services;
    await services.Persist.load();
    services.UI.syncModeButtons();
    services.UI.syncLayoutButtons();
    services.Logger.render();
    services.Bindings.events();
    services.Gesture.bind();
    if (!services.State.selectedId) services.State.selectedId = services.Tree.getRootId();
    services.Render.all();
    services.UI.setStatus('Sẵn sàng');

    this.cleanupFns.push(() => services.Bindings.unbind());
    this.cleanupFns.push(() => services.Gesture.unbind());
    this.cleanupFns.push(() => this.flushSave());
  }

  createDom(root) {
    const q = (sel) => root.querySelector(sel);
    const edges = q('#edges');
    return {
      viewport: q('#viewport'),
      world: q('#world'),
      nodes: q('#nodes'),
      edges,
      ctx: edges.getContext('2d'),
      logPanel: q('#logPanel'),
      logContent: q('#logContent'),
      statusPill: q('#statusPill'),
      nodeCountPill: q('#nodeCountPill'),
      zoomPill: q('#zoomPill'),
      layoutModePill: q('#layoutModePill'),
      linkModePill: q('#linkModePill'),
      editor: q('#editor'),
      editorArea: q('#editorArea'),
      editorCount: q('#editorCount'),
      editorNodeChip: q('#editorNodeChip'),
      addChildBtn: q('#addChildBtn'),
      addSiblingBtn: q('#addSiblingBtn'),
      editBtn: q('#editBtn'),
      deleteBtn: q('#deleteBtn'),
      zoomInBtn: q('#zoomInBtn'),
      zoomOutBtn: q('#zoomOutBtn'),
      fitBtn: q('#fitBtn'),
      toggleLogBtn: q('#toggleLogBtn'),
      curveModeBtn: q('#curveModeBtn'),
      orthModeBtn: q('#orthModeBtn'),
      freeLayoutBtn: q('#freeLayoutBtn'),
      autoLayoutBtn: q('#autoLayoutBtn'),
      diagramLayoutBtn: q('#diagramLayoutBtn'),
      relayoutBtn: q('#relayoutBtn'),
      resetBtn: q('#resetBtn'),
      copyLogBtn: q('#copyLogBtn'),
      clearLogBtn: q('#clearLogBtn'),
      editorCancelBtn: q('#editorCancelBtn'),
      editorSaveBtn: q('#editorSaveBtn'),
    };
  }

  async flushSave() {
    if (!this.plugin._pendingCanvasState) return;
    const state = this.plugin._pendingCanvasState;
    this.plugin._pendingCanvasState = null;
    this.plugin.data = Object.assign({}, this.plugin.data, { canvasState: state });
    try { await this.plugin.saveData(this.plugin.data); } catch (e) {}
  }
}

module.exports = class MindCanvasModularPlugin extends Plugin {
  async onload() {
    this.data = (await this.loadData()) || {};
    this._pendingCanvasState = null;
    this._saveTimer = null;
    this.registerView(VIEW_TYPE, (leaf) => new MindCanvasModularView(leaf, this));
    this.addCommand({ id: 'open-mind-canvas-modular', name: 'Open Mind Canvas Modular', callback: async () => { await this.activateView(); } });
    this.addRibbonIcon('git-branch-plus', 'Open Mind Canvas Modular', async () => { await this.activateView(); });
  }

  onunload() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(leaf => leaf.detach());
  }

  getCanvasState() {
    return this.data?.canvasState || null;
  }

  setCanvasState(state) {
    this._pendingCanvasState = JSON.parse(JSON.stringify(state));
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(async () => {
      if (!this._pendingCanvasState) return;
      this.data = Object.assign({}, this.data, { canvasState: this._pendingCanvasState });
      this._pendingCanvasState = null;
      try { await this.saveData(this.data); } catch (e) {}
    }, 220);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) leaf = this.app.workspace.getRightLeaf(false) || this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
};
