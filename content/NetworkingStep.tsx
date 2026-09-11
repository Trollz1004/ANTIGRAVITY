
import React from 'react';
import { CodeBlock } from '../constants';

const NetworkingStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Proper network configuration and security measures are vital for a publicly accessible web server and reliable NAS.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">1. Static IP Address for Your Server</h3>
      <p className="mb-2">
        Your server needs a static IP address on your local network so that port forwarding rules on your router consistently point to it. Dynamic IPs (assigned by DHCP) can change, breaking external access.
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>How to set:</strong> This is configured in your server's OS network settings.
            <ul>
                <li>On Ubuntu Server, this is often done by editing <code>/etc/netplan/00-installer-config.yaml</code> (or similar).</li>
                <li>On GUI-based systems (like Windows Server or desktop Linux), it's usually in the network connection properties.</li>
            </ul>
        </li>
        <li>Choose an IP address outside your router's DHCP range but within the same subnet (e.g., if DHCP is 192.168.1.100-200, use 192.168.1.50).</li>
        <li>You'll also need to specify the subnet mask, gateway (your router's IP), and DNS servers (often your router's IP or public DNS like 8.8.8.8).</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">2. Port Forwarding on Your Router</h3>
      <p className="mb-2">
        To make <strong>onlinerecycle.net</strong> accessible from the internet, you need to configure your internet router to forward incoming web traffic to your server.
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>Log in to your router's admin interface (usually an IP like 192.168.1.1 or 192.168.0.1).</li>
        <li>Find the "Port Forwarding," "Virtual Servers," or similar section.</li>
        <li>Forward the following ports to your server's static local IP address:
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><strong>Port 80 (TCP):</strong> For HTTP traffic.</li>
            <li><strong>Port 443 (TCP):</strong> For HTTPS traffic (secure).</li>
          </ul>
        </li>
        <li>If you need external access to your NAS (e.g., SMB shares), you might forward relevant ports, but this is generally NOT recommended for SMB due to security risks. Consider using a VPN for secure remote NAS access instead.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">3. Firewall Configuration (Server-Side)</h3>
      <p className="mb-2">
        Your server's firewall should be enabled and configured to allow only necessary traffic.
      </p>
      <h4 className="text-lg font-medium mt-2 mb-1">UFW (Uncomplicated Firewall) on Linux (e.g., Ubuntu):</h4>
      <CodeBlock language="bash">{`sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # Port 22 for remote administration (change port for better security if desired)
sudo ufw allow http         # Port 80
sudo ufw allow https        # Port 443
# sudo ufw allow samba      # If you allowed Samba in NAS setup and understand risks for external exposure
sudo ufw enable
sudo ufw status`}</CodeBlock>
      <p className="mt-1">
        For Windows Server, use the built-in Windows Defender Firewall to create inbound rules for your web server and other services.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4. SSL/TLS Certificate for HTTPS (Let's Encrypt)</h3>
      <p className="mb-2">
        HTTPS encrypts traffic between your server and visitors, essential for security and user trust. Let's Encrypt provides free SSL/TLS certificates.
      </p>
      <h4 className="text-lg font-medium mt-2 mb-1">Using Certbot with Apache on Ubuntu:</h4>
      <CodeBlock language="bash">{`sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d onlinerecycle.net -d www.onlinerecycle.net`}</CodeBlock>
      <p className="mt-1">Follow the prompts. Certbot will obtain the certificate, configure Apache to use it, and set up automatic renewal.</p>
      <h4 className="text-lg font-medium mt-2 mb-1">Using Certbot with Nginx on Ubuntu:</h4>
      <CodeBlock language="bash">{`sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d onlinerecycle.net -d www.onlinerecycle.net`}</CodeBlock>
      <p className="mt-1">After setup, your website <strong>onlinerecycle.net</strong> should be accessible via <code>https://</code>.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">General Security Best Practices:</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>Keep your server OS and all software (web server, database, CMS if any) updated regularly.</li>
        <li>Use strong, unique passwords for all accounts (server login, database, admin panels).</li>
        <li>Disable or remove unnecessary services and user accounts.</li>
        <li>Regularly review server logs for suspicious activity.</li>
        <li>Consider tools like Fail2Ban to block IPs that show malicious behavior.</li>
      </ul>
    </div>
  );
};

export default NetworkingStep;