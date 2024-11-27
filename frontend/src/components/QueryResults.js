import React, { useState, useEffect, useContext } from "react";
import Table from "../shared/Table";
import api from "../services/api";
import { SiSqlite } from "react-icons/si";
import { FaPlay } from "react-icons/fa6";
import { ConnectionContext } from "../contexts/ConnectionContext";

const QueryResults = ({ results }) => {
  const [hoveredCmdId, setHoveredCmdId] = useState(null);
  const [tableInfo, setTableInfo] = useState([]);
  const { connectionId } = useContext(ConnectionContext);

  useEffect(() => {
    const fetchTableInfo = async () => {
      const info = await Promise.all(
        results.map(async (result) => {
          const response = await api.post(
            `/analyze?connection_id=${connectionId}`,
            { query: result.Query },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const data = response.data;
          return {
            id: result.id,
            name: data.name,
            description: data.description,
          };
        })
      );
      setTableInfo(info);
    };
    fetchTableInfo();
  }, [results, connectionId]);

  if (!results.length) {
    return null;
  }

  const renderTable = (tableName, description, data, highlight, isHovered) => (
    <Table
      tableName={tableName}
      description={description}
      data={data}
      highlight={highlight}
      className={`${isHovered ? "border-l-4 border-gray-700 pl-4" : ""}`}
    />
  );

  return (
    <div className="w-full mt-6">
      {/* Display the commands that were run */}
      <div className="mb-4">
        <div className="flex items-center justify-center mb-1">
          <SiSqlite className="text-2xl text-gray-700 mr-1" />
          <h2 className="text-lg font-semibold tracking-tight">Commands</h2>
        </div>
        <div className="flex justify-center">
          <div className="flex bg-gray-50 p-2 rounded-sm mb-4 border border-gray-300 w-2/3">
            <p className="text-sm text-gray-800 font-sans whitespace-pre-wrap w-full">
              {results.map((result) => (
                <span
                  key={result.id}
                  onMouseEnter={() => setHoveredCmdId(result.id)}
                  onMouseLeave={() => setHoveredCmdId(null)}
                  className={`flex items-center w-full ${
                    hoveredCmdId === result.id ? "bg-gray-200 cursor-pointer" : ""
                  } hover:bg-gray-200`}
                >
                  <FaPlay className="text-gray-700 mr-2" />
                  {result.Query}
                  <br />
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
      {results.map((result) => {
        const info = tableInfo.find((info) => info.id === result.id);
        return (
          <div className="mb-6" key={result.id}>
            {result.Action === "insert" &&
            Array.isArray(result.NewRows) &&
            result.NewRows.length > 0 ? (
              renderTable(
                info?.name,
                info?.description,
                result.NewRows,
                "insert",
                hoveredCmdId === result.id
              )
            ) : result.Action === "delete" &&
              Array.isArray(result.DeletedRows) &&
              result.DeletedRows.length > 0 ? (
              renderTable(
                info?.name,
                info?.description,
                result.DeletedRows,
                "delete",
                hoveredCmdId === result.id
              )
            ) : Array.isArray(result.Results) && result.Results.length > 0 ? (
              renderTable(
                info?.name,
                info?.description,
                result.Results,
                "",
                hoveredCmdId === result.id
              )
            ) : (
              <p>{result.Message || "No data returned by this query"}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QueryResults;
