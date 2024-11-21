// components/TableDetails.js
import React from "react";
import Table from "./Table";

const TableDetails = ({ table }) => {
  console.log(table);
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
    <h4>Number of Rows: {table.rowCount}</h4>
    <h4>Data:</h4>
    <Table data={table.data} />
  </div>
  );
};

export default TableDetails;