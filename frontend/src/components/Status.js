// components/Status.js
import React, { useEffect, useState } from "react";
import api from "../services/api";

const Status = () => {
  const [Status, setStatus] = useState("Loading...");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/status");
        setStatus(response.data.message);
      } catch (error) {
        setStatus("Failed to connect to the backend.");
      }
    };

    fetchStatus();
  }, []);

  return <div><p style={{ fontSize: "small", fontStyle: "italic" }}>{Status}</p></div>;
};

export default Status;