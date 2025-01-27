//https://github.com/vasturiano/3d-force-graph?tab=readme-ov-file
import { CSS2DRenderer, CSS2DObject } from "CSS2D";
import SpriteText from "SpriteText";
import { UnrealBloomPass } from "//unpkg.com/three/examples/jsm/postprocessing/UnrealBloomPass.js";

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
      var width = window.innerWidth,
        height = window.innerHeight;
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

const elem = document.getElementById("glCanvas");
const backgroundcolour = window
  .getComputedStyle(document.body)
  .getPropertyValue("--vscode-editor-background");

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
  sendLogMessage(`Script - Cleared Graph`, "Info");
}

function addNode(newNode) {
  const { nodes, links } = Graph.graphData();
  console.info("Knowledge View - Panel Script - Adding node", newNode);

  const graphnode = {
    id: newNode.id,
    name: newNode.name,
    group: newNode.nodetype,
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

  const graphnode = {
    id: node.id,
    name: node.name,
    group: node.nodetype,
  };

  const index = nodes.findIndex((n) => n.id === node.id);
  if (index > -1) {
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
  .nodeResolution([12])
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
    const index = initData.links.indexOf((l) => l.source.id === link.source.id);
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
