// components/Table.js
import React from "react";

// Table component rendering a table given its name, relevant data, and highlight status
const Table = ({ tableName, data, highlight }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-600">No data available</p>;
  }
  console.log(data);

  // Get the headers from the keys of the first row of data
  const headers = Object.keys(data[0]);


  const getRowClasses = () => {
    switch (highlight) {
      case "insert":
        return "bg-green-100";
      case "delete":
        return "bg-red-100";
      default:
        return "";
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">{tableName}</h2>
          <p className="text-sm text-gray-500">Temporary Description</p>
        </div>
        <button className="mt-4 bg-black text-white px-4 py-2 rounded">Export to CSV</button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 rounded px-4 py-1 w-1/3"
        />
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md">Filter</button>
      </div>
      <table className="w-full table-auto bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={`${getRowClasses()} hover:bg-gray-50`}>
              {headers.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2 text-sm text-gray-800 border-b whitespace-nowrap"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
