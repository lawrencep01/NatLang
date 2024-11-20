import React from "react";
import { Link } from "react-router-dom";
import "./NavBar.css";

const NavBar = () => {
    return (
        <nav>
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/database">Database</Link>
                </li>
                <li>
                    <Link to="/queries">Queries</Link>
                </li>
            </ul>
        </nav>
    );
};
export default NavBar;