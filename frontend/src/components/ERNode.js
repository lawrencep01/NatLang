import React from "react";
import { Handle } from "@xyflow/react";
import { FaKey } from "react-icons/fa6";
import Tooltip from "../shared/Tooltip";

// Function to map long data types to shorter terms
const getShortenedType = (type) => {
  const typeMapping = {
    "character varying": "varchar",
    "timestamp without time zone": "timestamp",
  };
  return typeMapping[type] || type; // Default to original type if no mapping exists
};

const ERNode = (props) => {
  const { data } = props;

  const handleMouseEnter = (columnName) => {
    if (data.onHover) {
      data.onHover(`${data.label}.${columnName}`);
    }
  };

  const handleMouseLeave = () => {
    if (data.onHover) {
      data.onHover(null);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-md">
      {/* Table name header */}
      <div className="font-semibold text-center p-2 bg-gray-300">
        {data.label}
      </div>

      <div className="text-sm">
        {data.columns.map((col) => (
          <Tooltip text={col.description}>
          <div
            key={col.name}
            className="relative flex items-center hover:bg-gray-100 cursor-pointer p-2 w-full"
            onMouseEnter={() => handleMouseEnter(col.name)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Left Handle for foreign key relationships */}
            <Handle
              type="target"
              position="left"
              id={`${col.name}-target`}
              className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[2px] h-[2px] min-w-[2px] opacity-0"
            />
            <div className="flex justify-between w-full">
                <span className="text-left flex-1">
                  {col.primary_key && <FaKey className="inline text-gray-500" />}{" "}
                  <span className="inline-block">{col.name}</span>
                </span>
              <span className="italic tracking-tight flex-none ml-2">
                {getShortenedType(col.type)}
              </span>
            </div>
            {/* Right Handle for outgoing relationships */}
            <Handle
              type="source"
              position="right"
              id={`${col.name}-source`}
              className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-[2px] h-[2px] min-w-[2px] opacity-0"
            />
          </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default ERNode;
