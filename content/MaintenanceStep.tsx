
import React from 'react';
import { CodeBlock } from '../constants';

const MaintenanceStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Setting up your server is just the beginning. Ongoing maintenance and monitoring are crucial for security, stability, and performance.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">1. Regular Software Updates</h3>
      <p className="mb-2">
        Keep your server's operating system and all installed software (web server, database, PHP, applications like WordPress if used, etc.) up to date. Updates often include security patches for vulnerabilities.
      </p>
      <h4 className="text-lg font-medium mt-2 mb-1">On Linux (e.g., Ubuntu):</h4>
      <CodeBlock language="bash">{`sudo apt update          # Refreshes package lists
sudo apt upgrade         # Upgrades installed packages
sudo apt full-upgrade    # Handles upgrades that require removing packages
sudo apt autoremove      # Removes unused dependencies`}</CodeBlock>
      <p className="mt-1">Consider enabling automatic security updates for critical patches, but be cautious with full automatic upgrades on production systems as they can occasionally cause issues.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">2. Monitor Server Resources</h3>
      <p className="mb-2">
        Keep an eye on your server's resource usage:
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>CPU Usage:</strong> High sustained CPU usage can indicate performance bottlenecks or runaway processes.
          <ul className="list-circle list-inside ml-6 mt-1"><li>Tools: <code>top</code>, <code>htop</code> (Linux).</li></ul>
        </li>
        <li><strong>RAM Usage:</strong> Ensure you have enough free memory. Excessive swapping to disk will slow down your server.
          <ul className="list-circle list-inside ml-6 mt-1"><li>Tools: <code>free -h</code>, <code>top</code>, <code>htop</code> (Linux).</li></ul>
        </li>
        <li><strong>Disk Space:</strong> Monitor disk usage to prevent your server from running out of space, which can crash services.
          <ul className="list-circle list-inside ml-6 mt-1"><li>Tools: <code>df -h</code> (Linux).</li></ul>
        </li>
        <li><strong>Network Traffic:</strong> Monitor bandwidth usage, especially if your ISP has data caps or you suspect unusual activity.
          <ul className="list-circle list-inside ml-6 mt-1"><li>Tools: <code>iftop</code>, <code>nload</code> (Linux).</li></ul>
        </li>
      </ul>
      <p>Many server management panels (e.g., Webmin, Cockpit) offer graphical resource monitoring.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">3. Review Logs Regularly</h3>
      <p className="mb-2">
        Server and application logs contain valuable information about errors, security events, and performance issues.
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>System Logs:</strong>
          <ul className="list-circle list-inside ml-6 mt-1"><li>Linux: <code>/var/log/syslog</code> or <code>/var/log/messages</code>, <code>journalctl</code> for systemd systems.</li></ul>
        </li>
        <li><strong>Web Server Logs:</strong>
          <ul className="list-circle list-inside ml-6 mt-1">
            <li>Apache: Typically in <code>/var/log/apache2/</code> (access.log, error.log).</li>
            <li>Nginx: Typically in <code>/var/log/nginx/</code> (access.log, error.log).</li>
          </ul>
        </li>
        <li><strong>Authentication Logs:</strong>
          <ul className="list-circle list-inside ml-6 mt-1"><li>Linux: <code>/var/log/auth.log</code> or <code>/var/log/secure</code> (shows login attempts, sudo usage).</li></ul>
        </li>
        <li><strong>Application Logs:</strong> Your specific web application (e.g., CMS, custom code) may have its own logs.</li>
      </ul>
      <p>Look for repeated errors, failed login attempts, or unusual patterns.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4. Backup Strategy Implementation & Verification</h3>
      <p className="mb-2">
        This cannot be stressed enough: <strong>Regularly back up your data and test your backups!</strong>
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>What to back up:</strong>
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li>NAS data (shared files).</li>
            <li>Website files (<code>/var/www/onlinerecycle.net</code>).</li>
            <li>Database dumps (e.g., <code>mysqldump</code> for MySQL).</li>
            <li>Key configuration files (e.g., <code>/etc/apache2/</code>, <code>/etc/samba/</code>, <code>/etc/letsencrypt/</code>).</li>
          </ul>
        </li>
        <li><strong>Backup Frequency:</strong> Depends on how often your data changes (daily, weekly).</li>
        <li><strong>Backup Location:</strong> Follow the 3-2-1 rule: 3 copies of your data, on 2 different types of media, with 1 copy offsite (e.g., cloud storage, another physical location).</li>
        <li><strong>Automation:</strong> Use scripts (e.g., cron jobs with rsync, mysqldump) or backup software to automate the process.</li>
        <li><strong>Test Restores:</strong> Periodically test restoring from your backups to ensure they are working correctly. A backup is useless if it can't be restored.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">5. SSL Certificate Renewal</h3>
      <p className="mb-4">
        If using Let's Encrypt with Certbot, it typically sets up automatic renewal. However, it's good to occasionally verify that renewals are happening:
      </p>
      <CodeBlock language="bash">sudo certbot renew --dry-run</CodeBlock>
      <p className="mt-1">This command will simulate a renewal attempt. Check your Certbot logs if issues arise.</p>
      
      <p className="mt-6">
        Proactive maintenance and monitoring will help ensure your NAS and web server for <strong>onlinerecycle.net</strong> remain secure, reliable, and performant over time.
      </p>
    </div>
  );
};

export default MaintenanceStep;