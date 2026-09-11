
import React from 'react';
import { StepDefinition } from '../types';
import { CheckCircleIcon } from '../constants';

interface StepNavigatorProps {
  steps: StepDefinition[];
  currentStepId: string;
  onStepSelect: (stepId: string) => void;
  completedSteps: Set<string>;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({ steps, currentStepId, onStepSelect, completedSteps }) => {
  return (
    <nav className="w-full md:w-64 bg-slate-100 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-emerald-700 mb-4">Setup Steps</h2>
      <ul>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = completedSteps.has(step.id) && !isCurrent;
          const stepNumber = index + 1;

          return (
            <li key={step.id} className="mb-2">
              <button
                onClick={() => onStepSelect(step.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-150 ease-in-out
                  ${isCurrent 
                    ? 'bg-emerald-500 text-white shadow-md scale-105' 
                    : 'hover:bg-emerald-100 text-slate-700'
                  }
                  ${isCompleted ? 'text-slate-500' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-5 h-5 mr-3 text-emerald-500 flex-shrink-0" />
                ) : (
                  <span className={`w-5 h-5 mr-3 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-semibold 
                    ${isCurrent ? 'bg-white text-emerald-600' : 'bg-slate-300 text-slate-600'}`}>
                    {stepNumber}
                  </span>
                )}
                <span className="truncate">{step.title}</span>
                {React.cloneElement(step.icon, { className: `w-5 h-5 ml-auto flex-shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600 opacity-70'}`})}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default StepNavigator;