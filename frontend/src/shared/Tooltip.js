// components/Tooltip.js
import React from "react";

const Tooltip = ({ children, text }) => {
  return (
    <div className="relative group">
      {children}
      <span className="absolute top-1/2 left-full ml-0 transform -translate-y-1/2 px-3 py-2 
                     bg-black text-white text-xs font-normal rounded-lg 
                     opacity-0 group-hover:opacity-100 transition-opacity 
                     whitespace-nowrap shadow-md z-100 pointer-events-none">
        {text}
        {/* Tooltip Arrow */}
        <span
          className="
            absolute right-full top-1/2 transform -translate-y-1/2
            w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-black
          "
        ></span>
      </span>
    </div>
  );
};

export default Tooltip;