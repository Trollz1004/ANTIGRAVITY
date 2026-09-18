
import React from 'react';

const OSStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        The Operating System (OS) is the foundation of your server. Your choice will impact software availability, ease of management, and performance. Here are some popular options for a combined NAS and web host:
      </p>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">Linux Distributions (e.g., Ubuntu Server, Debian, CentOS Stream)</h3>
          <ul className="list-disc list-inside mb-2 pl-4 space-y-1">
            <li><strong>Pros:</strong> Free, open-source, highly customizable, robust, excellent performance, vast software repositories (for NAS tools like Samba, web servers like Apache/Nginx, databases, etc.), strong community support, good for learning server administration. Ubuntu Server is often recommended for its ease of use and extensive documentation.</li>
            <li><strong>Cons:</strong> Can have a steeper learning curve if you're new to the command line, though many tasks can be managed via web UIs (e.g., Webmin, Cockpit) or desktop environments if installed.</li>
            <li><strong>Best for:</strong> Users comfortable with or willing to learn Linux, seeking maximum flexibility and control. Ideal for LAMP (Linux, Apache, MySQL, PHP) or LEMP (Linux, Nginx, MySQL, PHP/Python) stacks for <strong>onlinerecycle.net</strong>.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-1">TrueNAS (CORE or Scale)</h3>
          <ul className="list-disc list-inside mb-2 pl-4 space-y-1">
            <li><strong>Pros:</strong> Specialized NAS operating systems. TrueNAS CORE (FreeBSD-based) and TrueNAS Scale (Linux-based) offer robust ZFS filesystem support (excellent data integrity and features), web-based management UI, plugins/apps/containers for extending functionality (including web servers). Scale offers better Docker/Kubernetes support.</li>
            <li><strong>Cons:</strong> Can be more resource-intensive (especially RAM for ZFS). Primarily designed as a NAS, so web hosting might be via Jails (CORE) or Docker containers/VMs (Scale), which adds a layer of complexity.</li>
            <li><strong>Best for:</strong> Users prioritizing NAS features and data integrity with ZFS. Web hosting is possible but might be less direct than a general-purpose Linux distro.</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-1">Windows Server</h3>
          <ul className="list-disc list-inside mb-2 pl-4 space-y-1">
            <li><strong>Pros:</strong> Familiar graphical user interface (GUI) for Windows users, strong integration with Microsoft ecosystem (Active Directory, .NET applications), IIS (Internet Information Services) as a capable web server. Built-in file sharing capabilities.</li>
            <li><strong>Cons:</strong> Requires purchasing licenses (can be expensive), generally more resource-heavy than Linux. Less common for open-source web stacks like LAMP/LEMP, though possible.</li>
            <li><strong>Best for:</strong> Users heavily invested in the Microsoft ecosystem or requiring Windows-specific applications. The website for <strong>onlinerecycle.net</strong> would typically be built with ASP.NET.</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-1">Other Options (e.g., OpenMediaVault)</h3>
          <p className="mb-2 pl-4">
            OpenMediaVault (OMV) is another popular open-source NAS solution based on Debian Linux. It's lightweight and designed for home/SOHO NAS use, with a web UI and plugin system. It can also host web services.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-2">Recommendation for <strong>OnlineRecycle.Net</strong>:</h3>
      <p className="mb-4">
        For a balance of flexibility, cost-effectiveness, and community support for both NAS and web hosting (especially for typical web stacks like PHP/Node.js/Python), a <strong>Linux distribution like Ubuntu Server</strong> is often the most versatile choice.
      </p>
      <p>
        This guide will primarily provide examples assuming a Linux-based OS (like Ubuntu Server) due to its popularity and suitability for this combined role. However, the general principles apply across systems.
      </p>
    </div>
  );
};

export default OSStep;