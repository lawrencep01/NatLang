// NavBar.js
import React from "react";
import { NavLink } from "react-router-dom";

const NavBar = () => {
  // Function to determine the class based on active state
  const getLinkClass = ({ isActive }) =>
    isActive
      ? "text-black text-sm font-bold px-3 py-3"
      : "text-black text-sm font-light px-3 py-3 transition-all duration-200 hover:font-black";

  return (
    <nav className="bg-offwhite p-3">
      <div className="container mx-auto flex justify-center items-center px-3">
        <ul className="flex space-x-8">
          <li>
            <NavLink to="/connections" className={getLinkClass}>
              Connections
            </NavLink>
          </li>
          <li>
            <NavLink to="/database" className={getLinkClass}>
              Database
            </NavLink>
          </li>
          <li>
            <NavLink to="/queries" className={getLinkClass}>
              Queries
            </NavLink>
          </li>
          <li>
            <NavLink to="/" className={getLinkClass}>
              Usage
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
