// components/Database.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import TableDetails from "./TableDetails";
import { FaTable } from "react-icons/fa";

// State management for list of tables, user selected table, and error message
const Database = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState(null);

  // Send a GET request to the API to fetch the list of tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await api.get("/tables");
        setTables(response.data.tables);
      } catch (error) {
        setError("Failed to fetch table list.");
      }
    };
    fetchTables();
  }, []);

  // On table click event, send a GET request to the API to fetch the table details
  const handleTableClick = async (tableName) => {
    try {
      const response = await api.get(`/table-details/${tableName}`);
      setSelectedTable(response.data);
    } catch (error) {
      setError("Failed to fetch table details.");
    }
  };
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div className="py-6 min-h-screen">
      <h3 className="text-xl font-semibold mb-4">Database Tables</h3>
      <ul className="grid grid-cols-5 gap-4">
        {tables.map((table, index) => (
          <li
            key={index}
            onClick={() => handleTableClick(table)}
            className="cursor-pointer bg-white border border-gray-300 rounded-sm p-4 shadow hover:bg-blue-50 transition flex flex-row items-center"
          >
            <FaTable className="mr-2 text-xl text-black" />
            <span className="text-m font-medium tracking-tight">{table}</span>
          </li>
        ))}
      </ul>
      {selectedTable && <TableDetails table={selectedTable} />}
    </div>
  );
};

export default Database;
