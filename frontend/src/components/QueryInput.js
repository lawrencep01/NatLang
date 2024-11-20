import React, { useState } from "react";
import api from "../services/api";
import QueryResults from "./QueryResults";

const QueryInput = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/queries", { query });
      setResults(response.data.results);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
      setResults([]);
    }
  };

  return (
    <div>
      <h3>Enter a Natural Language Query:</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show all records from users"
          required
        />
        <button type="submit">Submit</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <QueryResults results={results} />
    </div>
  );
};

export default QueryInput;
