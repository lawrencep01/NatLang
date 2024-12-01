// components/Connections.js
import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import Tooltip from "../shared/Tooltip";
import ConnectionForm from "./ConnectionForm";
import { ConnectionContext } from "../contexts/ConnectionContext";
import { FaCircle, FaCircleCheck, FaPlugCircleXmark } from "react-icons/fa6";
import { FaDatabase, FaEdit } from "react-icons/fa";
import { BsDatabaseFillAdd } from "react-icons/bs";

/**
 * Connections Component
 *
 * Displays a list of database connections and allows users to add, edit, or remove connections.
 */
const Connections = () => {
  const [connections, setConnections] = useState([]); // State to hold list of connections
  const [error, setError] = useState(null); // State to handle any errors during API calls
  const { connectionId, setConnectionId } = useContext(ConnectionContext); // Context to manage the currently selected connection
  const [isFormOpen, setIsFormOpen] = useState(false); // State to control the visibility of the ConnectionForm modal
  const [editingConnection, setEditingConnection] = useState(null); // State to hold whether a connection is being edited

  /**
   * Fetches the list of database connections from the API.
   * Updates the connections state or sets an error if the request fails.
   */
  const fetchConnections = async () => {
    try {
      const response = await api.get("/connections");
      setConnections(response.data);
    } catch {
      setError("Failed to fetch connections.");
    }
  };

  // Fetch connections when the component mounts
  useEffect(() => {
    fetchConnections();
  }, []);

  /**
   * Handles the selection of a database connection.
   *
   * @param {number|string} id - The connection ID of the selected connection.
   */
  const handleConnectionClick = (id) => {
    setConnectionId(id);
  };

  /**
   * Handles saving a new or edited connection.
   *
   * @param {Object} newConnection - The connection data to save.
   */
  const handleSave = async (newConnection) => {
    if (editingConnection) {
      // Update the existing connection in the state
      setConnections((prevConnections) =>
        prevConnections.map((conn) =>
          conn.id === newConnection.id ? newConnection : conn
        )
      );
    } else {
      // Add the new connection to the state if not editing
      setConnections((prevConnections) => [...prevConnections, newConnection]);
    }
    // Reset editing state and close the form
    setEditingConnection(null);
    setIsFormOpen(false);
    // Re-fetch connections to ensure the list is up-to-date
    await fetchConnections();
  };

  /**
   * Opens the ConnectionForm for adding a new connection.
   */
  const handleAddClick = () => {
    setEditingConnection(null); // Reset editing state to null for new connections
    setIsFormOpen(true); // Open the ConnectionForm modal
  };

  /**
   * Opens the ConnectionForm for editing an existing connection.
   *
   * @param {Object} connection - The connection to edit.
   * @param {Object} e - The event object.
   */
  const handleEditClick = (connection, e) => {
    e.stopPropagation(); // Prevent triggering the connection click handler, which would select the connection to be used
    setEditingConnection(connection);
    setIsFormOpen(true);
  };
  
  /**
   * Removes a connection after confirming the action.
   *
   * @param {number|string} id - The ID of the connection to remove.
   * @param {Object} e - The event object.
   */
  const handleRemoveClick = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the connection click handler
    try {
      await api.delete(`/connections/${id}`);
      // Remove the connection from the state
      setConnections((prevConnections) =>
        prevConnections.filter((conn) => conn.id !== id)
      );
      // Re-fetch connections to ensure the list is up-to-date
      await fetchConnections();
    } catch (error) {
      console.error("Failed to remove connection: ", error);
      setError("Failed to remove connection.");
    }
  };

  // Display an error message if there's an error fetching connections
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-8">
      {/* Header Section */}
      <div className="mx-auto mb-6 flex w-4/5 justify-between items-center">
        <div>
          <h1 className="font-bold tracking-tight text-lg">
            Database Connections
          </h1>
          <p className="text-gray-500 text-sm">
            Overview of Active Connections
          </p>
        </div>
        {/* Add Connection Button with Tooltip */}
        <Tooltip text="Add a Database Connection">
          <button
            type="button"
            className="hover:bg-gray-300 rounded-full p-2 text-gray-800"
            aria-label="Add a Database Connection"
            onClick={handleAddClick}
          >
            <BsDatabaseFillAdd className="h-8 w-8" />
          </button>
        </Tooltip>
      </div>
      
      {/* Connections List */}
      <ul className="grid gap-6 grid-cols-1">
        {connections.map((connection) => (
          <li
            key={connection.id}
            className="flex mx-auto w-3/4 rounded-sm"
            onClick={() => handleConnectionClick(connection.id)}
          >
            <div className="flex w-full cursor-pointer bg-gray-50 border border-gray-200 rounded-sm p-2 shadow hover:bg-blue-50 transition relative">
              {/* Database Icon */}
              <div className="flex items-center justify-center ml-3">
                <FaDatabase className="text-3xl text-gray-800" />
              </div>
              
              {/* Connection Details */}
              <div className="flex-grow ml-3">
                <span className="font-medium tracking-tight text-sm font-sans">
                  {connection.name}
                </span>
                <div className="italic text-xs tracking-tighter font-sans">
                  <div>
                    {connection.database} (ID: {connection.id})
                  </div>
                  <div>
                    {connection.host}: {connection.port}
                  </div>
                </div>
              </div>
              
              {/* Connection Status Indicator */}
              <div className="flex items-center ml-auto mr-2 flex-shrink-0 text-base">
                {connectionId === connection.id ? (
                  <FaCircleCheck className="text-green-800" />
                ) : (
                  <FaCircle className="text-gray-500" />
                )}
              </div>
            </div>
            
            {/* Edit and Remove Buttons */}
            <div className="flex flex-col items-center justify-between ml-3 my-1">
              {/* Edit Button with Tooltip */}
              <Tooltip text="Edit Connection">
                <button
                  className="group hover:bg-gray-300 rounded-full p-2 text-gray-800"
                  onClick={(e) => handleEditClick(connection, e)}
                >
                  <FaEdit className="h-5 w-5" />
                </button>
              </Tooltip>

              {/* Remove Button with Tooltip */}
              <Tooltip text="Remove Connection">
                <button
                  className="group hover:bg-gray-300 rounded-full p-2 text-gray-800"
                  onClick={(e) => handleRemoveClick(connection.id, e)}
                >
                  <FaPlugCircleXmark className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Connection Form Modal */}
      {isFormOpen && (
        <ConnectionForm
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
          initialData={editingConnection || {}}
        />
      )}
    </div>
  );
};

export default Connections;
