import React, { useState, useEffect } from "react";
import QueryResults from "./QueryResults";
import { FaFilePen, FaTrash } from "react-icons/fa6";
import { FaHistory } from "react-icons/fa";
import { MdManageHistory } from "react-icons/md";

const QueryHistory = () => {
  const [queryHistory, setQueryHistory] = useState([]);

  useEffect(() => {
    // Fetch query history from local storage
    const storedHistory =
      JSON.parse(localStorage.getItem("queryHistory")) || [];
    setQueryHistory(storedHistory);
  }, []);

  return (
    // Main container
    <div className="container mx-auto px-3 py-8">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex">
            <FaFilePen className="text-2xl text-gray-700 mr-1" />
            <h2 className="text-lg font-bold tracking-tight">
              Query History
            </h2>
          </div>
          {/* Buttons Container */}
          <div className="flex space-x-2">
            {/* Manage Button */}
            <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
              <MdManageHistory className="text-2xl text-gray-700" />
              <span className="ml-2 font-medium text-sm">Manage</span>
            </div>
            {/* Clear All Button */}
            <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
              <FaTrash className="text-xl text-gray-700" />
              <span className="ml-2 font-medium text-sm">Clear All</span>
            </div>
          </div>
        </div>
        {/* Query History List */}
        <div className="bg-white p-2 w-full">
          <p className="text-sm text-gray-800 whitespace-pre-wrap w-full">
            {queryHistory.length > 0 ? (
              queryHistory.map((entry, index) => (
                <span key={index} className="flex items-center w-full mb-2">
                  <FaHistory className="text-gray-700 mr-2" />
                  {entry.query}
                </span>
              ))
            ) : (
              <span className="flex items-center w-full mb-2">
                No query history available.
              </span>
            )}
          </p>
        </div>
      </div>
      {/* Query Results */}
      <div className="overflow-y-auto">
        {queryHistory.map((entry, index) => (
          <div key={index} className="mb-4 border-t border-gray-300">
            <QueryResults results={entry.results} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryHistory;
