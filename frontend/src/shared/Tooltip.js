// components/Tooltip.js
import React from "react";

const Tooltip = ({ text, visible }) => {
  return (
    <div className="relative ml-2">
      <span className={`absolute top-1/2 left-full ml-0 transform -translate-y-1/2 px-3 py-2 
                     bg-black text-white text-xs font-normal rounded-lg 
                     ${visible ? 'opacity-100' : 'opacity-0'} transition-opacity 
                     whitespace-nowrap shadow-md z-50 pointer-events-none`}>
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