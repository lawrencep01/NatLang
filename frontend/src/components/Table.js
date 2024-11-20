// components/Table.js
import React from "react";
import "./Table.css";

const Table = ({ data, highlight }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  // Get the headers from the keys of the first row of data
  const headers = Object.keys(data[0]);

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={
              highlight === "insert"
                ? "highlight-insert"
                : highlight === "delete"
                ? "highlight-delete"
                : ""
            }
          >
            {headers.map((header, cellIndex) => (
              <td key={cellIndex}>{row[header]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
