# Agent Health Monitoring System

This system monitors the health status of all agents in the Paperclip system by querying the Paperclip API.

## Files

- `agent_health_monitor.py` - Main Python script that checks agent health
- `setup_agent_monitor_task.ps1` - PowerShell script to set up hourly scheduled task
- `agent_monitor_env.example` - Example environment configuration file

## Setup Instructions

### 1. Install Dependencies

Make sure you have Python 3.7+ installed with the required packages:

```bash
pip install requests
```

### 2. Configure Environment

1. Copy `agent_monitor_env.example` to `.env`
2. Update the values with your Paperclip API configuration:
   - `PAPERCLIP_API_KEY` - Your Paperclip API key
   - `PAPERCLIP_COMPANY_ID` - Your Paperclip company ID
   - Optionally configure email alerts

### 3. Test the Script

Run the script manually to ensure it works:

```bash
python agent_health_monitor.py
```

### 4. Set Up Scheduled Task

Run the PowerShell setup script as Administrator:

```powershell
# Run PowerShell as Administrator
./setup_agent_monitor_task.ps1
```

This creates a scheduled task named "AgentHealthMonitor" that runs every hour.

## Features

1. **Agent Discovery** - Automatically discovers all agents in the Paperclip system
2. **Health Checking** - Checks each agent's heartbeat status
3. **Alert System** - Sends email alerts when agents are unhealthy
4. **Reporting** - Generates detailed reports on agent uptime and performance
5. **Logging** - Comprehensive logging for debugging and monitoring

## How It Works

The script performs the following steps:

1. Retrieves a list of all agents from the Paperclip API
2. Checks the status of each agent by examining their last heartbeat timestamp
3. Identifies agents that are:
   - Healthy (heartbeat within last 5 minutes)
   - Error (API error when checking status)
   - Unresponsive (no heartbeat for more than 5 minutes)
4. Sends alerts for problematic agents if email is configured
5. Generates a comprehensive report with uptime statistics

## Configuration

Environment variables:

- `PAPERCLIP_API_URL` - Paperclip API endpoint (default: http://localhost:3100/api)
- `PAPERCLIP_API_KEY` - API key for authenticating with Paperclip
- `PAPERCLIP_COMPANY_ID` - Your company ID in Paperclip
- `ALERT_EMAIL_ENABLED` - Enable/disable email alerts (true/false)
- `ALERT_EMAIL_FROM` - Sender email address for alerts
- `ALERT_EMAIL_TO` - Recipient email address for alerts
- `SMTP_SERVER` - SMTP server for sending emails
- `SMTP_PORT` - SMTP server port

## Troubleshooting

If the scheduled task isn't working:

1. Check Windows Task Scheduler for the "AgentHealthMonitor" task
2. Verify the task is enabled and running correctly
3. Check the logs in `agent_health_monitor.log`
4. Ensure Python is in the system PATH or update the PowerShell script with the full path

For API errors:

1. Verify `PAPERCLIP_API_KEY` and `PAPERCLIP_COMPANY_ID` are correct
2. Check that the Paperclip API is accessible
3. Confirm your API key has the necessary permissions
