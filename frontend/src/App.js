import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Status from "./components/Status";
import TableList from "./components/TableList";
import QueryInput from "./components/QueryInput";

const App = () => {
  return (
    <Router>
      <div>
        <NavBar />
        <h1>Database Query Application</h1>
        <Status />
        <Routes>
          <Route path="/" element={<h2>Welcome to the Database Query Application</h2>} />
          <Route path="/database" element={<TableList />} />
          <Route path="/queries" element={<QueryInput />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;