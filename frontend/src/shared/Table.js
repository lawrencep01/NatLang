// shared/Table.js
import React, { useState, useRef, useEffect } from "react";
import { BiFilter } from "react-icons/bi";
import { IoCaretBack, IoCaretForward } from "react-icons/io5";

// FilterDropdown Render
const FilterDropdown = ({ headers, columnVisibility, onChange, filterRef }) => (
  <div
    ref={filterRef}
    className="absolute top-full right-0 w-auto bg-white border border-gray-300 rounded-md shadow-lg z-10 p-2"
  >
    {headers.map((header) => (
      <div key={header} className="flex items-center">
        <input
          type="checkbox"
          id={`filter-${header}`}
          checked={columnVisibility[header]}
          onChange={() => onChange(header)}
          className="mr-2 accent-blue-700"
        />
        <label htmlFor={`filter-${header}`} className="text-sm">
          {header}
        </label>
      </div>
    ))}
  </div>
);

// Pagination Component Render
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onEllipsisClick,
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [{ number: 1, isEllipsis: false }];

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

  return (
    <div className="flex items-center">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`text-gray-800 mr-1 rounded-sm ${
          currentPage === 1
            ? "opacity-25 cursor-not-allowed"
            : "hover:bg-gray-200 hover:shadow-md"
        }`}
      >
        <IoCaretBack className="h-7 w-7" />
      </button>
      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() =>
            page.isEllipsis
              ? onEllipsisClick(index === 1 ? "start" : "end")
              : onPageChange(page.number)
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
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`text-gray-800 ml-1 rounded-sm ${
          currentPage === totalPages
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-200 hover:shadow-md"
        }`}
      >
        <IoCaretForward className="h-7 w-7" />
      </button>
    </div>
  );
};

// Main Table Component
const Table = ({
  tableName,
  description = "No description available",
  data,
  highlight,
  className,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTable, setSearchTable] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const headers = data?.length > 0 ? Object.keys(data[0]) : [];
  const initialVisibility = headers.reduce((acc, header) => {
    acc[header] = true;
    return acc;
  }, {});
  const [columnVisibility, setColumnVisibility] = useState(initialVisibility);

  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        !event.target.closest("button")
      ) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  if (!data || data.length === 0) {
    return <p className="text-gray-600">No data available</p>;
  }

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

  const handleSearchChange = (e) => {
    setSearchTable(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterToggle = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const handleColumnVisibilityChange = (header) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }));
  };

  const filteredData = data.filter((row) =>
    headers.some((header) => {
      const cellValue = row[header];
      return (
        cellValue &&
        cellValue.toString().toLowerCase().includes(searchTable.toLowerCase())
      );
    })
  );

  const visibleHeaders = headers.filter((header) => columnVisibility[header]);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentRows = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleEllipsisClick = (position) => {
    setCurrentPage((prev) =>
      position === "start"
        ? Math.max(prev - 5, 1)
        : Math.min(prev + 5, totalPages)
    );
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

      <div className="flex items-center justify-between mb-4 relative">
        <input
          type="text"
          placeholder="Search..."
          value={searchTable}
          onChange={handleSearchChange}
          className="border border-gray-300 text-sm rounded-sm px-2 py-1 w-5/12"
        />
          <button
            className="text-gray-800 rounded-full hover:bg-gray-300 p-1"
            onClick={handleFilterToggle}
          >
            <BiFilter className="h-7 w-7" />
          </button>
        {isFilterOpen && (
          <FilterDropdown
            headers={headers}
            columnVisibility={columnVisibility}
            onChange={handleColumnVisibilityChange}
            filterRef={filterRef}
          />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              {visibleHeaders.map((header) => (
                <th
                  key={header}
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
                {visibleHeaders.map((header) => (
                  <td
                    key={header}
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
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-2 border border-gray-300 rounded-sm px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEllipsisClick={handleEllipsisClick}
        />
      </div>
    </div>
  );
};

export default Table;
