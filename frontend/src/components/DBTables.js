import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { FaTable, FaSpinner, FaCircle } from "react-icons/fa6";
import { ConnectionContext } from "../contexts/ConnectionContext";
import TableDetails from "./TableDetails";

/**
 * Database Tables Component
 *
 * Displays a list of tables from the selected database connection.
 * Allows users to view details of each table.
 */
const DBTables = () => {
  const { connectionId } = useContext(ConnectionContext); // Context to access the currently selected connection ID
  const [tables, setTables] = useState([]); // State to hold the list of tables for the selected database
  const [selectedTable, setSelectedTable] = useState(null); // State to hold the details of the selected table
  const [error, setError] = useState(null); // State to handle error messages
  const [isLoading, setIsLoading] = useState(false); // State to handle whether or not the data is loading

  /**
   * Fetches the list of tables from the API based on the selected connection ID.
   * Updates the tables and databaseName states or sets an error if the request fails.
   */
  useEffect(() => {
    if (connectionId) {
      const fetchTables = async () => {
        try {
          const response = await api.get(
            `/tables?connection_id=${connectionId}`
          );
          setTables(response.data.tables);
        } catch (err) {
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
    setIsLoading(true);
    setSelectedTable(null); // Unrender the previous table component
    try {
      const response = await api.get(
        `/table-details/${tableName}?connection_id=${connectionId}`
      );
      setSelectedTable(response.data);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch table details.");
      setIsLoading(false);
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-8">
      {/* Tables Header */}
      <div className="mx-auto mb-4 flex w-full justify-center items-center">
        <h1 className="text-lg font-semibold tracking-tight">Tables</h1>
      </div>

      {/* Tables List */}
      <ul className="grid gap-4 grid-cols-3">
        {tables.map((table, index) => (
          <li
            key={index}
            className="flex items-center"
            onClick={() => handleTableClick(table.tableName)}
          >
            {/* Table Card */}
            <div className="flex w-full cursor-pointer bg-gray-50 rounded-md border border-gray-200 p-1.5 shadow hover:bg-blue-50 transition relative">
              <div className="flex items-center justify-center ml-1">
                <FaTable className="h-8 w-8 text-gray-800" />
              </div>

              <div className="flex-grow ml-2">
                <div className="inline-block">
                  <span className="tracking-tight text-sm font-semibold">
                    {table.tableName}
                  </span>
                </div>
                <div className="block leading-[0.05]">
                  <span className="tracking-tighter text-xs font-light">
                    {table.description}
                  </span>
                </div>
              </div>

              {/* Selection Status Indicator */}
              <div className="flex items-center ml-auto mr-2 flex-shrink-0 text-base">
                {selectedTable && selectedTable.name === table.tableName ? (
                  <FaCircle className="text-green-600 h-2.5 w-2.5 ml-2 animate-glow" />
                ) : (
                  <FaCircle className="text-gray-500 h-2.5 w-2.5 ml-2" />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <FaSpinner className="text-4xl text-gray-600 animate-spin" />
        </div>
      ) : (
        selectedTable && (
          <div className="w-full mt-8">
            <TableDetails table={selectedTable} />
          </div>
        )
      )}
    </div>
  );
};

export default DBTables;
