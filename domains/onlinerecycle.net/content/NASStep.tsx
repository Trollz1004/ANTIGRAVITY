
import React from 'react';
import { CodeBlock } from '../constants';

const NASStep: React.FC = () => {
  return (
    <div>
      <p className="mb-4 text-lg">
        Once your OS is installed and configured, you can set up the Network Attached Storage (NAS) functionality. This involves creating shared folders accessible over your local network.
      </p>
      <p className="mb-4">
        The most common way to create network shares compatible with Windows, macOS, and Linux clients is using <strong>Samba</strong> on a Linux server. If you chose a dedicated NAS OS like TrueNAS or OpenMediaVault, these steps will largely be done through their web interface.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">Setting up Samba on Linux (e.g., Ubuntu Server):</h3>
      
      <h4 className="text-lg font-medium mt-4 mb-1">1. Install Samba:</h4>
      <p>Open a terminal on your server and run:</p>
      <CodeBlock language="bash">{`sudo apt update
sudo apt install samba`}</CodeBlock>

      <h4 className="text-lg font-medium mt-4 mb-1">2. Create a Directory to Share:</h4>
      <p>Decide where your shared files will reside. For example, to create a share named "onlinedata":</p>
      <CodeBlock language="bash">{`sudo mkdir -p /srv/samba/onlinedata`}</CodeBlock>
      <p className="mt-1">Set appropriate permissions (this example gives full access to a group you'll create, `sambashare`):</p>
      <CodeBlock language="bash">{`sudo chgrp sambashare /srv/samba/onlinedata
sudo chmod 770 /srv/samba/onlinedata`}</CodeBlock>
      <p className="text-sm mt-1">Note: You might need to create the `sambashare` group first: `sudo addgroup sambashare` and add users to it: `sudo usermod -aG sambashare your_username`.</p>


      <h4 className="text-lg font-medium mt-4 mb-1">3. Configure Samba:</h4>
      <p>Edit the Samba configuration file, typically located at <code>/etc/samba/smb.conf</code>. First, back it up:</p>
      <CodeBlock language="bash">sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.backup</CodeBlock>
      <p>Then open it with a text editor (e.g., nano):</p>
      <CodeBlock language="bash">sudo nano /etc/samba/smb.conf</CodeBlock>
      <p>Scroll to the end of the file and add a new share definition. For example:</p>
      <CodeBlock language="ini">{`[onlinedata]
   comment = OnlineRecycle Project Data
   path = /srv/samba/onlinedata
   browseable = yes
   writable = yes
   guest ok = no
   read only = no
   valid users = @sambashare  # Or specific usernames: user1, user2
   # force user = your_username # Optional: files created will be owned by this user
   # force group = sambashare # Optional: files created will belong to this group`}</CodeBlock>
      <p className="mt-1">
        Save the file and exit (Ctrl+X, then Y, then Enter in nano).
      </p>
      <p className="text-sm mt-1">
        <strong>Explanation of options:</strong>
      </p>
      <ul className="list-disc list-inside mb-2 pl-4 text-sm space-y-1">
        <li><code>[onlinedata]</code>: The name of the share as it will appear on the network.</li>
        <li><code>comment</code>: A description for the share.</li>
        <li><code>path</code>: The actual directory path on the server.</li>
        <li><code>browseable</code>: Whether the share is visible in network browsers.</li>
        <li><code>writable</code>: Allows users to write to the share.</li>
        <li><code>guest ok</code>: Set to 'no' to require authentication.</li>
        <li><code>read only</code>: Set to 'no' for write access.</li>
        <li><code>valid users</code>: Specifies which users or groups can access the share. <code>@groupname</code> for groups.</li>
      </ul>


      <h4 className="text-lg font-medium mt-4 mb-1">4. Create Samba Users:</h4>
      <p>Samba uses its own password database. You need to add existing system users to Samba and set their Samba passwords. Replace <code>your_username</code> with an actual system user (who should also be in the <code>sambashare</code> group if you used that in <code>smb.conf</code>).</p>
      <CodeBlock language="bash">sudo smbpasswd -a your_username</CodeBlock>
      <p>You'll be prompted to set a password for this user for Samba access.</p>

      <h4 className="text-lg font-medium mt-4 mb-1">5. Restart Samba Service:</h4>
      <p>Apply the changes by restarting the Samba services:</p>
      <CodeBlock language="bash">{`sudo systemctl restart smbd
sudo systemctl restart nmbd`}</CodeBlock>
      <p>And enable them to start on boot:</p>
      <CodeBlock language="bash">{`sudo systemctl enable smbd
sudo systemctl enable nmbd`}</CodeBlock>

      <h4 className="text-lg font-medium mt-4 mb-1">6. Firewall Configuration (if ufw is enabled):</h4>
      <p>Allow Samba traffic through the firewall:</p>
      <CodeBlock language="bash">sudo ufw allow samba</CodeBlock>

      <h3 className="text-xl font-semibold mt-8 mb-2">Accessing the Share:</h3>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li><strong>Windows:</strong> Open File Explorer, type <code>\\\\YOUR_SERVER_IP\\onlinedata</code> in the address bar.</li>
        <li><strong>macOS:</strong> Open Finder, go to "Go" &gt; "Connect to Server...", type <code>smb://YOUR_SERVER_IP/onlinedata</code>.</li>
        <li><strong>Linux:</strong> Use your file manager's "Connect to Server" option or mount via command line.</li>
      </ul>
      <p>You should be prompted for the username and password you set with <code>smbpasswd</code>.</p>

      <p className="mt-6">
        This is a basic Samba setup. For more advanced configurations, including different permission levels, guest access, or integration with other services, consult the official Samba documentation.
      </p>
    </div>
  );
};

export default NASStep;