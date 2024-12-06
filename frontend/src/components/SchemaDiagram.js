import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConnectionContext } from "../contexts/ConnectionContext";
import api from "../services/api";
import ERNode from "./ERNode";
import ELK from "elkjs/lib/elk.bundled.js";

const SchemaDiagram = () => {
  const { connectionId } = useContext(ConnectionContext);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const nodeTypes = useMemo(() => ({ erNode: ERNode }), []);
  const [layoutApplied, setLayoutApplied] = useState(false);

  const elk = useMemo(() => new ELK(), []);

  const handleDimensionsChange = useCallback((label, width, height) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.data.label === label ? { ...node, width, height } : node
      )
    );
    setLayoutApplied(false);
  }, []);

  const getElkLayoutedElements = useCallback(
    async (nodes, edges) => {
      const elkNodes = nodes.map((node) => {
        const width = node.width || 1; // Default width if not measured yet
        const height = node.height || 1; // Default height if not measured yet
        return {
          id: node.id,
          width,
          height,
        };
      });

      const elkEdges = edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      }));

      const graph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": "UNDEFINED",
          "elk.spacing.nodeNode": "50",
          "elk.layered.spacing.nodeNodeBetweenLayers": "80",
          "elk.edgeRouting": "ORTHOGONAL",
          "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
          "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
          "elk.layered.layering.strategy": "COFFMAN_GRAHAM",
          "elk.layered.layering.coffmanGraham.layerBound": "4",
        },
        children: elkNodes,
        edges: elkEdges,
      };

      const layout = await elk.layout(graph);

      const layoutedNodes = nodes.map((node) => {
        const { x, y } = layout.children.find((n) => n.id === node.id);
        return {
          ...node,
          position: {
            x,
            y,
          },
          positionAbsolute: true,
        };
      });
      return { nodes: layoutedNodes, edges };
    },
    [elk]
  );

  /**
   * Function to generate a color mapping for schemas.
   *
   * @param {Array} schemas - The list of schema names.
   * @returns {Object} - The color mapping for schemas.
   */
  const generateColorMapping = (schemas) => {
    const colors = [
      "bg-red-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-purple-400",
      "bg-pink-400",
      "bg-indigo-400",
      "bg-teal-400",
      "bg-orange-400",
      "bg-gray-400",
    ];

    const colorMapping = {};
    schemas.forEach((schema, index) => {
      colorMapping[schema] = colors[index % colors.length];
    });

    return colorMapping;
  };

  const fetchSchema = useCallback(async () => {
    try {
      const response = await api.get(`/schema?connection_id=${connectionId}`);
      const schema = response.data.schema;

      const fetchedNodes = [];
      const fetchedEdges = [];
      const schemas = Object.keys(schema);
      const colors = generateColorMapping(schemas);

      schemas.forEach((schemaName) => {
        Object.keys(schema[schemaName]).forEach((tableName) => {
          fetchedNodes.push({
            id: `${schemaName}.${tableName}`,
            type: "erNode",
            data: {
              label: tableName,
              schema: schemaName,
              columns: schema[schemaName][tableName],
              onHover: setHoveredColumn,
              color: colors[schemaName],
              onDimensionsChange: handleDimensionsChange, // Pass the callback
            },
          });

          schema[schemaName][tableName].forEach((column) => {
            if (column.foreign_keys && column.foreign_keys.length > 0) {
              column.foreign_keys.forEach((fk) => {
                fetchedEdges.push({
                  id: `e${schemaName}.${tableName}.${column.name}-${fk.table}.${fk.column}`,
                  source: `${schemaName}.${tableName}`,
                  sourceHandle: `${column.name}-source`,
                  target: fk.table,
                  targetHandle: `${fk.column}-target`,
                  type: "smoothstep",
                  markerEnd: { type: "arrowclosed" },
                  data: {
                    sourceColumn: `${schemaName}.${tableName}.${column.name}`,
                    targetColumn: `${fk.table}.${fk.column}`,
                  },
                });
              });
            }
          });
        });
      });
      // Apply the layout
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        await getElkLayoutedElements(fetchedNodes, fetchedEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError("Failed to fetch schema information.");
    }
  }, [connectionId, getElkLayoutedElements, handleDimensionsChange]);

  useEffect(() => {
    if (connectionId) {
      fetchSchema();
    }
  }, [connectionId, fetchSchema]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style:
          edge.data.sourceColumn === hoveredColumn ||
          edge.data.targetColumn === hoveredColumn
            ? { stroke: "#000000", strokeWidth: 2 }
            : {},
        markerEnd:
          edge.data.sourceColumn === hoveredColumn ||
          edge.data.targetColumn === hoveredColumn
            ? { type: "arrowclosed", color: "#000000" }
            : { type: "arrowclosed" },
      }))
    );
  }, [hoveredColumn]);

  useEffect(() => {
    // Check if all nodes have dimensions
    const allNodesHaveDimensions = nodes.every(
      (node) => typeof node.width === "number" && typeof node.height === "number"
    );
  
    if (allNodesHaveDimensions && !layoutApplied) {
      (async () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          await getElkLayoutedElements(nodes, edges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setLayoutApplied(true);
      })();
    }
  }, [nodes, edges, getElkLayoutedElements, layoutApplied]);
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
        fitView // Adjusts the view to fit all nodes
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SchemaDiagram;
