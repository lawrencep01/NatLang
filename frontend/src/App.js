// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Database from "./components/Database";
import QueryInput from "./components/QueryInput";
import Connections from "./components/Connections";
import { ConnectionProvider } from "./contexts/ConnectionContext";

const App = () => {
  return (
    <ConnectionProvider>
    <Router>
      <div className="font-sans bg-white">
        <NavBar />
        <div className="container mx-auto px-3">
          <Routes>
            <Route path="/" element={<h2 className="mt-4">To Do</h2>} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/database" element={<Database />} />
            <Route path="/queries" element={<QueryInput />} />
          </Routes>
        </div>
      </div>
    </Router>
    </ConnectionProvider>
  );
};

export default App;