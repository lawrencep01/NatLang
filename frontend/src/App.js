// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Database from "./components/Database";
import QueryInput from "./components/QueryInput";

const App = () => {
  return (
    <Router>
      <div className="font-sans bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-3">
          <Routes>
            <Route path="/" element={<h2 className="mt-4">Welcome to the Database Query Application</h2>} />
            <Route path="/database" element={<Database />} />
            <Route path="/queries" element={<QueryInput />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;