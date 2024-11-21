// components/TableList.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import TableDetails from "./TableDetails";

const Database = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState(null);

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

  const handleTableClick = async (tableName) => {
    try {
      const response = await api.get(`/table-details/${tableName}`);
      setSelectedTable(response.data);
      //console.log(response.data);
    } catch (error) {
      setError("Failed to fetch table details.");
    }
  };

  if (error) {
    return (
      <div>
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div>
      <h3>Database Tables:</h3>
      <ul>
        {tables.map((table, index) => (
          <li key={index} onClick={() => handleTableClick(table)}>
            {table}
          </li>
        ))}
      </ul>
      {selectedTable && <TableDetails table={selectedTable} />}
    </div>
  );
};

export default Database;