import React, { useState, useEffect, useContext } from "react";
import api from "../services/api";
import Tooltip from "../shared/Tooltip";
import ConnectionForm from "./ConnectionForm";
import { ConnectionContext } from "../contexts/ConnectionContext";
import { FaCircle, FaCircleCheck, FaPlugCircleXmark } from "react-icons/fa6";
import { FaDatabase, FaEdit } from "react-icons/fa";
import { BsDatabaseFillAdd } from "react-icons/bs";

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);
  const { connectionId, setConnectionId } = useContext(ConnectionContext);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const fetchConnections = async () => {
    try {
      const response = await api.get("/connections");
      setConnections(response.data);
    } catch {
      setError("Failed to fetch connections.");
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnectionClick = (id) => {
    setConnectionId(id);
  };

  const handleSave = async (newConnection) => {
    if (editingConnection) {
      setConnections((prevConnections) =>
        prevConnections.map((conn) =>
          conn.id === newConnection.id ? newConnection : conn
        )
      );
    } else {
      setConnections((prevConnections) => [...prevConnections, newConnection]);
    }
    setEditingConnection(null);
    setIsFormOpen(false);
    await fetchConnections();
  };

  const handleAddClick = () => {
    setEditingConnection(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (connection, e) => {
    e.stopPropagation();
    setEditingConnection(connection);
    setIsFormOpen(true);
  };

  const handleRemoveClick = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/connections/${id}`);
      setConnections((prevConnections) =>
        prevConnections.filter((conn) => conn.id !== id)
      );
      await fetchConnections();
    } catch (error) {
      console.error("Failed to remove connection: ", error);
      setError("Failed to remove connection.");
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prevVisiblePasswords) => ({
      ...prevVisiblePasswords,
      [id]: !prevVisiblePasswords[id],
    }));
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto mb-6 flex w-4/5 justify-between items-center">
        <div>
          <h1 className="font-bold tracking-tight text-lg">Database Connections</h1>
          <p className="text-gray-500 text-sm">Overview of Active Connections</p>
        </div>
        <div
          className="relative flex"
          onMouseEnter={() => setHoveredButton('add')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <button
            type="button"
            className="hover:bg-gray-300 rounded-full p-2 text-gray-800"
            aria-label="Add a Database Connection"
            onClick={handleAddClick}
          >
            <BsDatabaseFillAdd className="h-8 w-8" />
          </button>
          <Tooltip text="Add a Database Connection" visible={hoveredButton === 'add'} />
        </div>
      </div>
      
      <ul className="grid gap-6 grid-cols-1">
        {connections.map((connection) => (
          <li
            key={connection.id}
            className="flex mx-auto w-3/4 rounded-sm"
            onClick={() => handleConnectionClick(connection.id)}
          >
            <div className="flex w-full cursor-pointer bg-gray-50 border border-gray-200 rounded-sm p-2 shadow hover:bg-blue-50 transition relative">
              <div className="flex items-center justify-center ml-3">
                <FaDatabase className="text-3xl text-gray-800" />
              </div>
              
              <div className="flex-grow ml-3">
                <span className="font-medium tracking-tight text-sm font-sans">
                  {connection.name}
                </span>
                <div className="italic text-xs tracking-tighter font-sans">
                  <div>
                    {connection.host}: {connection.port}
                  </div>
                  <div>
                    {connection.username}: {visiblePasswords[connection.id] ? connection.password : '*'.repeat(connection.password?.length || 0)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePasswordVisibility(connection.id);
                      }}
                      className="ml-2 text-xs text-blue-700"
                    >
                      {visiblePasswords[connection.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center ml-auto mr-2 flex-shrink-0 text-base">
                {connectionId === connection.id ? (
                  <FaCircleCheck className="text-green-800" />
                ) : (
                  <FaCircle className="text-gray-500" />
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-between ml-3 my-1">
              <div
                className="relative flex"
                onMouseEnter={() => setHoveredButton(`edit-${connection.id}`)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <button
                  className="group hover:bg-gray-300 rounded-full p-2 text-gray-800"
                  onClick={(e) => handleEditClick(connection, e)}
                >
                  <FaEdit className="h-5 w-5" />
                </button>
                <Tooltip text="Edit Connection" visible={hoveredButton === `edit-${connection.id}`} />
              </div>

              <div
                className="relative flex"
                onMouseEnter={() => setHoveredButton(`remove-${connection.id}`)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <button
                  className="group hover:bg-gray-300 rounded-full p-2 text-gray-800"
                  onClick={(e) => handleRemoveClick(connection.id, e)}
                >
                  <FaPlugCircleXmark className="h-5 w-5" />
                </button>
                <Tooltip text="Remove Connection" visible={hoveredButton === `remove-${connection.id}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>
      
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