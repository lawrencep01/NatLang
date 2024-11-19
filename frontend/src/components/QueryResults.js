// components/QueryResults.js
import React from "react";

const QueryResults = ({ results }) => {
  if (!results.length) {
    return null;
  }
  return (
    <div>
      <h4>Query Results:</h4>
      {results.map((result, index) => (
        <div key={index}>
          <p>Query: {result.Query}</p>
          {Array.isArray(result.Results) && (
            <table border="1">
              <thead>
                <tr>
                  {Object.keys(result.Results[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.Results.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueryResults;
