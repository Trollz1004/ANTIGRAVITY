#!/usr/bin/env python3
"""
Agent Health Monitoring Script for Paperclip System

This script monitors the health status of all agents in the Paperclip system
by querying the Paperclip API. It checks agent statuses, sends alerts for
problematic agents, and generates uptime/performance reports.
"""

import os
import sys
import json
import logging
import requests
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("agent_health_monitor.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# Configuration
PAPERCLIP_API_URL = os.getenv("PAPERCLIP_API_URL", "http://localhost:3100/api")
PAPERCLIP_API_KEY = os.getenv("PAPERCLIP_API_KEY", "")
COMPANY_ID = os.getenv("PAPERCLIP_COMPANY_ID", "")
ALERT_EMAIL_ENABLED = os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true"
ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", "")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


class AgentHealthMonitor:
    def __init__(self):
        self.api_url = PAPERCLIP_API_URL
        self.headers = {
            "Authorization": f"Bearer {PAPERCLIP_API_KEY}",
            "Content-Type": "application/json",
        }
        self.company_id = COMPANY_ID

    def get_all_agents(self) -> List[Dict[str, Any]]:
        """
        Get a list of all agents in the system.

        Returns:
            List of agent dictionaries with their properties
        """
        try:
            url = f"{self.api_url}/companies/{self.company_id}/agents"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            agents = response.json()
            logger.info(f"Retrieved {len(agents)} agents")
            return agents
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get agents: {e}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse agents response: {e}")
            return []

    def check_agent_status(self, agent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check the status of a single agent.

        Args:
            agent: Agent dictionary

        Returns:
            Dictionary with agent status information
        """
        agent_id = agent.get("id", "")
        agent_name = agent.get("name", "Unknown")

        try:
            # Check agent heartbeat/run status
            url = f"{self.api_url}/agents/{agent_id}"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            agent_details = response.json()

            # Determine if agent is responsive based on last heartbeat
            last_heartbeat = agent_details.get("lastHeartbeatAt", None)
            status = "unknown"

            if last_heartbeat:
                # Parse ISO format timestamp
                try:
                    heartbeat_time = datetime.fromisoformat(
                        last_heartbeat.replace("Z", "+00:00")
                    )
                    time_diff = datetime.now(heartbeat_time.tzinfo) - heartbeat_time

                    # Consider agent unhealthy if no heartbeat in last 5 minutes
                    if time_diff > timedelta(minutes=5):
                        status = "error"
                    else:
                        status = "healthy"
                except ValueError:
                    status = "error"
            else:
                status = "unresponsive"

            logger.info(f"Agent {agent_name} ({agent_id}) status: {status}")

            return {
                "id": agent_id,
                "name": agent_name,
                "status": status,
                "last_heartbeat": last_heartbeat,
                "details": agent_details,
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to check status for agent {agent_name}: {e}")
            return {
                "id": agent_id,
                "name": agent_name,
                "status": "error",
                "error": str(e),
            }

    def send_alert(self, agent_status: Dict[str, Any]) -> None:
        """
        Send alert when an agent is in error status or unresponsive.

        Args:
            agent_status: Agent status dictionary
        """
        if not ALERT_EMAIL_ENABLED:
            logger.info("Email alerts disabled")
            return

        if not ALERT_EMAIL_FROM or not ALERT_EMAIL_TO:
            logger.warning("Email configuration incomplete, skipping alert")
            return

        agent_name = agent_status.get("name", "Unknown")
        status = agent_status.get("status", "unknown")

        subject = f"Agent Health Alert: {agent_name} is {status}"
        body = f"""
Agent Health Monitor Alert

Agent: {agent_name}
Status: {status}
Time: {datetime.now().isoformat()}

Details:
{json.dumps(agent_status, indent=2)}
        """

        try:
            msg = MIMEMultipart()
            msg["From"] = ALERT_EMAIL_FROM
            msg["To"] = ALERT_EMAIL_TO
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            # server.login(SMTP_USER, SMTP_PASSWORD)  # Add if authentication needed
            server.send_message(msg)
            server.quit()

            logger.info(f"Alert sent for agent {agent_name}")
        except Exception as e:
            logger.error(f"Failed to send alert for agent {agent_name}: {e}")

    def generate_report(self, agent_statuses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a report of agent uptime and performance.

        Args:
            agent_statuses: List of agent status dictionaries

        Returns:
            Dictionary with report data
        """
        healthy_count = sum(1 for s in agent_statuses if s.get("status") == "healthy")
        error_count = sum(1 for s in agent_statuses if s.get("status") == "error")
        unresponsive_count = sum(
            1 for s in agent_statuses if s.get("status") == "unresponsive"
        )
        unknown_count = sum(1 for s in agent_statuses if s.get("status") == "unknown")

        report = {
            "generated_at": datetime.now().isoformat(),
            "total_agents": len(agent_statuses),
            "healthy_agents": healthy_count,
            "error_agents": error_count,
            "unresponsive_agents": unresponsive_count,
            "unknown_agents": unknown_count,
            "uptime_percentage": (healthy_count / len(agent_statuses) * 100)
            if agent_statuses
            else 0,
            "agent_details": agent_statuses,
        }

        # Save report to file
        report_file = (
            f"agent_health_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        try:
            with open(report_file, "w") as f:
                json.dump(report, f, indent=2)
            logger.info(f"Report saved to {report_file}")
        except Exception as e:
            logger.error(f"Failed to save report: {e}")

        return report

    def run_health_check(self) -> None:
        """
        Run the complete health check process.
        """
        logger.info("Starting agent health check")

        # Get all agents
        agents = self.get_all_agents()
        if not agents:
            logger.error("No agents found or failed to retrieve agents")
            return

        # Check status of each agent
        agent_statuses = []
        problem_agents = []

        for agent in agents:
            status = self.check_agent_status(agent)
            agent_statuses.append(status)

            # Track problematic agents
            if status.get("status") in ["error", "unresponsive"]:
                problem_agents.append(status)

        # Send alerts for problematic agents
        for agent_status in problem_agents:
            self.send_alert(agent_status)

        # Generate report
        report = self.generate_report(agent_statuses)

        # Log summary
        logger.info(
            f"Health check complete: {report['healthy_agents']}/{report['total_agents']} agents healthy"
        )

        if problem_agents:
            logger.warning(f"Found {len(problem_agents)} problematic agents:")
            for agent in problem_agents:
                logger.warning(f"  - {agent['name']}: {agent['status']}")


def main():
    """Main function to run the agent health monitor."""
    monitor = AgentHealthMonitor()
    monitor.run_health_check()


if __name__ == "__main__":
    main()
