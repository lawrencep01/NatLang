// Updated components/QueryResults.js
import React from "react";
import Table from "../shared/Table";

const QueryResults = ({ results, tableInfo }) => {
  if (!results.length) {
    return null;
  }

  return (
    <div className="w-full">
      {results.map((result, index) => (
        <div key={index}>
          {result.Action === "insert" &&
          Array.isArray(result.NewRows) &&
          result.NewRows.length > 0 ? (
            <div>
              <Table tableName="Inserted Elements" description={result.Message} data={result.NewRows} highlight="insert" />
            </div>
          ) : result.Action === "delete" &&
            Array.isArray(result.DeletedRows) &&
            result.DeletedRows.length > 0 ? (
            <div>
              <Table tableName="Deleted Elements" description={result.Message} data={result.DeletedRows} highlight="delete" />
            </div>
          ) : Array.isArray(result.Results) && result.Results.length > 0 ? (
            <Table tableName={tableInfo.name} description={tableInfo.description} data={result.Results} />
          ) : (
            <p>{result.Message || "No data returned by this query"}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueryResults;
