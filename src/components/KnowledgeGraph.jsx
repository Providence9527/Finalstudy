// src/components/KnowledgeGraph.jsx
import { ForceGraph2D } from 'react-force-graph';
import PropTypes from 'prop-types';

const KnowledgeGraph = ({ data }) => (
  <ForceGraph2D
    graphData={data}
    nodeLabel="name"
    nodeAutoColorBy="group"
    linkDirectionalArrowLength={4}
    linkDirectionalArrowRelPos={1}
    nodeCanvasObject={(node, ctx) => {
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }}
  />
);

KnowledgeGraph.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.array,
    links: PropTypes.array
  }).isRequired
};

export default KnowledgeGraph;