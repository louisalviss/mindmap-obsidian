const {
  Plugin,
  ItemView,
  Notice,
  PluginSettingTab,
  Setting,
  TFile,
  Menu,
  normalizePath,
  setIcon,
} = require("obsidian");

const VIEW_TYPE = "mind-note-map-view";
const DEFAULT_SETTINGS = {
  noteFolder: "Mind Map Notes",
  autoOpenNewNote: true,
  mapName: "Default Map",
};

const PLUGIN_VERSION = "v0.1.0";

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function slugify(text) {
  return (text || "node")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "node";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isInputLike(target) {
  return !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

function getTreeChildren(nodes, parentId) {
  return nodes.filter((node) => node.parentId === parentId);
}

function collectBranchIds(nodes, rootId) {
  const stack = [rootId];
  const ids = new Set();
  while (stack.length) {
    const id = stack.pop();
    ids.add(id);
    const children = nodes.filter((n) => n.parentId === id);
    for (const child of children) stack.push(child.id);
  }
  return ids;
}

function autoLayout(nodes) {
  const root = nodes.find((n) => !n.parentId) || nodes[0];
  if (!root) return nodes;

  const byParent = new Map();
  for (const node of nodes) {
    const key = node.parentId || "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(node);
  }

  const subtreeHeight = (nodeId) => {
    const children = byParent.get(nodeId) || [];
    if (!children.length) return 96;
    return Math.max(
      children.map((child) => subtreeHeight(child.id)).reduce((a, b) => a + b, 0) + (children.length - 1) * 24,
      96,
    );
  };

  const place = (node, x, yTop) => {
    const children = byParent.get(node.id) || [];
    const height = subtreeHeight(node.id);
    node.x = x;
    node.y = yTop + height / 2 - node.height / 2;

    if (!children.length) return;

    let cursor = yTop;
    for (const child of children) {
      const h = subtreeHeight(child.id);
      place(child, x + 300, cursor);
      cursor += h + 24;
    }
  };

  place(root, 120, 120);
  return nodes;
}

class MindNoteMapView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.selectedNodeId = null;
    this.scale = 1;
    this.panX = 200;
    this.panY = 160;
    this.pointerState = new Map();
    this.dragState = null;
    this.panState = null;
    this.pinchState = null;
    this.saveSoon = debounce(() => this.plugin.saveState(), 250);
    this.boundKeyHandler = this.onKeyDown.bind(this);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Mind map";
  }

  getIcon() {
    return "network";
  }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("mnm-view");
    this.buildShell();
    this.attachEvents();
    this.ensureMapExists();
    this.render();
  }

  async onClose() {
    document.removeEventListener("keydown", this.boundKeyHandler, true);
  }

  buildShell() {
    this.toolbarEl = this.contentEl.createDiv({ cls: "mnm-toolbar" });
    const titleWrap = this.toolbarEl.createDiv({ cls: "mnm-title-wrap" });
    titleWrap.createDiv({ cls: "mnm-title", text: "Mind Note Map" });
    titleWrap.createDiv({ cls: "mnm-version", text: `UI ${PLUGIN_VERSION}` });

    this.addToolbarButton("plus-circle", "Add child", () => this.addChild());
    this.addToolbarButton("split", "Add sibling", () => this.addSibling());
    this.addToolbarButton("file-plus", "Note", () => this.openOrCreateSelectedNote());
    this.addToolbarButton("link", "Link active", () => this.linkSelectedNodeToActiveNote());
    this.addToolbarButton("sparkles", "Auto layout", () => this.runAutoLayout());
    this.addToolbarButton("locate-fixed", "Center", () => this.centerOnRoot());
    this.addToolbarButton("rotate-ccw", "Reset map", () => this.resetMap());

    this.helpEl = this.contentEl.createDiv({ cls: "mnm-help" });
    this.helpEl.innerHTML = `<strong>Controls</strong> • Drag node • Double tap title to rename • Wheel or pinch to zoom • Drag empty space to pan`;

    this.viewportEl = this.contentEl.createDiv({ cls: "mnm-viewport" });
    this.surfaceEl = this.viewportEl.createDiv({ cls: "mnm-surface" });
    this.edgesSvg = this.surfaceEl.createEl("svg", { cls: "mnm-edges" });
    this.nodesLayerEl = this.surfaceEl.createDiv({ cls: "mnm-nodes" });

    this.emptyEl = this.viewportEl.createDiv({ cls: "mnm-empty", text: "No nodes yet" });
    this.statusEl = this.viewportEl.createDiv({ cls: "mnm-status" });

    this.fabBar = this.viewportEl.createDiv({ cls: "mnm-fab-bar" });
    this.addFab("plus-circle", "Add child", true, () => this.addChild());
    this.addFab("file-plus", "Note", false, () => this.openOrCreateSelectedNote());
    this.addFab("sparkles", "Auto layout", false, () => this.runAutoLayout());
  }

  addToolbarButton(icon, label, handler) {
    const btn = this.toolbarEl.createEl("button", { attr: { "aria-label": label, title: label, type: "button" } });
    setIcon(btn, icon);
    btn.addEventListener("click", handler);
    return btn;
  }

  addFab(icon, label, primary, handler) {
    const btn = this.fabBar.createEl("button", { cls: `mnm-fab${primary ? " is-primary" : ""}`, attr: { type: "button", title: label, "aria-label": label } });
    setIcon(btn, icon);
    btn.addEventListener("click", handler);
    return btn;
  }

  attachEvents() {
    document.addEventListener("keydown", this.boundKeyHandler, true);

    this.viewportEl.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      const rect = this.viewportEl.getBoundingClientRect();
      const point = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
      const factor = evt.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAt(point, factor);
    }, { passive: false });

    this.viewportEl.addEventListener("pointerdown", (evt) => this.onViewportPointerDown(evt));
    this.viewportEl.addEventListener("pointermove", (evt) => this.onViewportPointerMove(evt));
    this.viewportEl.addEventListener("pointerup", (evt) => this.onViewportPointerUp(evt));
    this.viewportEl.addEventListener("pointercancel", (evt) => this.onViewportPointerUp(evt));
  }

  onKeyDown(evt) {
    if (this.leaf.view !== this) return;
    if (isInputLike(evt.target)) return;

    if (evt.key === "Tab") {
      evt.preventDefault();
      this.addChild();
      return;
    }

    if (evt.key === "Enter") {
      evt.preventDefault();
      this.addSibling();
      return;
    }

    if ((evt.key === "Backspace" || evt.key === "Delete") && this.selectedNodeId) {
      evt.preventDefault();
      this.deleteSelectedNode();
      return;
    }

    if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "e") {
      evt.preventDefault();
      this.startRename(this.selectedNodeId);
      return;
    }
  }

  onViewportPointerDown(evt) {
    this.pointerState.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });

    if (this.pointerState.size === 2) {
      const points = [...this.pointerState.values()];
      this.pinchState = {
        distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
        midpoint: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
      };
      this.panState = null;
      return;
    }

    const target = evt.target;
    if (target.closest(".mnm-node")) return;

    this.panState = {
      pointerId: evt.pointerId,
      x: evt.clientX,
      y: evt.clientY,
      startPanX: this.panX,
      startPanY: this.panY,
    };
    this.viewportEl.setPointerCapture(evt.pointerId);
  }

  onViewportPointerMove(evt) {
    if (this.pointerState.has(evt.pointerId)) {
      this.pointerState.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
    }

    if (this.pointerState.size === 2 && this.pinchState && !this.dragState) {
      const points = [...this.pointerState.values()];
      const rect = this.viewportEl.getBoundingClientRect();
      const newDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      if (newDistance > 0) {
        const midpointClient = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        const point = { x: midpointClient.x - rect.left, y: midpointClient.y - rect.top };
        this.zoomAt(point, newDistance / this.pinchState.distance, false);
        this.panX += midpointClient.x - this.pinchState.midpoint.x;
        this.panY += midpointClient.y - this.pinchState.midpoint.y;
        this.pinchState = { distance: newDistance, midpoint: midpointClient };
        this.applyTransform();
      }
      return;
    }

    if (this.dragState && evt.pointerId === this.dragState.pointerId) {
      const world = this.screenToWorld(evt.clientX, evt.clientY);
      const node = this.getSelectedNode();
      if (!node) return;
      node.x = world.x - this.dragState.offsetX;
      node.y = world.y - this.dragState.offsetY;
      this.updateNodePosition(node);
      this.renderEdges();
      this.updateStatus();
      return;
    }

    if (this.panState && evt.pointerId === this.panState.pointerId) {
      this.panX = this.panState.startPanX + (evt.clientX - this.panState.x);
      this.panY = this.panState.startPanY + (evt.clientY - this.panState.y);
      this.applyTransform();
      this.updateStatus();
    }
  }

  onViewportPointerUp(evt) {
    this.pointerState.delete(evt.pointerId);

    if (this.dragState && evt.pointerId === this.dragState.pointerId) {
      this.dragState = null;
      this.saveSoon();
    }

    if (this.panState && evt.pointerId === this.panState.pointerId) {
      this.panState = null;
    }

    if (this.pointerState.size < 2) {
      this.pinchState = null;
    }
  }

  zoomAt(point, factor, apply = true) {
    const oldScale = this.scale;
    const newScale = clamp(oldScale * factor, 0.3, 2.5);
    if (newScale === oldScale) return;

    const worldX = (point.x - this.panX) / oldScale;
    const worldY = (point.y - this.panY) / oldScale;

    this.scale = newScale;
    this.panX = point.x - worldX * newScale;
    this.panY = point.y - worldY * newScale;

    if (apply) this.applyTransform();
    this.updateStatus();
  }

  screenToWorld(clientX, clientY) {
    const rect = this.viewportEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.panX) / this.scale,
      y: (clientY - rect.top - this.panY) / this.scale,
    };
  }

  worldToScreen(x, y) {
    return {
      x: x * this.scale + this.panX,
      y: y * this.scale + this.panY,
    };
  }

  ensureMapExists() {
    if (!this.plugin.data.map || !Array.isArray(this.plugin.data.map.nodes)) {
      this.plugin.data.map = {
        id: uid("map"),
        name: this.plugin.settings.mapName,
        nodes: [
          {
            id: uid("node"),
            title: this.plugin.settings.mapName,
            x: 120,
            y: 120,
            width: 220,
            height: 90,
            parentId: null,
            notePath: null,
          },
        ],
      };
      this.selectedNodeId = this.plugin.data.map.nodes[0].id;
      this.plugin.saveState();
    }

    if (!this.selectedNodeId && this.plugin.data.map.nodes[0]) {
      this.selectedNodeId = this.plugin.data.map.nodes[0].id;
    }
  }

  get map() {
    return this.plugin.data.map;
  }

  get nodes() {
    return this.map.nodes;
  }

  getSelectedNode() {
    return this.nodes.find((node) => node.id === this.selectedNodeId) || null;
  }

  setSelectedNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.renderSelectionState();
    this.renderEdges();
    this.updateStatus();
  }

  render() {
    this.renderNodes();
    this.renderEdges();
    this.applyTransform();
    this.updateStatus();
    this.emptyEl.style.display = this.nodes.length ? "none" : "flex";
  }

  renderNodes() {
    this.nodesLayerEl.empty();

    for (const node of this.nodes) {
      const nodeEl = this.nodesLayerEl.createDiv({ cls: "mnm-node" });
      nodeEl.dataset.nodeId = node.id;
      nodeEl.style.left = `${node.x}px`;
      nodeEl.style.top = `${node.y}px`;
      nodeEl.style.width = `${node.width}px`;
      nodeEl.style.minHeight = `${node.height}px`;

      const header = nodeEl.createDiv({ cls: "mnm-node-header" });
      const drag = header.createDiv({ cls: "mnm-node-drag" });
      const titleEl = drag.createDiv({ cls: "mnm-node-title", text: node.title });

      const meta = nodeEl.createDiv({ cls: "mnm-node-meta" });
      meta.createDiv({ cls: "mnm-chip", text: this.getDepthLabel(node) });
      if (node.notePath) {
        const chip = meta.createDiv({ cls: "mnm-chip is-note" });
        setIcon(chip.createSpan(), "file-text");
        chip.createSpan({ text: "linked" });
      }

      const actions = header.createDiv({ cls: "mnm-node-actions" });
      this.createNodeButton(actions, "plus", "Add child", () => this.addChild(node.id));
      this.createNodeButton(actions, node.notePath ? "file-text" : "file-plus", node.notePath ? "Open note" : "Create note", () => {
        this.setSelectedNode(node.id);
        this.openOrCreateSelectedNote();
      });
      this.createNodeButton(actions, "x", "Delete", () => {
        this.setSelectedNode(node.id);
        this.deleteSelectedNode();
      });

      if (node.notePath) {
        nodeEl.createDiv({ cls: "mnm-node-link", text: node.notePath });
      }

      drag.addEventListener("pointerdown", (evt) => {
        evt.stopPropagation();
        this.setSelectedNode(node.id);
        const world = this.screenToWorld(evt.clientX, evt.clientY);
        this.dragState = {
          pointerId: evt.pointerId,
          offsetX: world.x - node.x,
          offsetY: world.y - node.y,
        };
        drag.setPointerCapture(evt.pointerId);
      });

      nodeEl.addEventListener("pointerdown", (evt) => {
        evt.stopPropagation();
        this.setSelectedNode(node.id);
      });

      titleEl.addEventListener("dblclick", (evt) => {
        evt.stopPropagation();
        this.startRename(node.id);
      });

      nodeEl.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
        this.setSelectedNode(node.id);
        this.openNodeMenu(evt, node.id);
      });
    }

    this.renderSelectionState();
  }

  renderSelectionState() {
    const nodeEls = this.nodesLayerEl.querySelectorAll(".mnm-node");
    nodeEls.forEach((el) => {
      const selected = el.dataset.nodeId === this.selectedNodeId;
      el.classList.toggle("is-selected", selected);
    });
  }

  renderEdges() {
    this.edgesSvg.empty();
    this.edgesSvg.setAttribute("width", "6000");
    this.edgesSvg.setAttribute("height", "6000");
    this.edgesSvg.setAttribute("viewBox", "0 0 6000 6000");

    const selectedBranch = this.selectedNodeId ? collectBranchIds(this.nodes, this.selectedNodeId) : new Set();

    for (const node of this.nodes) {
      if (!node.parentId) continue;
      const parent = this.nodes.find((candidate) => candidate.id === node.parentId);
      if (!parent) continue;

      const startX = parent.x + parent.width;
      const startY = parent.y + parent.height / 2;
      const endX = node.x;
      const endY = node.y + node.height / 2;
      const mid = Math.max(80, (endX - startX) * 0.45);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${startX} ${startY} C ${startX + mid} ${startY}, ${endX - mid} ${endY}, ${endX} ${endY}`);
      path.setAttribute("class", `mnm-edge${selectedBranch.has(parent.id) && selectedBranch.has(node.id) ? " is-selected-branch" : ""}`);
      path.dataset.from = parent.id;
      path.dataset.to = node.id;
      this.edgesSvg.appendChild(path);
    }
  }

  updateNodePosition(node) {
    const el = this.nodesLayerEl.querySelector(`[data-node-id="${node.id}"]`);
    if (!el) return;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
  }

  applyTransform() {
    this.surfaceEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.updateStatus();
  }

  updateStatus() {
    const selected = this.getSelectedNode();
    const zoom = Math.round(this.scale * 100);
    const selectedText = selected ? ` • Selected: ${selected.title}` : "";
    this.statusEl.setText(`${this.nodes.length} nodes • Zoom ${zoom}%${selectedText}`);
  }

  getDepthLabel(node) {
    let depth = 0;
    let current = node;
    while (current.parentId) {
      depth += 1;
      current = this.nodes.find((item) => item.id === current.parentId) || { parentId: null };
    }
    return depth === 0 ? "root" : `level ${depth}`;
  }

  startRename(nodeId) {
    const node = this.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const nodeEl = this.nodesLayerEl.querySelector(`[data-node-id="${node.id}"]`);
    if (!nodeEl) return;
    const titleEl = nodeEl.querySelector(".mnm-node-title");
    if (!titleEl) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = node.title;
    input.className = "mnm-node-input";
    titleEl.replaceWith(input);
    input.focus();
    input.select();

    const finish = (commit) => {
      if (commit) {
        const next = input.value.trim() || "Untitled";
        node.title = next;
      }
      this.render();
      this.saveSoon();
    };

    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        finish(true);
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        finish(false);
      }
    });

    input.addEventListener("blur", () => finish(true), { once: true });
  }

  openNodeMenu(evt, nodeId) {
    const node = this.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const menu = new Menu();
    menu.addItem((item) => item.setTitle("Add child").setIcon("plus").onClick(() => this.addChild(node.id)));
    menu.addItem((item) => item.setTitle("Add sibling").setIcon("split").onClick(() => this.addSibling(node.id)));
    menu.addItem((item) => item.setTitle(node.notePath ? "Open note" : "Create note").setIcon(node.notePath ? "file-text" : "file-plus").onClick(() => {
      this.setSelectedNode(node.id);
      this.openOrCreateSelectedNote();
    }));
    menu.addItem((item) => item.setTitle("Link to active note").setIcon("link").onClick(() => {
      this.setSelectedNode(node.id);
      this.linkSelectedNodeToActiveNote();
    }));
    if (node.parentId) {
      menu.addItem((item) => item.setTitle("Delete node").setIcon("trash").onClick(() => {
        this.setSelectedNode(node.id);
        this.deleteSelectedNode();
      }));
    }
    menu.showAtMouseEvent(evt);
  }

  addChild(parentId = null) {
    const parent = this.nodes.find((node) => node.id === (parentId || this.selectedNodeId)) || this.nodes[0];
    if (!parent) return;

    const siblings = getTreeChildren(this.nodes, parent.id);
    const y = siblings.length ? Math.max(...siblings.map((node) => node.y)) + 120 : parent.y;
    const node = {
      id: uid("node"),
      title: "New node",
      x: parent.x + 280,
      y,
      width: 220,
      height: 90,
      parentId: parent.id,
      notePath: null,
    };
    this.nodes.push(node);
    this.setSelectedNode(node.id);
    this.render();
    this.saveSoon();
  }

  addSibling(nodeId = null) {
    const current = this.nodes.find((node) => node.id === (nodeId || this.selectedNodeId));
    if (!current) {
      this.addChild();
      return;
    }

    if (!current.parentId) {
      new Notice("Root node cannot have siblings.");
      return;
    }

    const siblings = getTreeChildren(this.nodes, current.parentId);
    const node = {
      id: uid("node"),
      title: "New sibling",
      x: current.x,
      y: Math.max(...siblings.map((item) => item.y)) + 120,
      width: 220,
      height: 90,
      parentId: current.parentId,
      notePath: null,
    };
    this.nodes.push(node);
    this.setSelectedNode(node.id);
    this.render();
    this.saveSoon();
  }

  async openOrCreateSelectedNote() {
    const node = this.getSelectedNode();
    if (!node) {
      new Notice("Select a node first.");
      return;
    }

    if (node.notePath) {
      const file = this.app.vault.getAbstractFileByPath(node.notePath);
      if (file instanceof TFile) {
        await this.app.workspace.getLeaf(true).openFile(file);
        return;
      }
      node.notePath = null;
    }

    try {
      const folder = normalizePath(this.plugin.settings.noteFolder.trim() || DEFAULT_SETTINGS.noteFolder);
      await this.ensureFolder(folder);
      const base = slugify(node.title);
      let path = `${folder}/${base}.md`;
      let count = 2;
      while (this.app.vault.getAbstractFileByPath(path)) {
        path = `${folder}/${base}-${count}.md`;
        count += 1;
      }
      const content = `# ${node.title}\n\n`;
      const file = await this.app.vault.create(path, content);
      node.notePath = file.path;
      this.render();
      this.saveSoon();
      if (this.plugin.settings.autoOpenNewNote) {
        await this.app.workspace.getLeaf(true).openFile(file);
      }
    } catch (error) {
      console.error(error);
      new Notice("Could not create note for this node.");
    }
  }

  async linkSelectedNodeToActiveNote() {
    const node = this.getSelectedNode();
    if (!node) {
      new Notice("Select a node first.");
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!(activeFile instanceof TFile) || activeFile.extension !== "md") {
      new Notice("Open a Markdown note first.");
      return;
    }

    node.notePath = activeFile.path;
    this.render();
    this.saveSoon();
    new Notice(`Linked node to ${activeFile.basename}`);
  }

  async ensureFolder(path) {
    const parts = normalizePath(path).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  runAutoLayout() {
    autoLayout(this.nodes);
    this.render();
    this.centerOnRoot();
    this.saveSoon();
  }

  centerOnRoot() {
    const root = this.nodes.find((node) => !node.parentId) || this.nodes[0];
    if (!root) return;
    const rect = this.viewportEl.getBoundingClientRect();
    this.panX = rect.width / 2 - (root.x + root.width / 2) * this.scale;
    this.panY = rect.height / 2 - (root.y + root.height / 2) * this.scale;
    this.applyTransform();
  }

  resetMap() {
    const confirmed = window.confirm("Reset the current map? This deletes all nodes in the active map.");
    if (!confirmed) return;

    this.plugin.data.map = {
      id: uid("map"),
      name: this.plugin.settings.mapName,
      nodes: [
        {
          id: uid("node"),
          title: this.plugin.settings.mapName,
          x: 120,
          y: 120,
          width: 220,
          height: 90,
          parentId: null,
          notePath: null,
        },
      ],
    };
    this.selectedNodeId = this.plugin.data.map.nodes[0].id;
    this.scale = 1;
    this.panX = 200;
    this.panY = 160;
    this.render();
    this.plugin.saveState();
  }

  deleteSelectedNode() {
    const selected = this.getSelectedNode();
    if (!selected) return;
    if (!selected.parentId) {
      new Notice("Root node cannot be deleted.");
      return;
    }

    const ids = collectBranchIds(this.nodes, selected.id);
    this.plugin.data.map.nodes = this.nodes.filter((node) => !ids.has(node.id));
    this.selectedNodeId = this.nodes.find((node) => node.parentId === selected.parentId)?.id || this.nodes[0]?.id || null;
    this.render();
    this.saveSoon();
  }
}

class MindNoteMapSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Default note folder")
      .setDesc("New notes created from nodes go into this folder.")
      .addText((text) => {
        text.setPlaceholder(DEFAULT_SETTINGS.noteFolder)
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value.trim() || DEFAULT_SETTINGS.noteFolder;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Default map name")
      .setDesc("Used for the root title when you reset the active map.")
      .addText((text) => {
        text.setValue(this.plugin.settings.mapName)
          .onChange(async (value) => {
            this.plugin.settings.mapName = value.trim() || DEFAULT_SETTINGS.mapName;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Open note after creating")
      .setDesc("Open the new Markdown note immediately after it is created from a node.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.autoOpenNewNote).onChange(async (value) => {
          this.plugin.settings.autoOpenNewNote = value;
          await this.plugin.saveSettings();
        });
      });
  }
}

module.exports = class MindNoteMapPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    await this.loadPluginState();

    this.registerView(VIEW_TYPE, (leaf) => new MindNoteMapView(leaf, this));

    this.addRibbonIcon("network", "Open mind map", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-mind-map",
      name: "Open mind map",
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "add-child-to-selected-node",
      name: "Add child to selected node",
      callback: () => this.withView((view) => view.addChild()),
    });

    this.addCommand({
      id: "add-sibling-to-selected-node",
      name: "Add sibling to selected node",
      callback: () => this.withView((view) => view.addSibling()),
    });

    this.addCommand({
      id: "open-or-create-note-for-selected-node",
      name: "Open or create note for selected node",
      callback: () => this.withView((view) => view.openOrCreateSelectedNote()),
    });

    this.addCommand({
      id: "link-selected-node-to-active-note",
      name: "Link selected node to active note",
      callback: () => this.withView((view) => view.linkSelectedNodeToActiveNote()),
    });

    this.addCommand({
      id: "auto-layout-active-map",
      name: "Auto layout active map",
      callback: () => this.withView((view) => view.runAutoLayout()),
    });

    this.addCommand({
      id: "center-on-root",
      name: "Center on root",
      callback: () => this.withView((view) => view.centerOnRoot()),
    });

    this.addCommand({
      id: "reset-active-map",
      name: "Reset active map",
      callback: () => this.withView((view) => view.resetMap()),
    });

    this.addSettingTab(new MindNoteMapSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      // Keep startup light. No auto-open by default.
    });
  }

  async onunload() {
    await this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings() {
    const raw = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (raw && raw.settings) || {});
  }

  async saveSettings() {
    const data = Object.assign({}, this.data || {}, { settings: this.settings });
    this.data = data;
    await this.saveData(data);
  }

  async loadPluginState() {
    const raw = await this.loadData();
    this.data = Object.assign({ map: null, settings: clone(DEFAULT_SETTINGS) }, raw || {});
    this.settings = Object.assign({}, DEFAULT_SETTINGS, this.data.settings || {});
  }

  async saveState() {
    this.data.settings = this.settings;
    await this.saveData(this.data);
  }

  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    let leaf = leaves[0];

    if (!leaf) {
      leaf = this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }

    this.app.workspace.revealLeaf(leaf);
  }

  withView(callback) {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf || !(leaf.view instanceof MindNoteMapView)) {
      new Notice("Open the mind map first.");
      return;
    }
    callback(leaf.view);
  }
};
