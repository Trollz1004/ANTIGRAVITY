
import React from 'react';
import { InformationCircleIcon } from '../../constants';

const Disclaimer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm">
            <strong>Disclaimer:</strong> This guide provides general information for setting up a PC as a NAS and web server. Specific commands and configurations may vary based on your chosen operating system, software versions, and hardware. Proceed with caution, especially when dealing with system configurations and security settings. Always back up important data before making significant changes. For production environments, consult with IT professionals.
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;