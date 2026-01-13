import React from "react";

const LoadingScreen = ({mesage}) => (
  <section className="flex flex-col h-screen w-full md:w-[300px] lg:w-[400px] bg-white border-r border-gray-200 relative">
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      <p className="text-gray-600 mt-4">{mesage}</p>
    </div>
  </section>
);

export default LoadingScreen;