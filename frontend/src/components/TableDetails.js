// components/TableDetails.js
import React from "react";
import Table from "../shared/Table";

// With an input of the table-details API respone, render the Table component
const TableDetails = ({ table }) => {
  console.log(table);
  console.log(table.rowCount)
  return (
    <div className="mt-8">
      <Table tableName={table.name} description={table.description} data={table.data} />
    </div>
  );
};

export default TableDetails;
