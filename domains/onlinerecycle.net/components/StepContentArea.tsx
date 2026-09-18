
import React from 'react';
import { StepDefinition } from '../types';

interface StepContentAreaProps {
  step: StepDefinition | undefined;
}

const StepContentArea: React.FC<StepContentAreaProps> = ({ step }) => {
  if (!step) {
    return <div className="flex-1 p-6 text-center text-slate-500">Select a step to begin.</div>;
  }

  const { ContentComponent, title } = step;

  return (
    <article className="flex-1 bg-white p-6 sm:p-8 rounded-lg shadow-lg min-h-[400px] max-h-[calc(100vh-250px)] overflow-y-auto">
      <h2 className="text-3xl font-bold text-emerald-700 mb-6 pb-2 border-b border-emerald-200 flex items-center">
        {React.cloneElement(step.icon, { className: "w-8 h-8 mr-3 text-emerald-600"})}
        {title}
      </h2>
      <div className="prose prose-emerald max-w-none prose-headings:text-emerald-700 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-strong:text-emerald-700 prose-code:bg-slate-100 prose-code:p-1 prose-code:rounded prose-code:text-sm prose-code:text-purple-700 prose-pre:bg-slate-100 prose-pre:p-4 prose-pre:rounded-md prose-pre:text-sm">
        <ContentComponent />
      </div>
    </article>
  );
};

export default StepContentArea;