//https://github.com/vasturiano/3d-force-graph?tab=readme-ov-file
import { CSS2DRenderer, CSS2DObject } from "CSS2D";
import SpriteText from "SpriteText";
import { UnrealBloomPass } from "UnrealBloom";

console.log("Knowledge View - Panel Script - DOM Loaded");
let vscode;
if (typeof acquireVsCodeApi !== "undefined") {
  console.log("Knowledge View - Panel Script - acquireVsCodeApi is defined");
  vscode = acquireVsCodeApi();

  // Notify the extension when the webview has loaded
  window.addEventListener("DOMContentLoaded", () => {
    vscode.postMessage({ command: "WebViewLoaded" });
  });

  window.addEventListener(
    "resize",
    function (event) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      Graph.width(width).height(height);
    },
    true
  );
} else {
  console.error("acquireVsCodeApi is undefined");
}

const initData = {
  nodes: [],
  links: [],
};

// Tag state
let clusterMode = "type"; // "type" | "tag"
let allUsedTags = [];
let selectedNodeForTagging = null;

const elem = document.getElementById("glCanvas");
const backgroundcolour = window
  .getComputedStyle(document.body)
  .getPropertyValue("--vscode-editor-background");

// Build tag panel UI
buildTagPanel();

// Handle messages from the extension
window.addEventListener("message", (event) => {
  const message = event.data; // The JSON data our extension sent
  switch (message.command) {
    case "addNode":
      addNode(message.node);
      break;
    case "removeNode":
      removeNode(message.node);
      break;
    case "addEdge":
      addEdge(message.node);
      break;
    case "updateEdge":
      updateEdge(message.node);
      break;
    case "removeEdge":
      removeEdge(message.node);
      break;
    case "clearView":
      clearGraph();
      break;
    case "setBackgroundColor":
      document.body.style.backgroundColor = message.color;
      break;
    case "nodeTagsUpdated":
      handleNodeTagsUpdated(message.nodeId, message.tags, message.allTags);
      break;
    case "allTagsData":
      updateAllTagsUI(message.allTags);
      break;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "d" && event.ctrlKey) {
    // Ctrl + D to toggle debug overlay
    toggleDebugTools();
  }
});

function clearGraph() {
  Graph.graphData(initData);
  selectedNodeForTagging = null;
  updateNodeTagEditorUI();
  sendLogMessage(`Script - Cleared Graph`, "Info");
}

function addNode(newNode) {
  const { nodes, links } = Graph.graphData();
  console.info("Knowledge View - Panel Script - Adding node", newNode);

  const graphnode = {
    id: newNode.id,
    name: newNode.name,
    group: resolveGroup(newNode),
    tags: newNode.tags || [],
    nodetype: newNode.nodetype,
  };

  if (nodes.find((n) => n.id === newNode.id) === undefined) {
    nodes.push(graphnode);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(`Script - Node added ${newNode.name}`, "Info");
    } catch (e) {
      console.error("Knowledge View - Panel Script - Error adding node", e);
      sendLogMessage(`Script - Error adding node ${newNode.name}`, "Error");
    }
  } else {
    console.info("Knowledge View - Panel Script - Duplicate node", newNode);
    sendLogMessage(`Script - Node already exists`, "Info");
  }
}

function addEdge(newEdge) {
  const { nodes, links } = Graph.graphData();
  console.info("Knowledge View - Panel Script - Adding edge", newEdge);

  const graphedge = {
    source: newEdge.source.id,
    target: newEdge.target.id,
    relationship: newEdge.relationship,
    weight: newEdge.weight,
  };

  if (
    links.find(
      (l) =>
        l.source.id === newEdge.source.id && l.target.id === newEdge.target.id
    ) === undefined
  ) {
    links.push(graphedge);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(
        `Script - Edge added ${newEdge.source.id} -> ${newEdge.target.id}`,
        "Info"
      );
    } catch (e) {
      console.error("Knowledge View - Panel Script - Error adding edge", e);
      sendLogMessage(
        `Script - Error adding edge ${newEdge.source.id} -> ${newEdge.target.id}`,
        "Error"
      );
    }
  } else {
    console.info("Knowledge View - Panel Script - Duplicate edge", newEdge);
    sendLogMessage(`Script - Edge already exists`, "Info");
  }
}

function updateEdge(edge) {
  const { nodes, links } = Graph.graphData();
  const index = links.findIndex(
    (l) => l.source.id === edge.source.id && l.target.id === edge.target.id
  );
  links[index] = edge;
  Graph.graphData({ nodes, links });
}

function removeNode(node) {
  const { nodes, links } = Graph.graphData();
  console.info("Knowledge View - Panel Script - Removing node", node);

  const index = nodes.findIndex((n) => n.id === node.id);
  if (index > -1) {
    if (selectedNodeForTagging && selectedNodeForTagging.id === node.id) {
      selectedNodeForTagging = null;
      updateNodeTagEditorUI();
    }
    removeNodeEdges(node);
    nodes.splice(index, 1);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(`Script - Node removed ${node.name}`, "Info");
    } catch (e) {
      console.error("Knowledge View - Panel Script - Error removing node", e);
      sendLogMessage(`Script - Error removing node ${node.name}`, "Error");
    }
  } else {
    console.info("Knowledge View - Panel Script - Node not found", node);
    sendLogMessage(`Script - Node not found`, "Info");
  }
}

function removeNodeEdges(node) {
  const { nodes, links } = Graph.graphData();

  const nodeEdges = links.filter(
    (l) => l.source.id === node.id || l.target.id === node.id
  );
  console.info(
    "Knowledge View - Panel Script - Removing node edges",
    nodeEdges
  );

  if (nodeEdges.length > 0) {
    nodeEdges.forEach((edge) => {
      removeEdge(edge);
    });
  } else {
    console.info(
      "Knowledge View - Panel Script - Node edges not found",
      node.id
    );
    sendLogMessage(`Script - Node edges not found`, "Info");
  }
}

function removeEdge(edge) {
  const { nodes, links } = Graph.graphData();
  console.info("Knowledge View - Panel Script - Removing edge", edge);

  const index = links.findIndex(
    (l) => l.source.id === edge.source.id && l.target.id === edge.target.id
  );
  if (index > -1) {
    links.splice(index, 1);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(
        `Script - Edge removed ${edge.source.id} -> ${edge.target.id}`,
        "Info"
      );
    } catch (e) {
      console.error("Knowledge View - Panel Script - Error removing edge", e);
      sendLogMessage(
        `Script - Error removing edge ${edge.source.id} -> ${edge.target.id}`,
        "Error"
      );
    }
  } else {
    console.info("Knowledge View - Panel Script - Edge not found", edge);
    sendLogMessage(`Script - Edge not found`, "Info");
  }
}

// ── Tag support ──────────────────────────────────────────────────────────────

/**
 * Returns the group value used by the force-graph for colour coding and
 * clustering.  When clusterMode is "tag" the primary tag is used; when it is
 * "type" the node type is used.
 */
function resolveGroup(node) {
  if (clusterMode === "tag" && node.tags && node.tags.length > 0) {
    return node.tags[0];
  }
  return node.nodetype || node.group || "unknown";
}

/**
 * Rebuild group values for every node in the graph and refresh the display.
 * Called whenever the cluster mode is toggled.
 */
function refreshAllNodeGroups() {
  const { nodes, links } = Graph.graphData();
  nodes.forEach((n) => {
    n.group = resolveGroup(n);
  });
  Graph.graphData({ nodes, links });
}

/** Handle a nodeTagsUpdated message from the extension. */
function handleNodeTagsUpdated(nodeId, tags, allTagsList) {
  const { nodes, links } = Graph.graphData();
  const node = nodes.find((n) => n.id === nodeId);
  if (node) {
    node.tags = tags;
    node.group = resolveGroup(node);
    Graph.graphData({ nodes, links });
  }

  // Keep selected node in sync
  if (selectedNodeForTagging && selectedNodeForTagging.id === nodeId) {
    selectedNodeForTagging.tags = tags;
    updateNodeTagEditorUI();
  }

  if (allTagsList) {
    updateAllTagsUI(allTagsList);
  }
}

/** Populate the datalist with all previously used tags. */
function updateAllTagsUI(tags) {
  allUsedTags = tags || [];
  const datalist = document.getElementById("tagSuggestions");
  if (datalist) {
    datalist.innerHTML = "";
    allUsedTags.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      datalist.appendChild(opt);
    });
  }

  // Refresh tag filter buttons
  const tagFilters = document.getElementById("tagFilters");
  if (tagFilters) {
    tagFilters.innerHTML = "";
    allUsedTags.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "tag-filter-btn";
      btn.textContent = t;
      btn.title = `Filter by tag: ${t}`;
      btn.addEventListener("click", () => highlightByTag(t));
      tagFilters.appendChild(btn);
    });
  }
}

// Highlight colours used when filtering by tag
const HIGHLIGHT_COLOR = "#00ff88";
const DIMMED_COLOR = "rgba(100,100,100,0.2)";

/** Highlight nodes that have the given tag (dim all others). */
function highlightByTag(tag) {
  const { nodes } = Graph.graphData();
  nodes.forEach((n) => {
    n.__highlighted = n.tags && n.tags.includes(tag);
  });
  // Force a re-render by triggering a small update
  Graph.nodeColor((n) => {
    if (n.__highlighted === undefined) {
      return n.color;
    }
    return n.__highlighted ? HIGHLIGHT_COLOR : DIMMED_COLOR;
  });
  sendLogMessage(`Script - Highlighted nodes with tag: ${tag}`, "Info");
}

/** Build the persistent tag panel overlay. */
function buildTagPanel() {
  const panel = document.createElement("div");
  panel.id = "tagPanel";
  panel.innerHTML = `
    <div id="clusterControls">
      <span class="panel-label">Cluster by:</span>
      <button id="clusterByType" class="cluster-btn active" title="Cluster nodes by type">Type</button>
      <button id="clusterByTag" class="cluster-btn" title="Cluster nodes by their first tag">Tag</button>
    </div>
    <div id="tagFilters"></div>
    <div id="nodeTagEditor" class="hidden">
      <div id="nodeTagEditorTitle" class="panel-label"></div>
      <div id="currentTags"></div>
      <div id="addTagForm">
        <input id="tagInput" list="tagSuggestions" placeholder="Add tag…" autocomplete="off">
        <datalist id="tagSuggestions"></datalist>
        <button id="addTagBtn" title="Add tag">＋</button>
      </div>
      <button id="closeTagEditor" title="Close">✕</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Cluster mode buttons
  document.getElementById("clusterByType").addEventListener("click", () => {
    clusterMode = "type";
    document.getElementById("clusterByType").classList.add("active");
    document.getElementById("clusterByTag").classList.remove("active");
    refreshAllNodeGroups();
    Graph.nodeAutoColorBy("group");
    sendLogMessage(`Script - Cluster mode: type`, "Info");
  });

  document.getElementById("clusterByTag").addEventListener("click", () => {
    clusterMode = "tag";
    document.getElementById("clusterByTag").classList.add("active");
    document.getElementById("clusterByType").classList.remove("active");
    refreshAllNodeGroups();
    Graph.nodeAutoColorBy("group");
    sendLogMessage(`Script - Cluster mode: tag`, "Info");
  });

  // Add tag button
  document.getElementById("addTagBtn").addEventListener("click", () => {
    const input = document.getElementById("tagInput");
    const tag = input.value.trim();
    if (tag && selectedNodeForTagging) {
      sendAddTag(selectedNodeForTagging.id, tag);
      input.value = "";
    }
  });

  // Allow pressing Enter in the tag input
  document.getElementById("tagInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("addTagBtn").click();
    }
  });

  // Close tag editor
  document.getElementById("closeTagEditor").addEventListener("click", () => {
    selectedNodeForTagging = null;
    updateNodeTagEditorUI();
  });
}

/** Refresh the node tag editor panel for the currently selected node. */
function updateNodeTagEditorUI() {
  const editor = document.getElementById("nodeTagEditor");
  if (!editor) {
    return;
  }
  if (!selectedNodeForTagging) {
    editor.classList.add("hidden");
    return;
  }

  editor.classList.remove("hidden");
  document.getElementById("nodeTagEditorTitle").textContent =
    selectedNodeForTagging.name || selectedNodeForTagging.id;

  const currentTagsEl = document.getElementById("currentTags");
  currentTagsEl.innerHTML = "";

  const tags = selectedNodeForTagging.tags || [];
  if (tags.length === 0) {
    const empty = document.createElement("span");
    empty.className = "no-tags";
    empty.textContent = "No tags";
    currentTagsEl.appendChild(empty);
  } else {
    tags.forEach((t) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      const tagText = document.createTextNode(t);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-tag-btn";
      removeBtn.title = "Remove tag";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        sendRemoveTag(selectedNodeForTagging.id, t);
      });
      chip.appendChild(tagText);
      chip.appendChild(removeBtn);
      currentTagsEl.appendChild(chip);
    });
  }
}

function sendAddTag(nodeId, tag) {
  if (typeof vscode !== "undefined") {
    vscode.postMessage({ command: "addTag", nodeId, tag });
  }
}

function sendRemoveTag(nodeId, tag) {
  if (typeof vscode !== "undefined") {
    vscode.postMessage({ command: "removeTag", nodeId, tag });
  }
}

// ── Graph helpers ─────────────────────────────────────────────────────────────

function sendOpenNodeMessage(node) {
  if (typeof vscode === "undefined") {
    console.error("Knowledge View - Panel Script - Executing outside VSCode");
  } else {
    vscode.postMessage({
      command: "openNode",
      filePath: node.id,
    });
  }
}
function sendLogMessage(message, level) {
  if (typeof vscode === "undefined") {
    console.error("Knowledge View - Panel Script -Executing outside VSCode");
  } else {
    vscode.postMessage({
      command: "log",
      text: message,
      level: level,
    });
  }
}

function calculateRotation(index, totalEdges) {
  return (Math.PI * index) / totalEdges;
}

function arcPath(leftHand, d) {
  var start = leftHand ? d.source : d.target,
    end = leftHand ? d.target : d.source,
    dx = end.x - start.x,
    dy = end.y - start.y,
    dr = Math.sqrt(dx * dx + dy * dy),
    sweep = leftHand ? 0 : 1;
  return (
    "M" +
    start.x +
    "," +
    start.y +
    "A" +
    dr +
    "," +
    dr +
    " 0 0," +
    sweep +
    " " +
    end.x +
    "," +
    end.y
  );
}

function getQuadraticXYZ(t, s, cp1, e) {
  return {
    x: (1 - t) * (1 - t) * s.x + 2 * (1 - t) * t * cp1.x + t * t * e.x,
    y: (1 - t) * (1 - t) * s.y + 2 * (1 - t) * t * cp1.y + t * t * e.y,
    z: (1 - t) * (1 - t) * s.z + 2 * (1 - t) * t * cp1.z + t * t * e.z,
  };
}

const Graph = ForceGraph3D({
  extraRenderers: [new CSS2DRenderer()],
})(elem)
  .enableNodeDrag(false)
  .backgroundColor(backgroundcolour)
  .nodeAutoColorBy("group")
  .nodeLabel("name")
  .nodeResolution(12)
  .nodeThreeObjectExtend(true)
  .nodeThreeObject((node) => {
    const nodeEl = document.createElement("div");
    nodeEl.textContent = node.name;
    nodeEl.style.color = node.color;
    nodeEl.className = "node-label";
    return new CSS2DObject(nodeEl);
  })
  .linkAutoColorBy("relationship")
  .linkCurvature((link) => {
    if (link.curvature === undefined) {
      const totaledges = initData.links.filter(
        (l) =>
          (l.source.id === link.source.id && l.target.id === link.target.id) ||
          (l.target.id === link.source.id && l.source.id === link.target.id)
      ).length;
      link.curvature = 0;
      if (totaledges > 1 || link.source.id === link.target.id) {
        link.curvature = 0.8;
      }
    }
    return link.curvature;
  })
  .linkCurveRotation((link) => {
    const totaledges = initData.links.filter(
      (l) => l.source.id === link.source.id
    ).length;
    const index = initData.links.findIndex((l) => l.source.id === link.source.id);
    return calculateRotation(index, totaledges);
  })
  .linkDirectionalParticleWidth((link) => {
    return 1;
  })
  //.linkDirectionalParticleSpeed(d => d.value * 0.001)
  .linkDirectionalParticles((link) => {
    return 1;
  })
  .linkThreeObjectExtend(true)
  .linkThreeObject((link) => {
    const sprite = new SpriteText(`${link.relationship}`);
    sprite.color = "lightgrey";
    sprite.textHeight = 2;
    sprite.link = link;
    return sprite;
  })
  .onNodeClick((node) => {
    selectedNodeForTagging = node;
    updateNodeTagEditorUI();
    // Request all tags to keep the datalist up to date
    if (typeof vscode !== "undefined") {
      vscode.postMessage({ command: "requestAllTags" });
    }
    sendOpenNodeMessage(node);
  })
  .linkPositionUpdate((sprite, { start, end }) => {
    if (sprite.link.__curve) {
      let textPos = getQuadraticXYZ(0.5, start, sprite.link.__curve.v1, end);
      if (sprite.link.source === sprite.link.target) {
        textPos = getQuadraticXYZ(
          0.5,
          sprite.link.__curve.v1,
          sprite.link.__curve.v2,
          sprite.link.__curve.v3
        );
      }
      Object.assign(sprite.position, textPos);
    } else {
      const middlePos = Object.assign(
        ...["x", "y", "z"].map((c) => ({
          [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
        }))
      );

      Object.assign(sprite.position, middlePos);
    }
  })
  .graphData(initData);
