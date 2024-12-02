import React, { useEffect, useState, useRef, useContext } from "react";
import api from "../services/api";
import QueryResults from "./QueryResults";
import { ConnectionContext } from "../contexts/ConnectionContext";

// Import icons
import { FaSpinner } from "react-icons/fa6";
import { FaInfoCircle } from "react-icons/fa";
import { HiPaperAirplane } from "react-icons/hi2";
import { BsDatabaseFillCheck, BsDatabaseFillX } from "react-icons/bs";
import { PiBroomFill } from "react-icons/pi";

const QueryInput = () => {
  const [query, setQuery] = useState(""); // State to hold the user's natlang query input
  const inputRef = useRef(null); // Reference to the input textarea element
  const [results, setResults] = useState([]); // State to store the results of running the query
  const [error, setError] = useState(null); // State to handle error messages
  const [databaseName, setDatabaseName] = useState(""); // State to store the database name currently connected to
  const { connectionId } = useContext(ConnectionContext); // Retrieve the current connection ID from context
  const [isLoading, setIsLoading] = useState(false); // State to manage loading indicator

  // Fetch the database name by making an API call when the connection ID changes
  useEffect(() => {
    const fetchDatabaseName = async () => {
      if (!connectionId) return;
      try {
        const response = await api.get(`/db-name?connection_id=${connectionId}`);
        setDatabaseName(response.data.databaseName);
      } catch (err) {
        setError("Failed to fetch database name.");
      }
    };
    fetchDatabaseName();
  }, [connectionId]);

  // Handle changes in the textarea input and auto-resize based on content
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = inputRef.current.scrollHeight + "px";
  };

  // Handle form submission by making an API call to execute the query
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!connectionId) {
      setError("No connection selected.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.post(
        `/queries?connection_id=${connectionId}`,
        { query },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const newResult = response.data.results;
      setResults(newResult);

      // Save the query history to localStorage
      const newHistory = [
        ...(JSON.parse(localStorage.getItem("queryHistory")) || []),
        { query, results: newResult },
      ];
      localStorage.setItem("queryHistory", JSON.stringify(newHistory));

      setIsLoading(false);
      setError(null);
      setQuery("");
      // Reset the textarea on successful query execution
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      setResults([]);
      setIsLoading(false);
    }
  };

  // Clear the results and reset the input when clear button is clicked
  const handleClearResults = () => {
    setResults([]);
    setError(null);
    setQuery("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    }
  };

  return (
    <div className="flex flex-col min-h-screen py-8">
      {/* Header Section */}
      <div className="pb-4 mb-2 flex w-full justify-between items-center border-b border-gray-300">
        <div className="flex items-center">
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

        <div className="flex space-x-4">
          {/* Clear Output Button */}
          <div
            className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50"
            onClick={handleClearResults}
            aria-label="Clear Output"
          >
            <div className="flex items-center justify-center">
              <PiBroomFill className="text-2xl text-gray-700" />
            </div>
            <div className="ml-2">
              <span className="font-medium tracking-tight text-sm font-sans">
                Clear Output
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-grow flex items-center justify-center p-4 rounded-md bg-white mb-20">
        {isLoading ? (
          <FaSpinner className="animate-spin text-4xl text-gray-700" /> // Loading Spinner
        ) : results.length > 0 ? (
          <QueryResults results={results} /> // Display Query Results once loading is done
        ) : (
          // No results or error message
          <div className="h-full w-full">
            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Query Input Form */}
      <div className="fixed bottom-4 left-0 right-0 p-3 mx-auto max-w-2xl bg-offwhite border-2 border-gray-300 rounded-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <textarea
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              className="w-full bg-offwhite rounded-2xl p-1 text-sm focus:outline-none resize-none placeholder-gray-500 max-h-52 overflow-auto"
              placeholder="Enter a Natural Language Query..."
              rows="1"
            />

            <div className="flex items-center justify-between mt-2">
              {/* Info Button */}
              <button
                type="button"
                className="rounded-lg text-gray-700 hover:text-gray-300"
                aria-label="Info"
              >
                <FaInfoCircle className="h-6 w-6" />
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                className="rounded-lg text-gray-800 hover:text-gray-400"
                aria-label="Submit"
              >
                <HiPaperAirplane className="h-6 w-6" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueryInput;
