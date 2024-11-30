import React, { useEffect, useState, useRef, useContext } from "react";
import api from "../services/api";
import QueryResults from "./QueryResults";
import { ConnectionContext } from "../contexts/ConnectionContext";
import { FaSpinner } from "react-icons/fa6";
import { FaHistory, FaInfoCircle } from "react-icons/fa";
import { HiPaperAirplane } from "react-icons/hi2";
import { BsDatabaseFillCheck, BsDatabaseFillX } from "react-icons/bs";
import { PiBroomFill } from "react-icons/pi";

const QueryInput = () => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [databaseName, setDatabaseName] = useState("");
  const { connectionId } = useContext(ConnectionContext);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = inputRef.current.scrollHeight + "px";
  };

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
      setResults(response.data.results);
      setIsLoading(false);
      setError(null);
      setQuery("");
      inputRef.current.value = "";
      inputRef.current.style.height = "auto";
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      setResults([]);
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResults([]);
    setError(null);
    setQuery("");
    inputRef.current.value = "";
    inputRef.current.style.height = "auto";
  };

  return (
    <div className="flex flex-col min-h-screen py-8">
      <div className="mx-auto pb-4 mb-2 flex w-full justify-between items-center border-b border-gray-300">
        <div className="mb-auto flex items-center">
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
          <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
            <div className="flex items-center justify-center">
              <PiBroomFill className="text-2xl text-gray-700" />
            </div>
            <div className="flex-grow ml-2" onClick={handleClearResults}>
              <span className="font-medium tracking-tight text-sm font-sans">
                Clear Output
              </span>
            </div>
          </div>

          <div className="flex cursor-pointer bg-white border border-gray-300 rounded-sm p-2 shadow hover:bg-blue-50">
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

      <div className="flex-grow flex items-center justify-center pt-0 p-4 rounded-md bg-white mb-20">
        {isLoading ? (
          <FaSpinner className="animate-spin text-4xl text-gray-700" />
        ) : results.length > 0 ? (
          <QueryResults results={results} />
        ) : (
          <div className="h-full w-full"></div>
        )}
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="fixed bottom-4 left-0 right-0 p-3 mx-auto max-w-2xl bg-offwhite border-2 border-gray-300 rounded-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <textarea
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              className="w-full bg-offwhite rounded-2xl p-1 text-sm font-sans focus:outline-none resize-none placeholder-gray-500 max-h-52 overflow-auto"
              placeholder="Enter a Natural Language Query..."
              rows = "1"
            />

            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="rounded-lg text-gray-700 hover:text-gray-300"
              >
                <FaInfoCircle className="h-6 w-6" />
              </button>

              <button
                type="submit"
                className="rounded-lg text-gray-800 hover:text-gray-400"
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
