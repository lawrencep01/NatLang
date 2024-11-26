import React, { useState, useRef, useContext } from "react";
import api from "../services/api";
import QueryResults from "./QueryResults";
import { ConnectionContext } from "../contexts/ConnectionContext";
import { FaCircleQuestion } from "react-icons/fa6";
import { HiPaperAirplane } from "react-icons/hi2";

const QueryInput = () => {
  const [query, setQuery] = useState("");
  const textareaRef = useRef(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const { connectionId } = useContext(ConnectionContext);

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
      const response = await api.post(`/queries?connection_id=${connectionId}`, query);
      setResults(response.data.results);
      setError(null);
      setQuery(""); // Clear the input after submitting
      textareaRef.current.style.height = "auto"; // Reset textarea height
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      setResults([]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Results */}
      <div className="flex-1 overflow-y-auto pb-16">
        {results.length > 0 && <QueryResults results={results} />}

        {/* Error Message */}
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-8 left-0 right-0 mx-auto max-w-4xl border border-gray-300 bg-white rounded-lg"
      >
        <div className="flex flex-col">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="w-full bg-white rounded-lg p-3 focus:outline-none resize-none placeholder-gray-500 max-h-52 overflow-auto"
            value={query}
            onChange={handleInputChange}
            placeholder="Enter a query..."
            rows={1}
          />

          <div className="flex items-center justify-between">
            {/* Help Button */}
            <button
              type="button"
              className="mx-1 p-2 rounded-full text-gray-800 hover:bg-gray-300"
            >
              <FaCircleQuestion className="h-6 w-6" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className="mx-1 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-300"
            >
              <HiPaperAirplane className="h-6 w-6" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QueryInput;
