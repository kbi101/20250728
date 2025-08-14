import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

// Helper functions for cookies
const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0)===' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
};

const App = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNode, setNewNode] = useState('');
  const [newNodeLabels, setNewNodeLabels] = useState(''); // New state for labels
  const [newNodeDesc, setNewNodeDesc] = useState(''); // New state for node description
  const [availableLabels, setAvailableLabels] = useState([]); // New state for available labels
  const [newEdge, setNewEdge] = useState({ source: { id: '', name: '' }, target: { id: '', name: '' } });
  const [newEdgeType, setNewEdgeType] = useState(''); // New state for edge type
  const [availableRelationshipTypes, setAvailableRelationshipTypes] = useState([]); // New state for available relationship types
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null); // New state for hovered link
  const [hoveredNode, setHoveredNode] = useState(null); // New state for hovered node
  const [nodeNameFilter, setNodeNameFilter] = useState('');
  const [nodeLabelFilter, setNodeLabelFilter] = useState('');
  const [edgeTypeFilter, setEdgeTypeFilter] = useState('');
  const graphRef = useRef();

  const fetchGraph = useCallback(async (filters = {}) => {
    try {
      const params = {
        name_filter: filters.nodeNameFilter || undefined,
        label_filter: filters.nodeLabelFilter || undefined,
        type_filter: filters.edgeTypeFilter || undefined,
      };
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/utils/export`, { params });
      const nodes = response.data.nodes.map(node => ({
        id: node.id,
        name: node.properties.name || node.id,
        x: node.properties.x,
        y: node.properties.y,
        val: 10,
        properties: node.properties // Include all properties
      }));
      const links = response.data.relations.map(relation => ({
        source: relation.startNode,
        target: relation.endNode,
        type: relation.type, // Include the type property
      }));
      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching graph:', error);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/labels`);
      setAvailableLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, []);

  const fetchRelationshipTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/relationship_types`);
      setAvailableRelationshipTypes(response.data);
    } catch (error) {
      console.error('Error fetching relationship types:', error);
    }
  }, []);

  useEffect(() => {
    const savedFilters = getCookie('graphFilters');
    console.log('Saved filters from cookie:', savedFilters);
    let initialFilters = {};
    if (savedFilters) {
      initialFilters = JSON.parse(savedFilters);
      setNodeNameFilter(initialFilters.nodeNameFilter || '');
      setNodeLabelFilter(initialFilters.nodeLabelFilter || '');
      setEdgeTypeFilter(initialFilters.edgeTypeFilter || '');
      console.log('Initial filters applied:', initialFilters);
      console.log('Node Name Filter state:', initialFilters.nodeNameFilter || '');
      console.log('Node Label Filter state:', initialFilters.nodeLabelFilter || '');
      console.log('Edge Type Filter state:', initialFilters.edgeTypeFilter || '');
    }
    fetchGraph(initialFilters); // Initial fetch with filters from cookie
    fetchLabels();
    fetchRelationshipTypes(); // Fetch relationship types when component mounts
  }, [fetchGraph, fetchLabels, fetchRelationshipTypes]);

  const handleSearch = () => {
    const filters = { nodeNameFilter, nodeLabelFilter, edgeTypeFilter };
    setCookie('graphFilters', JSON.stringify(filters), 7); // Save for 7 days
    fetchGraph(filters);
  };

  const handleAddNode = async () => {
    if (!newNode.trim()) {
      alert('Node name cannot be empty');
      return;
    }
    const labelsArray = newNodeLabels.split(',').map(label => label.trim()).filter(label => label !== '');
    if (labelsArray.length === 0) {
      labelsArray.push('Custom'); // Default label if none provided
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/nodes`, { 
        labels: labelsArray, 
        properties: { name: newNode, x: 0, y: 0, desc: newNodeDesc } 
      });
      setNewNode('');
      setNewNodeLabels(''); // Clear labels input
      setNewNodeDesc(''); // Clear description input
      fetchGraph({ nodeNameFilter, nodeLabelFilter, edgeTypeFilter });
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const handleAddEdge = async () => {
    if (!newEdge.source.id || !newEdge.target.id) {
      alert('Both source and target nodes must be selected');
      return;
    }
    const edgeType = newEdgeType.trim() || 'RELATED_TO'; // Default type if none provided
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/relations`, { 
        startNode: newEdge.source.id, 
        endNode: newEdge.target.id, 
        type: edgeType,
        properties: {}
      });
      setNewEdge({ source: { id: '', name: '' }, target: { id: '', name: '' } });
      setNewEdgeType(''); // Clear edge type input
      fetchGraph({ nodeNameFilter, nodeLabelFilter, edgeTypeFilter });
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  };

  const handleNodeDragEnd = async (node) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/nodes/${node.id}`, {
        properties: { x: node.x, y: node.y }
      });
    } catch (error) {
      console.error('Error updating node position:', error);
    }
  };

  const handleNodeRightClick = (node, event) => {
    setContextMenu({
      node,
      x: event.pageX,
      y: event.pageY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }} onClick={closeContextMenu}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        onNodeDragEnd={handleNodeDragEnd}
        onNodeRightClick={handleNodeRightClick}
        onNodeHover={node => setHoveredNode(node)} // New prop for node hover
        cooldownTicks={0}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`; // Make font bold
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = '#00008B'; // Dark Blue for stroke
          ctx.beginPath();
          ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false); // Node size 3
          ctx.stroke(); // Draw stroke instead of fill
          ctx.fillStyle = 'black';
          ctx.fillText(label, node.x, node.y + 10);

          // Display description on hover
          if (node === hoveredNode) {
            const desc = node.properties?.desc || node.name; // Use desc or default to name
            ctx.font = `${fontSize}px Sans-Serif`; // Regular font for description
            ctx.fillStyle = 'gray';
            ctx.fillText(desc, node.x, node.y + 25); // Display description below name
          }
        }}
        nodeVal={10}
        nodeRelSize={5}
        linkLabel="type"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onLinkHover={link => setHoveredLink(link)}
        linkCanvasObject={(link, ctx, color) => {
          const start = link.source;
          const end = link.target;

          // ignore if link not yet rendered
          if (!start || !end) return;

          const nodeRadius = 3; // Assuming node radius is 3, same as in nodeCanvasObject

          // Adjust start and end points to circumference of nodes
          const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          const startX = start.x + (nodeRadius * (end.x - start.x)) / dist;
          const startY = start.y + (nodeRadius * (end.y - start.y)) / dist;
          const endX = end.x - (nodeRadius * (end.x - start.x)) / dist;
          const endY = end.y - (nodeRadius * (end.y - startY)) / dist;

          // Draw link line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          // Calculate midpoint
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          // Calculate perpendicular vector
          const dx = endX - startX;
          const dy = endY - startY;
          const perpendicularDx = -dy;
          const perpendicularDy = dx;

          // Normalize perpendicular vector
          const norm = Math.sqrt(perpendicularDx * perpendicularDx + perpendicularDy * perpendicularDy);
          const normalizedPerpendicularDx = perpendicularDx / norm;
          const normalizedPerpendicularDy = perpendicularDy / norm;

          // Control point offset (adjust for desired curvature)
          const curveOffset = 20; // Adjust this value for more or less curve

          const controlX = midX + normalizedPerpendicularDx * curveOffset;
          const controlY = midY + normalizedPerpendicularDy * curveOffset;

          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          ctx.strokeStyle = color; // Use default link color
          ctx.lineWidth = 0.5; // Link line width 0.5
          ctx.stroke();

          // Draw arrow
          const ARROW_LENGTH = 5; // Length of the arrow head
          const ARROW_WIDTH = 3; // Width of the arrow head

          const angle = Math.atan2(endY - startY, endX - startX);

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - ARROW_LENGTH * Math.cos(angle - Math.PI / 6), endY - ARROW_LENGTH * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(endX - ARROW_LENGTH * Math.cos(angle + Math.PI / 6), endY - ARROW_LENGTH * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.strokeStyle = color; // Use default link color for arrow stroke
          ctx.stroke(); // Draw stroke instead of fill

          // Draw type on hover
          if (link === hoveredLink) {
            const interpolate = (start, end, t) => ({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
            const p = interpolate(start, end, 0.5); // Mid-point of the link

            const fontSize = 12 / (graphRef.current?.zoom() || 1);
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.fillText(link.type, p.x, p.y - 5); // Display type slightly above the link
          }
        }}
      />
      {contextMenu && (
        <div 
          style={{ 
            position: 'absolute', 
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            zIndex: 1000 
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <div style={{ cursor: 'pointer' }} onClick={() => { setNewEdge({ ...newEdge, source: { id: contextMenu.node.id, name: contextMenu.node.name } }); closeContextMenu(); }}>Set as Source</div>
          <div style={{ cursor: 'pointer' }} onClick={() => { setNewEdge({ ...newEdge, target: { id: contextMenu.node.id, name: contextMenu.node.name } }); closeContextMenu(); }}>Set as Target</div>
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: isPanelOpen ? '10px' : '-300px',
        width: '300px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid #ccc',
        borderRadius: '5px',
        transition: 'right 0.3s ease-in-out'
      }}>
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          style={{ 
            position: 'absolute',
            left: '-30px',
            top: '10px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRight: 'none',
            padding: '10px 5px',
            cursor: 'pointer'
          }}
        >
          {isPanelOpen ? '<' : '>'}
        </button>
        <h2>Control Panel</h2>
        <div style={{ marginBottom: '20px' }}>
          <h3>Search and Filter</h3>
          <input
            type="text"
            value={nodeNameFilter}
            onChange={(e) => setNodeNameFilter(e.target.value)}
            placeholder="Filter by Node Name"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="text"
            value={nodeLabelFilter}
            onChange={(e) => setNodeLabelFilter(e.target.value)}
            placeholder="Filter by Node Label"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="text"
            value={edgeTypeFilter}
            onChange={(e) => setEdgeTypeFilter(e.target.value)}
            placeholder="Filter by Edge Type"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <button onClick={handleSearch} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Apply Filters</button>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h3>Add Node</h3>
          <input
            type="text"
            value={newNode}
            onChange={(e) => setNewNode(e.target.value)}
            placeholder="Node name"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          <input
            type="text"
            value={newNodeLabels}
            onChange={(e) => setNewNodeLabels(e.target.value)}
            placeholder="Labels (comma-separated)"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '10px' }}
          />
          {availableLabels.length > 0 && (
            <select
              multiple
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                setNewNodeLabels(selectedOptions.join(','));
              }}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '10px', minHeight: '50px' }}
            >
              {availableLabels.map(label => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={newNodeDesc}
            onChange={(e) => setNewNodeDesc(e.target.value)}
            placeholder="Description (optional)"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '10px' }}
          />
          <button onClick={handleAddNode} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Add Node</button>
        </div>
        <div>
          <h3>Add Edge</h3>
          <input
            type="text"
            readOnly
            value={newEdge.source.name}
            placeholder="Source Node (Right-click a node)"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="text"
            readOnly
            value={newEdge.target.name}
            placeholder="Target Node (Right-click a node)"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          <input
            type="text"
            value={newEdgeType}
            onChange={(e) => setNewEdgeType(e.target.value)}
            placeholder="Relationship Type"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '10px' }}
          />
          {availableRelationshipTypes.length > 0 && (
            <select
              onChange={(e) => setNewEdgeType(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '10px' }}
            >
              <option value="">Select Type</option>
              {availableRelationshipTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleAddEdge} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Add Edge</button>
        </div>
      </div>
    </div>
  );
};

export default App;
