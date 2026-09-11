
import React from 'react';

const HardwareStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Choosing the right hardware is crucial for a stable and performant NAS and web server. Here are some key considerations:
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Minimum & Recommended Specs:</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-2">
        <li>
          <strong>CPU (Processor):</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><em>Minimum:</em> Dual-core 64-bit processor (e.g., Intel Core i3, AMD Ryzen 3).</li>
            <li><em>Recommended:</em> Quad-core or higher (e.g., Intel Core i5/i7, AMD Ryzen 5/7) for better multitasking, especially if running virtual machines or multiple services.</li>
          </ul>
        </li>
        <li>
          <strong>RAM (Memory):</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><em>Minimum:</em> 4GB (can be tight for some OS/setups).</li>
            <li><em>Recommended:</em> 8GB or 16GB+. More RAM helps with caching, handling concurrent web requests, and running services like databases smoothly. If using ZFS (e.g., with TrueNAS), more RAM is highly beneficial.</li>
          </ul>
        </li>
        <li>
          <strong>Storage (Hard Drives/SSDs):</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><em>OS Drive:</em> A small, fast SSD (e.g., 120GB-250GB) is recommended for the operating system and web server software for quick boot times and responsiveness.</li>
            <li><em>Data Storage:</em> Depends on your needs for <strong>onlinerecycle.net</strong> and NAS usage. Consider NAS-grade HDDs (e.g., WD Red, Seagate IronWolf) for reliability in 24/7 operation. Multiple drives allow for RAID configurations for data redundancy or performance (an advanced topic).</li>
            <li><em>Capacity:</em> Plan for current needs and future growth.</li>
          </ul>
        </li>
        <li>
          <strong>Network Card (NIC):</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><em>Minimum/Recommended:</em> Gigabit Ethernet (1000 Mbps) is standard and essential for good network performance for both NAS access and web serving. Most modern motherboards have this built-in.</li>
          </ul>
        </li>
        <li>
          <strong>Motherboard & Power Supply (PSU):</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li>Ensure the motherboard has enough SATA ports for your drives.</li>
            <li>A reliable, good-quality PSU is important for system stability. Choose one with adequate wattage for your components.</li>
          </ul>
        </li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">Important Considerations:</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-2">
        <li>
          <strong>Reliability:</strong> For a server that's expected to be always on, use quality components. Consider NAS-specific hard drives if your budget allows.
        </li>
        <li>
          <strong>Backup Strategy:</strong> This hardware setup is for your primary server. You STILL need a separate backup solution for critical data (3-2-1 rule: 3 copies, 2 different media, 1 offsite).
        </li>
        <li>
          <strong>UPS (Uninterruptible Power Supply):</strong> Highly recommended. A UPS protects against power outages and surges, preventing data corruption and hardware damage.
        </li>
        <li>
          <strong>Cooling:</strong> Ensure the PC case has adequate airflow to keep components cool, especially if it's running 24/7.
        </li>
        <li>
          <strong>Noise:</strong> If the server will be in a living or working space, consider quieter fans and components.
        </li>
      </ul>
      <p>
        Once you have suitable hardware, the next step is choosing an operating system.
      </p>
    </div>
  );
};

export default HardwareStep;