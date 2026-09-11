
import React from 'react';

const DNSDomainStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        For <strong>onlinerecycle.net</strong> to point to your new self-hosted server, you need to configure its DNS (Domain Name System) records. This is done through your domain registrar (where you bought the domain).
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">1. Obtain Your Public IP Address</h3>
      <p className="mb-2">
        Your internet service provider (ISP) assigns you a public IP address. This is different from your server's local static IP.
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>You can find your public IP by searching "what is my IP" on Google from a computer on your network, or by checking your router's status page.</li>
        <li><strong>Important Note on Dynamic Public IPs:</strong> Most residential ISPs provide dynamic public IP addresses, meaning your public IP can change. If it changes, <strong>onlinerecycle.net</strong> will stop pointing to your server.
          <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
            <li><strong>Solutions:</strong>
              <ul>
                <li>Request a static public IP from your ISP (often an additional fee).</li>
                <li>Use a Dynamic DNS (DDNS) service (e.g., No-IP, Dynu). DDNS services provide a hostname that updates when your IP changes, and you can point your domain to this DDNS hostname using a CNAME record. Some routers have built-in DDNS clients.</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <p className="mb-4">For this guide, we'll assume you have a public IP (either static or managed by DDNS).</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">2. Log in to Your Domain Registrar</h3>
      <p className="mb-2">
        Go to the website where you purchased the <strong>onlinerecycle.net</strong> domain (e.g., GoDaddy, Namecheap, Google Domains, etc.) and log in to your account.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">3. Find DNS Management Section</h3>
      <p className="mb-2">
        Navigate to the DNS management, DNS zone editor, or advanced DNS settings for <strong>onlinerecycle.net</strong>. The exact name varies by registrar.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4. Configure DNS Records</h3>
      <p className="mb-2">You'll primarily need to create or update 'A' records.</p>
      
      <h4 className="text-lg font-medium mt-4 mb-1">A Record for the Root Domain (<code>onlinerecycle.net</code>):</h4>
      <ul className="list-disc list-inside mb-2 pl-4 space-y-1">
        <li><strong>Type:</strong> A</li>
        <li><strong>Host/Name:</strong> <code>@</code> (or sometimes left blank, or <code>onlinerecycle.net.</code>) - this represents the root domain.</li>
        <li><strong>Value/Points to:</strong> Your server's public IP address.</li>
        <li><strong>TTL (Time To Live):</strong> Usually a default value (e.g., 1 hour or 3600 seconds) is fine. Lower it temporarily if testing frequent changes.</li>
      </ul>

      <h4 className="text-lg font-medium mt-4 mb-1">A Record for <code>www</code> (<code>www.onlinerecycle.net</code>):</h4>
      <p className="mb-1">You typically want <code>www.onlinerecycle.net</code> to also point to your server.</p>
      <ul className="list-disc list-inside mb-2 pl-4 space-y-1">
        <li><strong>Type:</strong> A</li>
        <li><strong>Host/Name:</strong> <code>www</code></li>
        <li><strong>Value/Points to:</strong> Your server's public IP address (same as above).</li>
        <li><strong>TTL:</strong> Same as above.</li>
      </ul>
      <p className="mb-2 text-sm">Alternatively, for the <code>www</code> record, some prefer to use a CNAME record pointing to the root domain if the registrar supports it for subdomains pointing to the root (e.g., Host: <code>www</code>, Value: <code>onlinerecycle.net</code>). Using an A record is simpler and more direct here.</p>
      
      <h4 className="text-lg font-medium mt-4 mb-1">MX Records (for Email - Optional):</h4>
      <p className="mb-2">
        If you plan to host email for <strong>onlinerecycle.net</strong> (which is a complex topic and often better handled by dedicated email providers), you would configure MX records here. If using a third-party email service (like Google Workspace, Zoho Mail), they will provide the MX records you need to enter.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">5. Save Changes and Wait for Propagation</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>After adding/updating records, save your changes.</li>
        <li>DNS changes can take time to propagate across the internet, anywhere from a few minutes to 48 hours (though usually much faster).</li>
        <li>You can use online tools like "DNS Checker" to see propagation status from different locations.</li>
      </ul>

      <p className="mt-4">
        Once DNS propagation is complete, typing <code>http://onlinerecycle.net</code> (or <code>https://onlinerecycle.net</code> if SSL is set up) into a browser should connect to your self-hosted server.
      </p>
    </div>
  );
};

export default DNSDomainStep;