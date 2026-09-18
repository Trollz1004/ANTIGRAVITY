
import React, { useState, useMemo } from 'react';
import { StepDefinition } from './types';
import Header from './components/Header';
import StepNavigator from './components/StepNavigator';
import StepContentArea from './components/StepContentArea';
import NavigationControls from './components/NavigationControls';

import IntroductionStep from './content/IntroductionStep';
import HardwareStep from './content/HardwareStep';
import OSStep from './content/OSStep';
import NASStep from './content/NASStep';
import WebHostStep from './content/WebHostStep';
import NetworkingStep from './content/NetworkingStep';
import DNSDomainStep from './content/DNSDomainStep';
import MaintenanceStep from './content/MaintenanceStep';
import GeminiHelperStep from './content/GeminiHelperStep';

import {
  LightBulbIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CogIcon,
  SparklesIcon
} from './constants';

const App: React.FC = () => {
  const steps: StepDefinition[] = useMemo(() => [
    { id: 'intro', title: 'Introduction', icon: <LightBulbIcon />, ContentComponent: IntroductionStep },
    { id: 'hardware', title: 'Hardware', icon: <ComputerDesktopIcon />, ContentComponent: HardwareStep },
    { id: 'os', title: 'OS Choice', icon: <ServerStackIcon />, ContentComponent: OSStep },
    { id: 'nas', title: 'NAS Setup', icon: <ServerStackIcon />, ContentComponent: NASStep },
    { id: 'webhost', title: 'Web Host Setup', icon: <ServerStackIcon />, ContentComponent: WebHostStep },
    { id: 'network', title: 'Networking & Security', icon: <ShieldCheckIcon />, ContentComponent: NetworkingStep },
    { id: 'dns', title: 'Domain & DNS', icon: <GlobeAltIcon />, ContentComponent: DNSDomainStep },
    { id: 'maintenance', title: 'Maintenance', icon: <CogIcon />, ContentComponent: MaintenanceStep },
    { id: 'aihelper', title: 'AI Assistant', icon: <SparklesIcon />, ContentComponent: GeminiHelperStep },
  ], []);

  const [currentStepId, setCurrentStepId] = useState<string>(steps[0].id);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStepIndex = useMemo(() => steps.findIndex(step => step.id === currentStepId), [steps, currentStepId]);
  const currentStepData = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStepId));
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepId(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepId(steps[currentStepIndex - 1].id);
    }
  };

  const handleStepSelect = (stepId: string) => {
    // Allow jumping to already completed steps or the next logical step
    const selectedIndex = steps.findIndex(s => s.id === stepId);
    const maxAllowedIndex = completedSteps.size; // Can jump to any completed or the one after last completed
    
    // Allow jumping if it's already completed, or it's the current step, or it's the very next uncompleted one.
    if (completedSteps.has(stepId) || selectedIndex <= maxAllowedIndex) {
         setCurrentStepId(stepId);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />
      <main className="flex-grow container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <StepNavigator 
            steps={steps} 
            currentStepId={currentStepId} 
            onStepSelect={handleStepSelect}
            completedSteps={completedSteps}
          />
          <div className="flex-1 flex flex-col">
            <StepContentArea step={currentStepData} />
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={handleNext}
              isFirstStep={currentStepIndex === 0}
              isLastStep={currentStepIndex === steps.length - 1}
            />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-slate-500 bg-slate-200">
        <p>&copy; {new Date().getFullYear()} OnlineRecycle.Net Guide. All rights reserved (conceptually).</p>
      </footer>
    </div>
  );
};

export default App;