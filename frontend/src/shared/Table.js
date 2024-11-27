// shared/Table.js
import React, { useState } from "react";
import { BiFilter } from "react-icons/bi";
import { IoCaretBack, IoCaretForward } from "react-icons/io5";

// Table component rendering a table with pagination
const Table = ({ tableName, description = "No description available", data, highlight, className }) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (!data || data.length === 0) {
    return <p className="text-gray-600">No data available</p>;
  }

  // Get the headers from the keys of the first row of data
  const headers = Object.keys(data[0]);

  const getRowClasses = () => {
    switch (highlight) {
      case "insert":
        return "bg-green-100";
      case "delete":
        return "bg-red-100";
      default:
        return "";
    }
  };

  const lastRowIdx = currentPage * rowsPerPage;
  const indexOfFirstRow = lastRowIdx - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, lastRowIdx);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    pageNumbers.push({ number: 1, isEllipsis: false });

    if (totalPages <= 10) {
      for (let i = 2; i < totalPages; i++) {
        pageNumbers.push({ number: i, isEllipsis: false });
      }
    } else {
      if (currentPage <= 5) {
        for (let i = 2; i <= 6; i++) {
          pageNumbers.push({ number: i, isEllipsis: false });
        }
        pageNumbers.push({ number: "...", isEllipsis: true });
      } else if (currentPage > totalPages - 5) {
        pageNumbers.push({ number: "...", isEllipsis: true });
        for (let i = totalPages - 6; i < totalPages; i++) {
          pageNumbers.push({ number: i, isEllipsis: false });
        }
      } else {
        pageNumbers.push({ number: "...", isEllipsis: true });
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push({ number: i, isEllipsis: false });
        }
        pageNumbers.push({ number: "...", isEllipsis: true });
      }
    }

    if (totalPages > 1) {
      pageNumbers.push({ number: totalPages, isEllipsis: false });
    }

    return pageNumbers;
  };

  const handleEllipsisClick = (position) => {
    if (position === "start") {
      setCurrentPage(currentPage - 5);
    } else if (position === "end") {
      setCurrentPage(currentPage + 5);
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight">{tableName}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button className="bg-gray-800 hover:bg-gray-300 text-white text-sm px-3 py-2 rounded-sm self-end">
          Export to CSV
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border border-gray-300 text-sm rounded-sm px-2 py-1 w-5/12"
        />
        <button className="text-gray-800 rounded-full hover:bg-gray-300 p-1">
          <BiFilter className="h-7 w-7" />
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full table-auto bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {headers.map((header, index) => (
              <th
                key={index}
                className="border-b px-4 py-2 text-left text-sm font-semibold text-gray-800 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {currentRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${getRowClasses()} hover:bg-gray-50`}
            >
              {headers.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-b px-4 py-2 text-sm text-gray-800 whitespace-nowrap"
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <label className="text-sm tracking-tight text-gray-700">
          Rows per page:
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="ml-2 border border-gray-300 rounded-sm px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <div className="flex items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`text-gray-800 mr-1 rounded-sm ${
              currentPage === 1 ? "opacity-25 cursor-not-allowed" : "hover:bg-gray-200 hover:shadow-md"
            }`}
          >
            <IoCaretBack className="h-7 w-7"/>
          </button>
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() =>
                page.isEllipsis
                  ? handleEllipsisClick(index === 1 ? "start" : "end")
                  : handlePageChange(page.number)
              }
              className={`px-3 py-1 mx-0.5 rounded-sm text-sm hover:bg-gray-800 hover:text-white ${
                currentPage === page.number
                  ? "bg-gray-800 text-white"
                  : page.isEllipsis
                  ? "cursor-pointer"
                  : "bg-gray-200"
              }`}
              disabled={page.isEllipsis && page.number !== "..."}
            >
              {page.number}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`text-gray-800 ml-1 rounded-sm ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 hover:shadow-md"
            }`}
          >
            <IoCaretForward className="h-7 w-7"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Table;
