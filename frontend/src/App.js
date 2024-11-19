// App.js
import React from "react";
import Status from "./components/Status";
import TableList from "./components/TableList";
import QueryInput from "./components/QueryInput";

const App = () => {
  return (
    <div>
      <h1>Database Query Application</h1>
      {/* Display Status of Database Connection */}
      <Status />
      {/* Display List of Tables */}
      <TableList />
      {/* Natural Language Query Input */}
      <QueryInput />
    </div>
  );
};

export default App;
