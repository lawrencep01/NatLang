// contexts/ConnectionContext.js
import React, { createContext, useState } from "react";

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
  // State to hold the ID of the currently selected connection
  const [connectionId, setConnectionId] = useState(null);

  return (
    <ConnectionContext.Provider value={{ connectionId, setConnectionId }}>
      {children}
    </ConnectionContext.Provider>
  );
};