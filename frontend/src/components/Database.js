// components/Database.js
import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import TableDetails from "./TableDetails";
import { FaTable } from "react-icons/fa6";
import { ConnectionContext } from "../contexts/ConnectionContext";

/**
 * Database Component
 *
 * Displays a list of tables from the selected database connection.
 * Allows users to view details of each table.
 */
const Database = () => {
  const { connectionId } = useContext(ConnectionContext); // Context to access the currently selected connection ID
  const [tables, setTables] = useState([]); // State to hold the list of tables for the selected database
  const [selectedTable, setSelectedTable] = useState(null); // State to hold the details of the selected table
  const [error, setError] = useState(null); // State to handle error messages
  const [databaseName, setDatabaseName] = useState(""); // State to hold the name of the database

  /**
   * Fetches the list of tables from the API based on the selected connection ID.
   * Updates the tables and databaseName states or sets an error if the request fails.
   */
  useEffect(() => {
    if (connectionId) {
      const fetchTables = async () => {
        try {
          const response = await api.get(`/tables?connection_id=${connectionId}`);
          setTables(response.data.tables);
          setDatabaseName(response.data.databaseName);
        } catch {
          setError("Failed to fetch table list.");
        }
      };
      fetchTables();
    }
  }, [connectionId]);

  /**
   * Handles the selection of a table by fetching its details from the API.
   *
   * @param {string} tableName - The name of the table to fetch details for, accessed from databaseName state.
   */
  const handleTableClick = async (tableName) => {
    try {
      const response = await api.get(`/table-details/${tableName}?connection_id=${connectionId}`);
      setSelectedTable(response.data);
    } catch {
      setError("Failed to fetch table details.");
    }
  };
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <h2 className="text-xl font-bold mb-4">Database: {databaseName}</h2>
      
      {/* Tables List */}
      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <li
            key={table.name}
            className="flex items-center p-4 bg-white border rounded shadow hover:bg-gray-100 cursor-pointer"
            onClick={() => handleTableClick(table.name)}
          >
            <FaTable className="text-2xl text-blue-500 mr-3" />
            <span className="text-lg">{table.name}</span>
          </li>
        ))}
      </ul>

      {/* Table Details */}
      {selectedTable && <TableDetails table={selectedTable} />}
    </div>
  );
};

export default Database;
