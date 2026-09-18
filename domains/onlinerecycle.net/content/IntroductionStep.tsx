
import React from 'react';
import Disclaimer from './common/Disclaimer';

const IntroductionStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Welcome to the guide for setting up your PC as a Network Attached Storage (NAS) and web hosting server for <strong>OnlineRecycle.Net</strong>!
      </p>
      <p className="mb-4">
        This multi-step process will walk you through the essential considerations and actions to transform a dedicated PC into a versatile server for your project.
      </p>
      
      <h3 className="text-xl font-semibold mt-6 mb-2">What is a NAS?</h3>
      <p className="mb-4">
        A Network Attached Storage (NAS) is a dedicated file storage server that allows multiple users and client devices to retrieve data from centralized disk capacity. Users on a local area network (LAN) can access the shared storage via a standard Ethernet connection. A NAS can be used for:
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>Centralized file storage and sharing.</li>
        <li>Automated backups for your computers.</li>
        <li>Media streaming (photos, music, videos).</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">What is a Web Host?</h3>
      <p className="mb-4">
        A web host (or web server) is a computer system that stores, processes, and delivers website files to internet users. When someone types <strong>onlinerecycle.net</strong> into their browser, the browser connects to your web server, which then sends the website's pages and content back to the browser to be displayed.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Why Combine Them?</h3>
      <p className="mb-4">
        For projects like <strong>OnlineRecycle.Net</strong>, using a single PC for both NAS and web hosting can be a cost-effective solution, especially if traffic and storage needs are moderate. It allows you to manage your data and website from one machine.
      </p>
      <p>
        Let's get started! Click "Next" to proceed to Hardware Considerations.
      </p>
      <Disclaimer />
    </div>
  );
};

export default IntroductionStep;