import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { FaTable, FaSpinner, FaCircle, FaPlus, FaMinus } from "react-icons/fa6";
import { FaSitemap } from "react-icons/fa";
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
  const [selectedTables, setSelectedTables] = useState([]); // State to hold the details of the selected tables
  const [error, setError] = useState(null); // State to handle error messages
  const [isLoading, setIsLoading] = useState(false); // State to handle whether or not the data is loading
  const [expanded, setExpanded] = useState({}); // State to track expanded/collapsed status of schemas

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
   * Handles the selection of tables by fetching its details from the API.
   *
   * @param {string} tableName - The name of the table to fetch details for, accessed from databaseName state.
   * @param {string} schemaName - The name of the schema the table belongs to.
   */
  const handleTableClick = async (tableName, schemaName) => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `/table-details/${tableName}?connection_id=${connectionId}&schema_name=${schemaName}`
      );
      const tableDetails = response.data;
      setSelectedTables((prevSelectedTables) => {
        const isSelected = prevSelectedTables.some(
          (table) => table.name === tableName
        );
        if (isSelected) {
          return prevSelectedTables.filter(
            (table) => table.name !== tableName
          );
        } else {
          return [...prevSelectedTables, tableDetails];
        }
      });
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch table details.");
      setIsLoading(false);
    }
  };

  /**
   * Toggles the expanded/collapsed status of a schema.
   *
   * @param {string} schemaName - The name of the schema to toggle.
   */
  const toggleSchema = (schemaName) => {
    setExpanded((prev) => ({
      ...prev,
      [schemaName]: !prev[schemaName],
    }));
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen py-8">
      {Object.keys(tables).map((schemaName) => (
        <div key={schemaName} className="mb-6">
          {/* Schema Group Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FaSitemap className="h-6 w-6 text-gray-700 mr-2" />
              <h2 className="text-md font-semibold">{schemaName}</h2>
            </div>
            <div
              className="cursor-pointer"
              onClick={() => toggleSchema(schemaName)}
            >
              {expanded[schemaName] ? (
                <FaMinus className="h-4 w-4 text-gray-700 hover:text-gray-400 " />
              ) : (
                <FaPlus className="h-4 w-4 text-gray-700 hover:text-gray-400" />
              )}
            </div>
          </div>
          {/* Tables List */}
          {expanded[schemaName] && (
            <ul className="grid gap-4 grid-cols-2">
              {tables[schemaName].map((table, index) => (
                <li
                  key={index}
                  className="flex items-center"
                  onClick={() => handleTableClick(table.tableName, schemaName)}
                >
                  {/* Table Card */}
                  <div className="flex w-full cursor-pointer bg-gray-50 rounded-md border border-gray-200 p-1.5 shadow hover:bg-blue-50 transition relative">
                    <div className="flex items-center justify-center ml-1">
                      <FaTable className="h-8 w-8 text-gray-800" />
                    </div>

                    <div className="flex-grow ml-2">
                      <div className="inline-block">
                        <span className="text-sm font-normal">
                          {table.tableName}
                        </span>
                      </div>
                      <div className="block leading-[0.05]">
                        <span className="tracking-tighter text-xs font-extralight">
                          {table.description}
                        </span>
                      </div>
                    </div>

                    {/* Selection Status Indicator */}
                    <div className="flex items-center ml-auto mr-2 flex-shrink-0 text-base">
                      {selectedTables.some(
                        (selectedTable) => selectedTable.name === table.tableName
                      ) ? (
                        <FaCircle className="text-green-600 h-2.5 w-2.5 ml-2 animate-glow" />
                      ) : (
                        <FaCircle className="text-gray-500 h-2.5 w-2.5 ml-2" />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {isLoading ? (
        <div className="flex justify-center items-center">
          <FaSpinner className="text-4xl text-gray-600 animate-spin" />
        </div>
      ) : (
        selectedTables.length > 0 && (
          <div>
            {selectedTables.map((table) => (
              <div className="border-t border-gray-300 mt-8">
              <TableDetails key={table.name} table={table} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default DBTables;
