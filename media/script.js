//https://github.com/vasturiano/3d-force-graph?tab=readme-ov-file

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
  };

  if (!links.includes(graphedge)) {
    links.push(graphedge);
    try {
      Graph.graphData({ nodes, links });
      sendLogMessage(`Script - Edge added ${newEdge.source} -> ${newEdge.target}`, 'Info');
    } catch (e) {
      console.error('Knowledge View - Panel Script - Error adding edge', e);
      sendLogMessage(`Script - Error adding edge ${newEdge.source} -> ${newEdge.target}`, 'Error');
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

const Graph = ForceGraph3D()(elem)
  .enableNodeDrag(false)
  .backgroundColor(backgroundcolour)
  .graphData(initData);