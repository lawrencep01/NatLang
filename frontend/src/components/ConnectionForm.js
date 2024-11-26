import React, { useState, useEffect } from "react";
import api from "../services/api";

/**
 * ConnectionForm Component
 *
 * Renders a form to create or update a database connection.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onClose - Function to call when closing the form.
 * @param {Function} props.onSave - Function to call after saving the connection.
 * @param {Object} [props.initialData={}] - Initial data given for the form fields.
 */
const ConnectionForm = ({ onClose, onSave, initialData = {} }) => {
  /**
   * formData state holds the values of the form fields.
   */
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    host: initialData.host || "",
    port: initialData.port || "",
    username: initialData.username || "",
    password: initialData.password || "",
    database: initialData.database || "",
  });

  /**
   * Updates formData whenever initialData prop changes.
   */
  useEffect(() => {
    setFormData({
      name: initialData.name || "",
      host: initialData.host || "",
      port: initialData.port || "",
      username: initialData.username || "",
      password: initialData.password || "",
      database: initialData.database || "",
    });
  }, [initialData]);

  /**
   * Handles changes to form inputs by updating formData state.
   *
   * @param {Object} e - Event object from input change.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  /**
   * Handles form submission to create or update a connection in the SQLite connections.db database.
   *
   * @param {Object} e - Event object from form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (initialData.id) {
        // Update existing connection
        response = await api.put(`/connections/${initialData.id}`, formData);
      } else {
        // Create new connection
        response = await api.post("/connections", formData);
      }
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error("Failed to save connection: ", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-50 p-6 rounded shadow-lg w-2/5">
        <form onSubmit={handleSubmit}>
          <h3 className="font-medium text-base tracking-tight ml-2 mb-1">Server</h3>
          <div className="mb-5 p-4 bg-gray-100 border border-gray-300 rounded-sm">
            {/* Name Field */}
            <div className="mb-4 flex items-center">
              <label className="font-normal text-sm tracking-tight mr-2 w-24">
                Name:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-300 p-1 rounded-sm w-full text-xs"
                required
              />
            </div>
            {/* Host and Port Fields */}
            <div className="mb-4 flex items-center">
              <label className="font-normal text-sm tracking-tight mr-2 w-24">
                Host:
              </label>
              <div className="flex w-full items-center">
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  className="border border-gray-300 p-1 rounded-sm w-4/5 text-xs"
                  required
                />
                <label className="font-normal text-sm tracking-tight ml-4 mr-2">
                  Port:
                </label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  className="border border-gray-300 p-1 rounded-sm w-1/5 text-xs"
                  required
                />
              </div>
            </div>
            {/* Database Field */}
            <div className="mb-4 flex items-center">
              <label className="font-normal text-sm tracking-tight mr-2 w-24">
                Database:
              </label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                className="border border-gray-300 p-1 rounded-sm w-full text-xs"
                required
              />
            </div>
          </div>

          <h3 className="font-medium text-base tracking-tight ml-2 mb-1">Authentication</h3>
          <div className="mb-4 p-4 bg-gray-100 border border-gray-300 rounded-sm">
            {/* Username Field */}
            <div className="mb-4 flex items-center">
              <label className="font-normal text-sm tracking-tight mr-2 w-24 ">
                Username:
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="border border-gray-300 p-1 rounded-sm w-full text-xs"
                required
              />
            </div>
            {/* Password Field */}
            <div className="mb-4 flex items-center">
              <label className="font-normal text-sm tracking-tight mr-2 w-24">
                Password:
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="border border-gray-300 p-1 rounded-sm w-full text-xs"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-1 border border-gray-300 hover:bg-gray-300 text-gray-800 font-semibold text-sm tracking-tight rounded-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-1 bg-blue-600 hover:bg-blue-800 text-white font-semibold text-sm tracking-tight rounded-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionForm;
