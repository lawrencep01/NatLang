// NavBar.js
import React from "react";
import { NavLink } from "react-router-dom";

const NavBar = () => {
  // Function to determine the class based on active state
  const getLinkClass = ({ isActive }) =>
    isActive
      ? "text-black text-sm font-black px-3 py-3"
      : "text-black text-sm font-medium px-3 py-3 transition-all duration-200 hover:font-black";

  return (
    <nav className="bg-gray-100 p-3">
      <div className="container mx-auto flex justify-between items-center px-3">
        <div className="text-black text-lg font-semibold">Natural Language SQL</div>
        <ul className="flex space-x-8">
          <li>
            <NavLink to="/" className={getLinkClass}>
              Home
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
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;