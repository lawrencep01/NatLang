// components/TableDetails.js
import React from "react";
import Table from "./Table";

const TableDetails = ({ table }) => {
  return (
    <div>
    <h3>Table: {table.name}</h3>
    <h4>Columns:</h4>
    <ul>
      {table.columns.map((column, index) => (
        <li key={index}>
          {column.name} ({column.type})
        </li>
      ))}
    </ul>
    <h4>Row Count: {table.rowCount}</h4>
    <h4>Sample Data:</h4>
    <Table data={table.sampleData} />
  </div>
  );
};

export default TableDetails;