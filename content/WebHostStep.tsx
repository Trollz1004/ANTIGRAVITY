
import React from 'react';
import { CodeBlock } from '../constants';

const WebHostStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Now, let's configure the web server to host <strong>onlinerecycle.net</strong>. This typically involves installing a web server (like Apache or Nginx), a database (like MySQL or PostgreSQL), and a server-side programming language (like PHP, Python, or Node.js) if your website is dynamic. This is often called a LAMP or LEMP stack.
      </p>
      <p className="mb-4">
        These instructions assume a Linux (Ubuntu Server) environment.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">1. Install Web Server (Choose Apache or Nginx)</h3>
      
      <h4 className="text-lg font-medium mt-4 mb-1">Option A: Apache</h4>
      <CodeBlock language="bash">{`sudo apt update
sudo apt install apache2
sudo systemctl enable apache2
sudo systemctl start apache2`}</CodeBlock>
      <p className="mt-1">Allow Apache through the firewall:</p>
      <CodeBlock language="bash">sudo ufw allow 'Apache Full'</CodeBlock>

      <h4 className="text-lg font-medium mt-4 mb-1">Option B: Nginx</h4>
      <CodeBlock language="bash">{`sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
sudo systemctl start nginx`}</CodeBlock>
      <p className="mt-1">Allow Nginx through the firewall:</p>
      <CodeBlock language="bash">sudo ufw allow 'Nginx Full'</CodeBlock>
      <p className="mt-2">For this guide, we'll proceed with examples primarily for <strong>Apache</strong> as it's very common, but Nginx is an excellent alternative, especially for performance.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">2. Install Database (e.g., MySQL)</h3>
      <p>Many websites require a database. MySQL is a popular choice.</p>
      <CodeBlock language="bash">{`sudo apt install mysql-server
sudo mysql_secure_installation`}</CodeBlock>
      <p className="mt-1">The <code>mysql_secure_installation</code> script will guide you through setting a root password, removing anonymous users, etc. It's highly recommended to run this.</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">3. Install Server-Side Language (e.g., PHP)</h3>
      <p>If <strong>onlinerecycle.net</strong> uses PHP:</p>
      <CodeBlock language="bash">{`sudo apt install php libapache2-mod-php php-mysql`}</CodeBlock>
      <p className="mt-1">This installs PHP, the Apache PHP module, and the PHP MySQL extension. Restart Apache to enable the module:</p>
      <CodeBlock language="bash">sudo systemctl restart apache2</CodeBlock>
      <p className="mt-1">For other languages like Node.js or Python, you'd install them and configure Apache/Nginx to proxy requests to your application (e.g., using PM2 for Node.js, Gunicorn/uWSGI for Python).</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4. Create Website Directory & Upload Files</h3>
      <p>Create a directory to hold your website's files:</p>
      <CodeBlock language="bash">sudo mkdir -p /var/www/onlinerecycle.net</CodeBlock>
      <p className="mt-1">Set appropriate ownership (replace <code>www-data</code> if your web server runs as a different user/group):</p>
      <CodeBlock language="bash">sudo chown -R www-data:www-data /var/www/onlinerecycle.net</CodeBlock>
      <p className="mt-1">Upload your <strong>onlinerecycle.net</strong> website files (HTML, CSS, JavaScript, PHP scripts, images, etc.) to this directory. You can use tools like <code>scp</code>, FTP/SFTP clients (e.g., FileZilla), or version control (Git).</p>
      <p className="mt-1">For testing, you can create a simple <code>index.html</code> file:</p>
      <CodeBlock language="bash">sudo nano /var/www/onlinerecycle.net/index.html</CodeBlock>
      <p>Add some content:</p>
      <CodeBlock language="html">{`<!DOCTYPE html>
<html>
<head>
    <title>Welcome to onlinerecycle.net</title>
</head>
<body>
    <h1>Success! The onlinerecycle.net virtual host is working!</h1>
</body>
</html>`}</CodeBlock>

      <h3 className="text-xl font-semibold mt-6 mb-2">5. Configure Virtual Host (Apache Example)</h3>
      <p>Create a virtual host configuration file for your domain. This tells Apache where to find the files for <strong>onlinerecycle.net</strong>.</p>
      <CodeBlock language="bash">sudo nano /etc/apache2/sites-available/onlinerecycle.net.conf</CodeBlock>
      <p>Add the following configuration (adjust as needed):</p>
      <CodeBlock language="apache">{`<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    ServerName onlinerecycle.net
    ServerAlias www.onlinerecycle.net
    DocumentRoot /var/www/onlinerecycle.net
    ErrorLog \${APACHE_LOG_DIR}/onlinerecycle.net_error.log
    CustomLog \${APACHE_LOG_DIR}/onlinerecycle.net_access.log combined
    <Directory /var/www/onlinerecycle.net>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>`}</CodeBlock>
      
      <p className="mt-2">Enable the new site configuration and disable the default one (optional):</p>
      <CodeBlock language="bash">{`sudo a2ensite onlinerecycle.net.conf
sudo a2dissite 000-default.conf  # Optional, if this is the only site
sudo apache2ctl configtest`}</CodeBlock>
      <p className="mt-1">If <code>configtest</code> shows "Syntax OK", reload Apache:</p>
      <CodeBlock language="bash">sudo systemctl reload apache2</CodeBlock>

      <p className="mt-4">
        At this point, if your DNS is not yet configured, you can test locally by editing your computer's <code>hosts</code> file to point <code>onlinerecycle.net</code> to your server's local IP address. The next steps will cover networking, DNS, and securing your site with HTTPS.
      </p>
    </div>
  );
};

export default WebHostStep;