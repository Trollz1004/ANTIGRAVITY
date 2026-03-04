@echo off
:: Haiku Sentry — periodic heartbeat
:: Called by Task Scheduler every 30 minutes

node C:\ANTIGRAVITY\scripts\haiku-sentry.js --heartbeat
