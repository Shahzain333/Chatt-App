import React from "react";

const EmptyState = ({ showOnlyChats }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
    <p className="text-sm">{showOnlyChats ? "No conversations yet" : "No other users found"}</p>
    <p className="text-xs mt-1">
      {showOnlyChats ? "Start a new chat with someone!" : "Be the first to invite others!"}
    </p>
  </div>
);

export default EmptyState;