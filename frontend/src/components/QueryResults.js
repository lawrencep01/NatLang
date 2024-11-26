// Updated components/QueryResults.js
import React from "react";
import Table from "../shared/Table";

const QueryResults = ({ results }) => {
  if (!results.length) {
    return null;
  }

  return (
    <div>
      <h4>Results:</h4>
      {results.map((result, index) => (
        <div key={index}>
          <p>Query: {result.Query}</p>
          {result.Action === "insert" &&
          Array.isArray(result.NewRows) &&
          result.NewRows.length > 0 ? (
            <div>
              <p>{result.Message}</p>
              <Table tableName="Inserted Elements" data={result.NewRows} highlight="insert" />
            </div>
          ) : result.Action === "delete" &&
            Array.isArray(result.DeletedRows) &&
            result.DeletedRows.length > 0 ? (
            <div>
              <p>{result.Message}</p>
              <Table tableName="Deleted Elements" data={result.DeletedRows} highlight="delete" />
            </div>
          ) : Array.isArray(result.Results) && result.Results.length > 0 ? (
            <Table tableName="Results" data={result.Results} />
          ) : (
            <p>{result.Message || "No data returned by this query"}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueryResults;
