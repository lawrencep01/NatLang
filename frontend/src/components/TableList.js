// components/TableList.js
import React, { useEffect, useState } from "react";
import api from "../services/api";

const TableList = () => {
  const [tables, setTables] = useState([]);
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

  if (error) {
    return <div><h3>{error}</h3></div>;
  }

  return (
    <div>
      <h3>Database Tables:</h3>
      <ul>
        {tables.map((table, index) => (
          <li key={index}>{table}</li>
        ))}
      </ul>
    </div>
  );
};

export default TableList;