//https://github.com/vasturiano/3d-force-graph?tab=readme-ov-file

const initData = {
  nodes: [],
  links: []
};

const elem = document.getElementById("glCanvas");

const Graph = ForceGraph3D()(elem)
  .linkCurvature('curvature')
  .linkCurveRotation('rotation')
  .linkDirectionalParticles(2)
  .enableNodeDrag(false)
  .graphData(initData);


// Handle messages from the extension
window.addEventListener('message', event => {
  const message = event.data; // The JSON data our extension sent
  switch (message.command) {
    case 'addNode':
      addNode(message.data);
      break;
  }
});


function removeNode(node) {
  let { nodes, links } = Graph.graphData();
  links = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
  nodes.splice(node.id, 1); // Remove node
  nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
  Graph.graphData({ nodes, links });
}

function addNode(newNode) {
  const { nodes, links } = Graph.graphData();
  nodes.push(newNode);
  Graph.graphData({ nodes, links });
}

function addNodeAndLinks(newnode, newlinks) {
  const { nodes, links } = Graph.graphData();
  nodes.push(newnode);
  links.push(newlinks);
  Graph.graphData({ nodes, links });
}
