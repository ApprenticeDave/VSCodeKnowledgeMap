//https://github.com/vasturiano/3d-force-graph?tab=readme-ov-file
import { CSS2DRenderer, CSS2DObject } from '//unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';

console.log("Knowledge View - Panel Script - DOM Loaded");
let vscode;
if (typeof acquireVsCodeApi !== 'undefined') {
  console.log("Knowledge View - Panel Script - acquireVsCodeApi is defined");
  vscode = acquireVsCodeApi();
} else {
  console.error('acquireVsCodeApi is undefined');
}

const initData = {
  nodes: [],
  links: []
};
const elem = document.getElementById("glCanvas");
const backgroundcolour = window.getComputedStyle(document.body).getPropertyValue('--vscode-merge-commonContentBackground');

// Handle messages from the extension
window.addEventListener('message', event => {
  const message = event.data; // The JSON data our extension sent
  switch (message.command) {
    case 'addNode':
      addNode(message.node);
      break;
    case 'addEdge':
      addEdge(message.node);
      break;
  }
});

function addNode(newNode) {
  const { nodes, links } = Graph.graphData();
  console.info('Knowledge View - Panel Script - Adding node', newNode);

  const graphnode = {
    id: newNode.id,
    name: newNode.name,
    group: newNode.nodetype,
  };

  if (!nodes.includes(graphnode)) {
    nodes.push(graphnode);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(`Script - Node added ${newNode.name}`, 'Info');
    } catch (e) {
      console.error('Knowledge View - Panel Script - Error adding node', e);
      sendLogMessage(`Script - Error adding node ${newNode.name}`, 'Error');
    }

  } else {
    console.info('Knowledge View - Panel Script - Duplicate node', newNode);
    sendLogMessage(`Script - Node already exists`, 'Info');
  }
}

function addEdge(newEdge) {
  const { nodes, links } = Graph.graphData();
  console.info('Knowledge View - Panel Script - Adding edge', newEdge);

  const graphedge = {
    source: newEdge.source.id,
    target: newEdge.target.id,
    relationship: newEdge.relationship,
  };

  if (!links.includes(graphedge)) {
    links.push(graphedge);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(`Script - Edge added ${newEdge.source.id} -> ${newEdge.target.id}`, 'Info');
    } catch (e) {
      console.error('Knowledge View - Panel Script - Error adding edge', e);
      sendLogMessage(`Script - Error adding edge ${newEdge.source.id} -> ${newEdge.target.id}`, 'Error');
    }

  } else {
    console.info('Knowledge View - Panel Script - Duplicate edge', newEdge);
    sendLogMessage(`Script - Edge already exists`, 'Info');
  }
}


function sendLogMessage(message, level) {
  if (typeof vscode === 'undefined') {
    console.error('Knowledge View - Panel Script -Executing outside VSCode');
  } else {
    vscode.postMessage({
      command: 'log',
      text: message,
      level: level,
    });
  }
}

const Graph = ForceGraph3D({
  extraRenderers: [new CSS2DRenderer()]
})(elem)
  .enableNodeDrag(false)
  .backgroundColor(backgroundcolour)
  .nodeAutoColorBy('group')
  .nodeThreeObjectExtend(true)
  .nodeThreeObject(node => {
    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.style.color = node.color;
    nodeEl.className = 'node-label';
    return new CSS2DObject(nodeEl);
  })
  .graphData(initData);