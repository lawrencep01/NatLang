// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import DBTables from "./components/DBTables";
import QueryInput from "./components/QueryInput";
import QueryHistory from "./components/QueryHistory";
import Connections from "./components/Connections";
import SchemaDiagram from "./components/SchemaDiagram";
import { ConnectionProvider } from "./contexts/ConnectionContext";

const App = () => {
  return (
    <ConnectionProvider>
      <Router>
        <div className="font-sans bg-white">
          <NavBar />
          <Routes>
            <Route
              path="/schema"
              element={<SchemaDiagram />}
            />
            <Route
              path="/connections"
              element={
                <div className="container mx-auto px-3">
                  <Connections />
                </div>
              }
            />
            <Route
              path="/tables"
              element={
                <div className="container mx-auto px-3">
                  <DBTables />
                </div>
              }
            />
            <Route
              path="/queries"
              element={
                <div className="container mx-auto px-3">
                  <QueryInput />
                </div>
              }
            />
            <Route
              path="/history"
              element={
                <div className="container mx-auto px-3">
                  <QueryHistory />
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </ConnectionProvider>
  );
};

export default App;
