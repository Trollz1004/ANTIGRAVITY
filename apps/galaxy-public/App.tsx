import React from 'react';
import Graphy from './components/Graphy';

export default function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden select-none">
      <Graphy isStandalone={true} />
    </div>
  );
}
