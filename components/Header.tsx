
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-emerald-600 text-white p-6 shadow-md">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">DIY NAS & Web Host Setup Guide</h1>
        <p className="text-emerald-100">For OnlineRecycle.Net</p>
      </div>
    </header>
  );
};

export default Header;