import React, { useState, useEffect } from "react";
import QueryResults from "./QueryResults";
import { FaFilePen, FaTrash } from "react-icons/fa6";
import { FaHistory } from "react-icons/fa";
import { MdManageHistory } from "react-icons/md";

const QueryHistory = () => {
  const [queryHistory, setQueryHistory] = useState([]);
  const [isManaging, setIsManaging] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedEntries, setExpandedEntries] = useState({});

  useEffect(() => {
    // Fetch query history from local storage
    const storedHistory =
      JSON.parse(localStorage.getItem("queryHistory")) || [];
    setQueryHistory(storedHistory);
  }, []);

  const handleManageToggle = () => {
    setIsManaging((prev) => !prev);
  };

  const handleClearAll = () => {
    if (isManaging) {
      const newHistory = queryHistory.filter(
        (_, index) => !checkedItems[index]
      );
      setQueryHistory(newHistory);
      localStorage.setItem("queryHistory", JSON.stringify(newHistory));
      setCheckedItems({});
    } else {
      setQueryHistory([]);
      localStorage.removeItem("queryHistory");
    }
    setExpandedEntries({});
  };

  const handleCheckboxChange = (index) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleEntryClick = (index) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    // Main container
    <div className="container mx-auto px-3 py-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex">
            <FaFilePen className="text-2xl text-gray-700 mr-1" />
            <h2 className="text-lg font-semibold">Query History</h2>
          </div>
          {/* Buttons Container */}
          <div className="flex space-x-2">
            {/* Manage Button */}
            <div
              className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50"
              onClick={handleManageToggle}
            >
              <MdManageHistory className="text-2xl text-gray-700" />
              <span className="ml-2 font-medium text-sm">Manage</span>
            </div>
            {/* Clear All Button */}
            <div
              className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50"
              onClick={handleClearAll}
            >
              <FaTrash className="text-xl text-gray-700" />
              <span className="ml-2 font-medium text-sm">Clear All</span>
            </div>
          </div>
        </div>
      </div>
      {/* Query History List */}
      <div className="bg-white p-2 w-full">
        {queryHistory.length > 0 ? (
          <div className="text-sm text-gray-800">
            {queryHistory.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center mb-2 cursor-pointer p-1 rounded ${
                  expandedEntries[index] ? "bg-gray-300" : ""
                }`}
                onClick={() => handleEntryClick(index)}
              >
                <FaHistory className="text-gray-700 mr-2" />
                <span className="flex-1">{entry.query}</span>
                {isManaging && (
                  <input
                    type="checkbox"
                    className="ml-auto"
                    checked={checkedItems[index] || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(index);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="flex items-center w-full mb-2">
            No query history available.
          </span>
        )}
      </div>
      {/* Expanded Query Results */}
      {Object.keys(expandedEntries).length > 0 && (
        <div className="bg-white p-4 border-t border-gray-300">
          {queryHistory.map(
            (entry, index) =>
              expandedEntries[index] && (
                <div key={index} className="mb-4">
                  <QueryResults results={entry.results} />
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default QueryHistory;
