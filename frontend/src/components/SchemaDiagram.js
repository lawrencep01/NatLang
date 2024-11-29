import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConnectionContext } from "../contexts/ConnectionContext";
import api from "../services/api";
import ERNode from "./ERNode";
import ELK from 'elkjs/lib/elk.bundled.js';

// SchemaDiagram.js

const getLayoutedElements = async (nodes, edges) => {
  const elk = new ELK();
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', // Uses the layered algorithm suitable for hierarchical layouts
      'elk.direction': 'RIGHT', // Sets the direction of the layout from left to right
      'elk.layered.spacing.nodeNodeBetweenLayers': 80, // Spacing between nodes in different layers
      'elk.layered.nodePlacement.strategy': 'LINEAR', // Places nodes in a linear fashion within layers
      'elk.layered.edgeRouting': 'ORTHOGONAL', // Routes edges orthogonally for cleaner connections
      'elk.spacing.nodeNode': 100, // General spacing between nodes to prevent overlap
      'elk.spacing.edgeEdge': 50, // Spacing between edges to reduce clutter
      'elk.layered.nodePlacement.padding': '[top=30, left=30, bottom=30, right=30]', // Padding around nodes to ensure adequate spacing
      'elk.layered.concentrateEdges': 'true', // Concentrates edges to minimize crossings and overlaps
      'elk.layered.nodeOverlapRemoval': 'true', // Removes overlapping nodes for a clearer layout
      'elk.layered.nodePlacement.independent': 'false', // Disallows independent node placement to maintain structure
    },
    children: nodes.map(node => ({
      id: node.id,
      width: 150 + (node.data.columns.length * 10), // Dynamic width based on the number of columns
      height: 50 + (node.data.columns.length * 20), // Dynamic height based on the number of columns
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layout = await elk.layout(graph);
    const layoutedNodes = nodes.map(node => {
      const nodeLayout = layout.children.find(n => n.id === node.id);
      return {
        ...node,
        position: { x: nodeLayout.x, y: nodeLayout.y },
        targetPosition: 'left',
        sourcePosition: 'right',
      };
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('ELK layout error:', error);
    return { nodes, edges };
  }
};

const SchemaDiagram = () => {
  const { connectionId } = useContext(ConnectionContext);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const nodeTypes = useMemo(() => ({ erNode: ERNode }), []);

  useEffect(() => {
    if (connectionId) {
      const fetchSchema = async () => {
        try {
          const response = await api.get(`/schema?connection_id=${connectionId}`);
          const schema = response.data.schema;

          const fetchedNodes = [];
          const fetchedEdges = [];

          Object.keys(schema).forEach(tableName => {
            fetchedNodes.push({
              id: tableName,
              type: 'erNode',
              data: { 
                label: tableName, 
                columns: schema[tableName],
                onHover: setHoveredColumn,
              },
              position: { x: 0, y: 0 },
            });

            schema[tableName].forEach(column => {
              if (column.foreign_keys && column.foreign_keys.length > 0) {
                column.foreign_keys.forEach(fk => {
                  fetchedEdges.push({
                    id: `e${tableName}-${column.name}-${fk.table}-${fk.column}`,
                    source: tableName,
                    sourceHandle: `${column.name}-source`,
                    target: fk.table,
                    targetHandle: `${fk.column}-target`,
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' },
                    data: {
                      sourceColumn: `${tableName}.${column.name}`,
                      targetColumn: `${fk.table}.${fk.column}`,
                    },
                  });
                });
              }
            });
          });

          const layoutedElements = await getLayoutedElements(fetchedNodes, fetchedEdges);
          setNodes(layoutedElements.nodes);
          setEdges(layoutedElements.edges);
          
        } catch (err) {
          setError('Failed to fetch schema information.');
        }
      };
      fetchSchema();
    }
  }, [connectionId]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Update edge styles based on hoveredColumn
  useEffect(() => {
    setEdges((eds) =>
      eds.map(edge => ({
        ...edge,
        style: edge.data.sourceColumn === hoveredColumn || edge.data.targetColumn === hoveredColumn
          ? { stroke: '#00008B', strokeWidth: 2 }
          : {},
        markerEnd: edge.data.sourceColumn === hoveredColumn || edge.data.targetColumn === hoveredColumn
          ? { type: 'arrowclosed', color: '#00008B' }
          : { type: 'arrowclosed' },
      }))
    );
  }, [hoveredColumn]);

  return (
    <div className="w-screen h-[94vh]">
      {error && (
        <div className="text-red-500 font-bold text-center mt-4">{error}</div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SchemaDiagram;