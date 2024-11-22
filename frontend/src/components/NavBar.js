// NavBar.js
import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="bg-gray-950 p-3">
      <div className="container mx-auto flex justify-between items-center px-3">
        <div className="text-white text-2xl font-bold">Natural Language to SQL</div>
        <ul className="flex space-x-8">
          <li>
            <Link
              to="/"
              className="text-white font-semibold px-3 py-3 rounded-md transition-colors duration-200 hover:bg-blue-950"
            >   
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/database"
              className="text-white font-semibold px-3 py-3 rounded-md transition-colors duration-200 hover:bg-blue-950"
            >
              Database
            </Link>
          </li>
          <li>
            <Link
              to="/queries"
              className="text-white font-semibold px-3 py-3 rounded-md transition-colors duration-200 hover:bg-blue-950"
            >
              Queries
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;