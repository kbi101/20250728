import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

const App = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [newNode, setNewNode] = useState('');
  const [newNodeLabels, setNewNodeLabels] = useState(''); // New state for labels
  const [availableLabels, setAvailableLabels] = useState([]); // New state for available labels
  const [newEdge, setNewEdge] = useState({ source: { id: '', name: '' }, target: { id: '', name: '' } });
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const graphRef = useRef();

  const fetchGraph = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/utils/export');
      const nodes = response.data.nodes.map(node => ({
        id: node.id,
        name: node.properties.name || node.id,
        x: node.properties.x,
        y: node.properties.y,
        val: 10
      }));
      const links = response.data.relations.map(relation => ({
        source: relation.startNode,
        target: relation.endNode,
      }));
      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching graph:', error);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/labels');
      setAvailableLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
    fetchLabels(); // Fetch labels when component mounts
  }, [fetchGraph, fetchLabels]);

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
      await axios.post('http://localhost:8000/nodes', { 
        labels: labelsArray, 
        properties: { name: newNode, x: 0, y: 0 } 
      });
      setNewNode('');
      setNewNodeLabels(''); // Clear labels input
      fetchGraph();
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const handleAddEdge = async () => {
    if (!newEdge.source.id || !newEdge.target.id) {
      alert('Both source and target nodes must be selected');
      return;
    }
    try {
      await axios.post('http://localhost:8000/relations', { 
        startNode: newEdge.source.id, 
        endNode: newEdge.target.id, 
        type: 'RELATED_TO',
        properties: {}
      });
      setNewEdge({ source: { id: '', name: '' }, target: { id: '', name: '' } });
      fetchGraph();
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  };

  const handleNodeDragEnd = async (node) => {
    try {
      await axios.put(`http://localhost:8000/nodes/${node.id}`, {
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
        cooldownTicks={0}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#00008B'; // Dark Blue
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.fillText(label, node.x, node.y + 10);
        }}
        nodeVal={10}
        nodeRelSize={5}
        linkLabel="type"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
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
          <button onClick={handleAddEdge} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Add Edge</button>
        </div>
      </div>
    </div>
  );
};

export default App;
