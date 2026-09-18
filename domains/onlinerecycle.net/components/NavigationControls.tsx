
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../constants';

interface NavigationControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({ onPrevious, onNext, isFirstStep, isLastStep }) => {
  return (
    <div className="mt-8 flex justify-between items-center">
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        className="px-6 py-3 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-2" />
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={isLastStep}
        className="px-6 py-3 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center transition-colors"
      >
        Next
        <ChevronRightIcon className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
};

export default NavigationControls;