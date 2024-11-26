import React, { useEffect, useState, useRef, useContext } from "react";
import api from "../services/api";
import QueryResults from "./QueryResults";
import { ConnectionContext } from "../contexts/ConnectionContext";
import { FaCircleQuestion } from "react-icons/fa6";
import { FaHistory } from "react-icons/fa";
import { HiPaperAirplane } from "react-icons/hi2";
import { BsDatabaseFillCheck, BsDatabaseFillX } from "react-icons/bs";
import { PiBroomFill } from "react-icons/pi";

const QueryInput = () => {
  const [query, setQuery] = useState("");
  const textareaRef = useRef(null);
  const [results, setResults] = useState([]);
  const [tableInfo, setTableInfo] = useState([]);
  const [error, setError] = useState(null);
  const [databaseName, setDatabaseName] = useState("");
  const { connectionId } = useContext(ConnectionContext);

  useEffect(() => {
    const fetchDatabaseName = async () => {
      if (!connectionId) return;
      try {
        const response = await api.get(`/tables?connection_id=${connectionId}`);
        setDatabaseName(response.data.databaseName);
      } catch (err) {
        setError("Failed to fetch database name.");
      }
    };
    fetchDatabaseName();
  }, [connectionId]);

  // Adjust textarea height on content change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  };

  // On form submit event, send a POST request to the API to execute the query
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!connectionId) {
      setError("No connection selected.");
      return;
    }
    try {
      const response = await api.post(
        `/queries?connection_id=${connectionId}`,
        { query }, // Send the query as JSON
        {
          headers: {
            "Content-Type": "application/json", // Set the correct content type
          },
        }
      );
      setResults(response.data.results);
      const info = await api.post(
        `/analyze?connection_id=${connectionId}`,
        {query},
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      )
      setTableInfo(info.data);
      setError(null);
      setQuery(""); // Clear the input after submitting
      textareaRef.current.style.height = "auto"; // Reset textarea height
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      setResults([]);
    }
  };

  // Clear results and refresh the page
  const handleClearResults = () => {
    setResults([]);
    setTableInfo([]);
    setError(null);
    setQuery("");
    textareaRef.current.style.height = "auto"; // Reset textarea height
  };

  return (
    <div className="flex flex-col min-h-screen py-8">
      {/* Page header */}
      <div className="mx-auto mb-6 flex w-full justify-between items-center">
        {/* Database Name and Status */}
        <div className="mb-auto flex items-center">
          {/* Database Icon */}
          <div className="flex items-center justify-center mr-2">
            {databaseName ? (
              <BsDatabaseFillCheck className="text-4xl text-gray-700" />
            ) : (
              <BsDatabaseFillX className="text-4xl text-gray-700" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {databaseName || "Error"}
            </h1>
            <p className="italic text-xs tracking-tighter font-sans">
              {databaseName ? "Database Loaded" : "Connect to a Database"}
            </p>
          </div>
        </div>

        <div className="ml-auto flex space-x-4">
          {/* Clear Results Button */}
          <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
            {/* Broom Icon */}
            <div className="flex items-center justify-center">
              <PiBroomFill className="text-2xl text-gray-700" />
            </div>
            <div className="flex-grow ml-2" onClick={handleClearResults}>
              <span className="font-medium tracking-tight text-sm font-sans">
                Clear Output
              </span>
            </div>
          </div>

          {/* History Button */}
          <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
            {/* History Icon */}
            <div className="flex items-center justify-center">
              <FaHistory className="text-lg text-gray-700" />
            </div>
            <div className="flex-grow ml-2">
              <span className="font-medium tracking-tight text-sm font-sans">
                Query History
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Results */}
      <div className="flex-grow flex items-center justify-center pt-0 p-4 rounded-md border-t border-gray-300 bg-white mb-24">
        {results.length > 0 ? (
          <QueryResults results={results} tableInfo={tableInfo} />
        ) : (
          <p className="text-gray-500 text-center">Enter Queries</p>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {/* Query Input Box */}
      <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-4xl border border-gray-300 bg-offwhite rounded-md">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="w-full bg-offwhite rounded-md px-4 py-3 text-sm focus:outline-none resize-none placeholder-gray-400 max-h-52 overflow-auto"
              value={query}
              onChange={handleInputChange}
              placeholder="Enter a natural language query..."
              rows={1}
            />

            <div className="flex items-center justify-between">
              {/* Help Button */}
              <button
                type="button"
                className="mx-1 p-2 rounded-full text-gray-700 hover:bg-gray-300"
              >
                <FaCircleQuestion className="h-5 w-5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                className="mx-1 p-2 rounded-full text-gray-700 hover:bg-gray-300"
              >
                <HiPaperAirplane className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueryInput;
