import React, { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConnectionContext } from "../contexts/ConnectionContext";
import api from "../services/api";
import ERNode from "./ERNode";
import ELK from 'elkjs/lib/elk.bundled.js';

/**
 * Function to layout nodes and edges using ELK (Eclipse Layout Kernel).
 *
 * @param {Array} nodes - The list of nodes to layout.
 * @param {Array} edges - The list of edges to layout.
 * @returns {Object} - The layouted nodes and edges.
 */
const getLayoutedElements = async (nodes, edges) => {
  const elk = new ELK();
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', // Uses the layered algorithm suitable for ER Diagrams
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

/**
 * SchemaDiagram Component
 *
 * Renders the entity-relationship diagram based on the selected database connection.
 *
 * @returns {JSX.Element} - The rendered SchemaDiagram component.
 */
const SchemaDiagram = () => {
  const { connectionId } = useContext(ConnectionContext); // Retrieves the current connection ID from context
  const [nodes, setNodes] = useState([]); // State to hold the list of nodes
  const [edges, setEdges] = useState([]); // State to hold the list of edges
  const [error, setError] = useState(null); // State to handle any errors during API calls
  const [hoveredColumn, setHoveredColumn] = useState(null); // State to track the currently hovered column
  const nodeTypes = useMemo(() => ({ erNode: ERNode }), []); // Defines custom node types for ReactFlow

  useEffect(() => {
    if (connectionId) {
      /**
       * Fetches the schema for the selected connection and processes nodes and edges.
       */
      const fetchSchema = async () => {
        try {
          const response = await api.get(`/schema?connection_id=${connectionId}`);
          const schema = response.data.schema;

          const fetchedNodes = [];
          const fetchedEdges = [];

          // Iterate over each table in the schema
          Object.keys(schema).forEach(tableName => {
            fetchedNodes.push({
              id: tableName,
              type: 'erNode',
              data: { 
                label: tableName, 
                columns: schema[tableName],
                onHover: setHoveredColumn,
              },
              position: { x: 0, y: 0 }, // Initial position; will be updated by layout
            });

            // Iterate over each column to find foreign keys and create edges
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

          // Apply layout to nodes and edges
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

  /**
   * Handles changes to nodes, updating the state accordingly.
   */
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  /**
   * Handles changes to edges, updating the state accordingly.
   */
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  /**
   * Updates edge styles based on the currently hovered column.
   */
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
      {/* Display error message if fetching schema fails */}
      {error && (
        <div className="text-red-500 font-bold text-center mt-4">{error}</div>
      )}
      {/* ReactFlow component to render the schema diagram */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Background /> {/* Adds a background grid */}
        <Controls /> {/* Adds zoom and pan controls */}
      </ReactFlow>
    </div>
  );
};

export default SchemaDiagram;