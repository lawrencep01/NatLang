import React, { createContext, useState, useEffect } from "react";

/**
 * ConnectionContext
 *
 * Provides the current connection ID and a method to update it
 * across the component tree.
 */
export const ConnectionContext = createContext();

/**
 * ConnectionProvider Component
 *
 * Wraps child components and supplies the ConnectionContext.
 *
 * @param {Object} props - Props passed to the provider.
 * @param {React.ReactNode} props.children - Child components that consume the context.
 */
export const ConnectionProvider = ({ children }) => {
  // Initialize connectionId from localStorage
  const [connectionId, setConnectionId] = useState(() => {
    const savedId = localStorage.getItem("connectionId");
    return savedId ? JSON.parse(savedId) : null;
  });

  // Save connectionId to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("connectionId", JSON.stringify(connectionId));
  }, [connectionId]);

  return (
    <ConnectionContext.Provider value={{ connectionId, setConnectionId }}>
      {children}
    </ConnectionContext.Provider>
  );
};