// components/QueryInput.js
import React, { useState } from "react";
import api from "../services/api";

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
      {results.length > 0 && (
        <div>
          <h4>Query Results:</h4>
          {results.map((result, index) => (
            <div key={index}>
              <p>Query: {result.Query}</p>
              {Array.isArray(result.Results) && (
                <table border="1">
                  <thead>
                    <tr>
                      {Object.keys(result.Results[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.Results.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryInput;
